const express = require('express');
const router = express.Router();
const messageController = require('../controller/message.controller');
const { authMiddleware } = require('../../../common/middlewares/auth.middleware');
const { validateConversationId } = require('../validators/message.validator');

// Auth middleware for all conversation actions
router.use(authMiddleware);

// GET & POST Conversations
router.get('/', messageController.getUserConversations);
router.post('/', messageController.createConversation);

// Single conversation actions
router.get('/:conversationId', validateConversationId, messageController.getConversationById);
router.delete('/:conversationId', validateConversationId, messageController.deleteConversation);

// Pin / Unpin
router.patch('/:conversationId/pin', validateConversationId, messageController.pinConversation);
router.patch('/:conversationId/unpin', validateConversationId, messageController.unpinConversation);

// Archive / Restore
router.patch('/:conversationId/archive', validateConversationId, messageController.archiveConversation);
router.patch('/:conversationId/restore', validateConversationId, messageController.restoreConversation);

// Mute / Unmute
router.patch('/:conversationId/mute', validateConversationId, messageController.muteConversation);
router.patch('/:conversationId/unmute', validateConversationId, messageController.unmuteConversation);

module.exports = router;
