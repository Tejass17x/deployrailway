const express = require('express');
const router = express.Router();
const networkController = require('../controller/network.controller');
const { authMiddleware } = require('../../../common/middlewares/auth.middleware');

// All network routes require authentication
router.use(authMiddleware);

// Network overview statistics counts
router.get('/overview', networkController.getOverview);

// Connections list
router.get('/connections', networkController.getConnections);

// Followers list
router.get('/followers', networkController.getFollowers);

// Following list
router.get('/following', networkController.getFollowing);

// Suggestions (People You May Know)
router.get('/suggestions', networkController.getSuggestions);

// Received and sent requests
router.get('/requests', networkController.getRequests);

// Send or auto-accept connection request
router.post('/connect', networkController.connect);

// Follow user
router.post('/follow', networkController.follow);

// Unfollow user
router.post('/unfollow', networkController.unfollow);

// Accept connection request
router.post('/accept', networkController.accept);

// Reject connection request
router.post('/reject', networkController.reject);

// Remove connection
router.delete('/remove/:connectionId', networkController.remove);

// Mutual connections
router.get('/mutual/:userId', networkController.getMutual);

// Global network search
router.get('/search', networkController.search);

// AI Recommendations
router.get('/recommendations', networkController.getRecommendations);

module.exports = router;
