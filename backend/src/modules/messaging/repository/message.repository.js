const BaseRepository = require('../../../common/repository/base.repository');
const Conversation = require('../model/Conversation');
const Message = require('../model/Message');
const PinnedChat = require('../model/PinnedChat');
const ArchivedChat = require('../model/ArchivedChat');
const MessageAttachment = require('../model/MessageAttachment');
const MessageReaction = require('../model/MessageReaction');
const Profile = require('../../../models/Profile');
const Presence = require('../../../socket/presence/Presence');
const { isUserOnline } = require('../../../config/socket');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  /**
   * Find or create conversation between two users
   */
  async findOrCreateConversation(userA, userB) {
    let conv = await Conversation.findOne({
      participants: { $all: [userA, userB] }
    });
    
    if (!conv) {
      conv = new Conversation({ participants: [userA, userB] });
      await conv.save();
    }
    return conv;
  }

  /**
   * Get all conversations for a user including lastMessage, unread count, pin and archive status
   */
  async getUserConversations(userId) {
    const userIdStr = userId.toString();

    // Fetch all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'firstName lastName profileImage username profileSlug slug email createdAt')
      .populate({
        path: 'lastMessageId',
        populate: { path: 'attachmentId' }
      })
      .sort({ lastMessageTime: -1 })
      .lean();

    // Extract all unique other participant IDs
    const otherParticipantIds = [];
    conversations.forEach((conv) => {
      if (conv.participants) {
        const other = conv.participants.find(p => p._id.toString() !== userIdStr);
        if (other && other._id) {
          otherParticipantIds.push(other._id);
        }
      }
    });

    // Fetch all profiles and presence statuses in bulk (resolve N+1 query problem)
    const profiles = await Profile.find({ userId: { $in: otherParticipantIds } }).lean();
    const presences = await Presence.find({ userId: { $in: otherParticipantIds } }).lean();

    const profileMap = new Map();
    profiles.forEach(p => profileMap.set(p.userId.toString(), p));

    const presenceMap = new Map();
    presences.forEach(pr => presenceMap.set(pr.userId.toString(), pr));

    // Process each conversation
    const processed = conversations.map((conv) => {
      const otherParticipant = conv.participants ? conv.participants.find(
        p => p._id.toString() !== userIdStr
      ) : null;

      let detailedParticipant = null;
      if (otherParticipant) {
        const otherIdStr = otherParticipant._id.toString();
        const profile = profileMap.get(otherIdStr) || {};
        const presence = presenceMap.get(otherIdStr);
        detailedParticipant = {
          ...otherParticipant,
          profileImage: otherParticipant.profileImage?.url || otherParticipant.profileImage || '',
          isOnline: presence ? presence.status === 'online' : false,
          lastSeen: presence?.lastSeen || null,
          bio: profile.bio || '',
          institution: profile.institution || '',
          department: profile.department || '',
          designation: profile.designation || '',
          skills: profile.skills || [],
          metrics: profile.metrics || { totalCitations: 0, researchScore: 0 },
          connectionsCount: profile.connectionsCount || 0,
          followersCount: profile.followersCount || 0,
          followingCount: profile.followingCount || 0
        };
      }

      // Get unread count from precomputed Map if exists, otherwise default to 0
      let unreadCount = 0;
      if (conv.unreadCounts) {
        if (conv.unreadCounts instanceof Map) {
          unreadCount = conv.unreadCounts.get(userIdStr) || 0;
        } else {
          unreadCount = conv.unreadCounts[userIdStr] || 0;
        }
      }

      const isPinned = Array.isArray(conv.isPinned) && conv.isPinned.map(id => id.toString()).includes(userIdStr);
      const isArchived = Array.isArray(conv.isArchived) && conv.isArchived.map(id => id.toString()).includes(userIdStr);
      const isMuted = Array.isArray(conv.isMuted) && conv.isMuted.map(id => id.toString()).includes(userIdStr);

      // Map lastMessageId to lastMessage for backward compatibility
      const legacyLastMessage = conv.lastMessageId ? {
        ...conv.lastMessageId,
        attachment: conv.lastMessageId.attachmentId
      } : null;

      return {
        ...conv,
        lastMessage: legacyLastMessage,
        otherParticipant: detailedParticipant,
        unreadCount,
        isPinned,
        isArchived,
        isMuted
      };
    });

    return processed;
  }

  /**
   * Get cursor paginated message history for a conversation
   */
  async getConversationMessages(conversationId, { limit = 20, cursor, userId }) {
    const query = { conversationId };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    if (userId) {
      query.deletedBy = { $ne: userId };
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('senderId', 'firstName lastName profileImage username profileSlug slug')
      .populate('attachment')
      .populate('attachmentId')
      .populate('replyTo')
      .lean();

    const hasNextPage = messages.length > limit;
    if (hasNextPage) {
      messages.pop(); // Remove extra record
    }

    // Retrieve reactions for these messages
    const messageIds = messages.map(m => m._id);
    const reactions = await MessageReaction.find({ messageId: { $in: messageIds } })
      .populate('userId', 'firstName lastName username profileSlug slug')
      .lean();

    // Attach reactions to messages
    const messagesWithReactions = messages.map(m => {
      const msgReactions = reactions.filter(
        r => r.messageId.toString() === m._id.toString()
      );
      // Map attachmentId to attachment if attachment is missing
      const resolvedAttachment = m.attachment || m.attachmentId;
      return {
        ...m,
        attachment: resolvedAttachment,
        reactions: msgReactions
      };
    });

    // We return list in chronological order (oldest first)
    messagesWithReactions.reverse();

    return {
      docs: messagesWithReactions,
      nextCursor: hasNextPage && messages.length > 0 ? messages[0]._id : null,
      hasNextPage
    };
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(userId, queryText) {
    // Find user's conversations
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);

    return await Message.find({
      conversationId: { $in: conversationIds },
      text: { $regex: queryText, $options: 'i' },
      deleted: false
    })
      .populate('conversationId')
      .populate('senderId', 'firstName lastName profileImage profileSlug slug username')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  /**
   * Get all shared files/attachments in user's conversations
   */
  async getSharedFiles(userId) {
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);

    return await Message.find({
      conversationId: { $in: conversationIds },
      attachment: { $ne: null },
      deleted: false
    })
      .populate('attachment')
      .populate('senderId', 'firstName lastName profileImage profileSlug slug username')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new MessageRepository();
