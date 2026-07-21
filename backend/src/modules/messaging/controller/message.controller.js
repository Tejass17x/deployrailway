const messageService = require('../service/message.service');
const r2Service = require('../../upload/service/r2.service');
const MessageAttachment = require('../model/MessageAttachment');
const { ValidationError } = require('../../../common/errors/AppError');

class MessageController {
  /**
   * Get or create a conversation with a given participant
   * POST /conversations  { participantId }
   */
  async createConversation(req, res, next) {
    try {
      const { participantId } = req.body;
      if (!participantId) throw new ValidationError('participantId is required.');
      const data = await messageService.getOrCreateConversation(req.user.id, participantId);
      res.status(200).json({
        success: true,
        message: 'Conversation retrieved or created successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send a message using the conversationId from the URL param
   * POST /conversations/:conversationId/messages  { content, attachments? }
   */
  async sendMessageToConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { content, attachments, type, replyTo } = req.body;
      const data = await messageService.sendMessage(req.user.id, {
        conversationId,
        type: type || 'text',
        text: content,
        replyTo: replyTo || null,
        attachmentId: (attachments && attachments[0]) || null
      });
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }


  /**
   * Get all active conversations for the authenticated user
   */
  async getUserConversations(req, res, next) {
    try {
      const data = await messageService.getUserConversations(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Conversations retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get paginated messages for a conversation
   */
  async getConversationMessages(req, res, next) {
    try {
      const { limit, cursor } = req.query;
      const data = await messageService.getConversationMessages(
        req.user.id,
        req.params.conversationId,
        {
          limit: limit ? parseInt(limit, 10) : 20,
          cursor
        }
      );
      res.status(200).json({
        success: true,
        message: 'Messages retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(req, res, next) {
    try {
      const data = await messageService.sendMessage(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(req, res, next) {
    try {
      const conversationId = req.params.conversationId || req.body.conversationId || req.params.id || req.body.id;
      if (!conversationId) {
        throw new ValidationError('conversationId is required.');
      }
      const data = await messageService.markAsRead(req.user.id, conversationId);
      res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pin a conversation
   */
  async pinConversation(req, res, next) {
    try {
      const data = await messageService.pinConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation pinned successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unpin a conversation
   */
  async unpinConversation(req, res, next) {
    try {
      const data = await messageService.unpinConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation unpinned successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(req, res, next) {
    try {
      const data = await messageService.archiveConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation archived successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Restore/Unarchive a conversation
   */
  async restoreConversation(req, res, next) {
    try {
      const data = await messageService.restoreConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation restored successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Edit a message
   */
  async editMessage(req, res, next) {
    try {
      const messageId = req.params.id || req.body.messageId;
      const { text } = req.body;
      if (!text || text.trim() === '') {
        throw new ValidationError('Message text is required to edit.');
      }
      const data = await messageService.editMessage(req.user.id, messageId, text.trim());
      res.status(200).json({
        success: true,
        message: 'Message edited successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(req, res, next) {
    try {
      const messageId = req.params.id || req.body.messageId;
      const { deleteType } = req.body; // 'everyone' or 'me'
      const data = await messageService.deleteMessage(req.user.id, messageId, deleteType);
      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add a reaction to a message
   */
  async reactToMessage(req, res, next) {
    try {
      const messageId = req.params.id || req.body.messageId;
      const { reaction } = req.body;
      const data = await messageService.reactToMessage(req.user.id, messageId, reaction);
      res.status(200).json({
        success: true,
        message: 'Reaction updated successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Search messages across user conversations
   */
  async searchMessages(req, res, next) {
    try {
      const { q } = req.query;
      const data = await messageService.searchMessages(req.user.id, q);
      res.status(200).json({
        success: true,
        message: 'Messages search results retrieved',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload an attachment file
   */
  async uploadAttachment(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded.');
      }

      const uploaded = await r2Service.uploadFileBuffer(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
        'message-attachment',
        null,
        req.file.mimetype
      );

      const attachment = new MessageAttachment({
        url: uploaded.secure_url || uploaded.url,
        objectKey: uploaded.public_id || uploaded.objectKey || null,
        storageProvider: 'r2',
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.id
      });

      await attachment.save();

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: attachment,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Start a call log
   */
  async startCall(req, res, next) {
    try {
      const { type, targetUserId, conversationId } = req.body;
      const data = await messageService.logCallStart(req.user.id, { type, targetUserId, conversationId });
      res.status(200).json({
        success: true,
        message: 'Call started successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * End a call log
   */
  async endCall(req, res, next) {
    try {
      const { callId, status } = req.body;
      const data = await messageService.logCallEnd(req.user.id, callId, status);
      res.status(200).json({
        success: true,
        message: 'Call ended successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get call history
   */
  async getCallHistory(req, res, next) {
    try {
      const data = await messageService.getCallHistory(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Call history retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a group conversation
   */
  async createGroup(req, res, next) {
    try {
      const { name, description, participantIds } = req.body;
      const data = await messageService.createGroup(req.user.id, name, description, participantIds);
      res.status(200).json({
        success: true,
        message: 'Group created successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Invite member to group
   */
  async inviteToGroup(req, res, next) {
    try {
      const { conversationId, participantIds } = req.body;
      const data = await messageService.inviteToGroup(req.user.id, conversationId, participantIds);
      res.status(200).json({
        success: true,
        message: 'Members invited successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get shared files list
   */
  async getSharedFiles(req, res, next) {
    try {
      const data = await messageService.getSharedFiles(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Shared files retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /contacts
   * Returns the authenticated user's connections, followers, and following
   * each enriched with online status and existingConversationId.
   */
  async getMessagingContacts(req, res, next) {
    try {
      const data = await messageService.getMessagingContacts(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Messaging contacts retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /requests
   * Returns pending received connection requests for the messaging Requests tab.
   */
  async getConnectionRequests(req, res, next) {
    try {
      const data = await messageService.getConnectionRequests(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Connection requests retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single conversation details
   */
  async getConversationById(req, res, next) {
    try {
      const data = await messageService.getConversationById(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation details retrieved successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mute conversation
   */
  async muteConversation(req, res, next) {
    try {
      const data = await messageService.muteConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation muted successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unmute conversation
   */
  async unmuteConversation(req, res, next) {
    try {
      const data = await messageService.unmuteConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation unmuted successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(req, res, next) {
    try {
      const data = await messageService.deleteConversation(req.user.id, req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully',
        data,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MessageController();
