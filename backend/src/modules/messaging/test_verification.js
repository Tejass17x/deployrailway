const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { connectDB } = require('../../config/database/connection');
const mongoose = require('mongoose');

// Mock socket config before importing service
const socketConfig = require('../../config/socket');
const mockEmits = [];
socketConfig.emitToUser = (userId, event, data) => {
  mockEmits.push({ target: 'user', id: userId.toString(), event, data });
  console.log(`[MOCK SOCKET] emitToUser (User: ${userId}, Event: ${event})`);
};
socketConfig.emitToRoom = (roomId, event, data) => {
  mockEmits.push({ target: 'room', id: roomId, event, data });
  console.log(`[MOCK SOCKET] emitToRoom (Room: ${roomId}, Event: ${event})`);
};
socketConfig.isUserOnline = (userId) => {
  return true; // Mock online presence
};

const messageService = require('./service/message.service');
const searchService = require('../search/service/search.service');

const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');
const Connection = require('../../../src/models/Connection');
const Follow = require('../../../src/models/Follow');
const Conversation = require('./model/Conversation');
const Message = require('./model/Message');
const MessageReaction = require('./model/MessageReaction');
const Notification = require('../../../src/models/Notification');
const ConnectionRequest = require('../connections/model/ConnectionRequest');
const Call = require('../../../src/models/Call');
const MessageAttachment = require('./model/MessageAttachment');

async function runTests() {
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected!');

  // Create temporary test users
  const uniqueSuffix = Date.now().toString();
  const testUserA = new User({
    firstName: 'TestUserA',
    lastName: 'Messaging' + uniqueSuffix,
    username: 'testusera_' + uniqueSuffix,
    email: 'testusera_' + uniqueSuffix + '@example.com',
    password: 'Password123!',
    role: 'researcher',
    isActive: true
  });
  
  const testUserB = new User({
    firstName: 'TestUserB',
    lastName: 'Messaging' + uniqueSuffix,
    username: 'testuserb_' + uniqueSuffix,
    email: 'testuserb_' + uniqueSuffix + '@example.com',
    password: 'Password123!',
    role: 'researcher',
    isActive: true
  });

  await testUserA.save();
  await testUserB.save();
  console.log(`Created test users: User A (${testUserA._id}), User B (${testUserB._id})`);

  let conn;
  let conv;

  try {
    // Test 1: Check CanChat (should be false initially)
    console.log('\n--- Test 1: Chat permissions (Not Connected/Following) ---');
    let canChat = await messageService.checkCanChat(testUserA._id, testUserB._id);
    console.log(`Can chat initially: ${canChat} (Expected: false)`);
    if (canChat !== false) throw new Error('Assertion failed: should not be allowed to chat');

    // Test 2: Connect them
    console.log('\n--- Test 2: Chat permissions (Connected) ---');
    const sorted = [testUserA._id.toString(), testUserB._id.toString()].sort();
    conn = new Connection({
      researcherA: sorted[0],
      researcherB: sorted[1],
      status: 'accepted'
    });
    await conn.save();

    canChat = await messageService.checkCanChat(testUserA._id, testUserB._id);
    console.log(`Can chat after connection: ${canChat} (Expected: true)`);
    if (canChat !== true) throw new Error('Assertion failed: should be allowed to chat');

    // Test 3: Get or create conversation
    console.log('\n--- Test 3: Get or Create Conversation ---');
    conv = await messageService.getOrCreateConversation(testUserA._id, testUserB._id);
    console.log(`Conversation ID: ${conv._id}`);
    console.log(`Participants: ${conv.participants.join(', ')}`);
    console.log(`Unread counts map:`, conv.unreadCounts);
    if (!conv._id) throw new Error('Assertion failed: Conversation not created');

    // Test 4: Send Message
    console.log('\n--- Test 4: Send Message ---');
    mockEmits.length = 0; // Clear mock records
    const msg = await messageService.sendMessage(testUserA._id, {
      conversationId: conv._id,
      receiverId: testUserB._id,
      text: 'Hello test message!',
      type: 'text'
    });
    console.log(`Sent message ID: ${msg._id}`);
    console.log(`Message text: "${msg.text}"`);
    console.log(`Message status: "${msg.status}" (Expected: delivered, since recipient mock is online)`);
    if (msg.status !== 'delivered') throw new Error('Assertion failed: status should be delivered');

    // Check Conversation document unread counts
    const updatedConv = await Conversation.findById(conv._id);
    console.log(`Updated Conversation Unread map:`, updatedConv.unreadCounts);
    console.log(`Unread count for User B: ${updatedConv.unreadCounts.get(testUserB._id.toString())} (Expected: 1)`);
    if (updatedConv.unreadCounts.get(testUserB._id.toString()) !== 1) {
      throw new Error('Assertion failed: Unread count for User B should be 1');
    }

    // Verify socket emissions
    console.log(`Socket emissions count: ${mockEmits.length}`);
    const messageNewEmit = mockEmits.find(e => e.event === 'message:new');
    console.log(`Has message:new emission: ${!!messageNewEmit}`);
    if (!messageNewEmit) throw new Error('Assertion failed: missing message:new socket emit');

    // Test 5: Mark as Read
    console.log('\n--- Test 5: Mark as Read ---');
    mockEmits.length = 0;
    await messageService.markAsRead(testUserB._id, conv._id);
    const readConv = await Conversation.findById(conv._id);
    console.log(`Unread count for User B after reading: ${readConv.unreadCounts.get(testUserB._id.toString())} (Expected: 0)`);
    if (readConv.unreadCounts.get(testUserB._id.toString()) !== 0) {
      throw new Error('Assertion failed: Unread count should reset to 0');
    }
    const messageReadEmit = mockEmits.find(e => e.event === 'messageRead');
    console.log(`Has messageRead socket emission: ${!!messageReadEmit}`);
    if (!messageReadEmit) throw new Error('Assertion failed: missing messageRead socket emit');

    // Test 6: Pin & Archive
    console.log('\n--- Test 6: Pin and Archive ---');
    await messageService.pinConversation(testUserA._id, conv._id);
    await messageService.archiveConversation(testUserA._id, conv._id);
    const pinArcConv = await Conversation.findById(conv._id).lean();
    const isPinned = pinArcConv.isPinned.map(id => id.toString()).includes(testUserA._id.toString());
    const isArchived = pinArcConv.isArchived.map(id => id.toString()).includes(testUserA._id.toString());
    console.log(`Is pinned for User A: ${isPinned} (Expected: true)`);
    console.log(`Is archived for User A: ${isArchived} (Expected: true)`);
    if (!isPinned || !isArchived) throw new Error('Assertion failed: Pin/Archive state arrays not updated');

    // Test 7: Edit message
    console.log('\n--- Test 7: Edit Message ---');
    const editedMsg = await messageService.editMessage(testUserA._id, msg._id, 'Hello updated message text!');
    console.log(`Edited Message Text: "${editedMsg.text}"`);
    console.log(`Edited Flag: ${editedMsg.edited} (Expected: true)`);
    if (!editedMsg.edited || editedMsg.text !== 'Hello updated message text!') {
      throw new Error('Assertion failed: message edit not completed correctly');
    }

    // Test 8: React to message
    console.log('\n--- Test 8: React to Message ---');
    const reactions = await messageService.reactToMessage(testUserB._id, msg._id, 'thumbs_up');
    console.log(`Reactions count: ${reactions.length}`);
    console.log(`Reaction text: "${reactions[0].reaction}"`);
    if (reactions.length !== 1 || reactions[0].reaction !== 'thumbs_up') {
      throw new Error('Assertion failed: reaction not added');
    }

    // Test 9: Search conversations & messages
    console.log('\n--- Test 9: Search Service ---');
    const searchConvs = await searchService.searchConversations(testUserA._id, 'TestUserB');
    console.log(`Search Conversations count: ${searchConvs.length}`);
    if (searchConvs.length === 0) throw new Error('Assertion failed: conversation search empty');

    const searchMsgs = await searchService.searchMessages(testUserA._id, 'updated');
    console.log(`Search Messages count: ${searchMsgs.length}`);
    if (searchMsgs.length === 0) throw new Error('Assertion failed: message search empty');

    console.log('\n=====================================');
    console.log('🎉 ALL messaging system integration tests PASSED successfully!');
    console.log('=====================================');

  } finally {
    // Cleanup test data
    console.log('\nCleaning up test data...');
    if (conn && conn._id) {
      await Connection.deleteOne({ _id: conn._id });
    }
    await MessageReaction.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    if (conv && conv._id) {
      await Message.deleteMany({ conversationId: conv._id });
      await Conversation.deleteOne({ _id: conv._id });
    }
    await User.deleteMany({ _id: { $in: [testUserA._id, testUserB._id] } });
    await mongoose.disconnect();
    console.log('Cleanup finished.');
  }
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
