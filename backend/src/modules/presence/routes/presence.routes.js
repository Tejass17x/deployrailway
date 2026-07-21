const express = require('express');
const router = express.Router();
const presenceController = require('../controller/presence.controller');
const { authMiddleware } = require('../../../common/middlewares/auth.middleware');

// Apply auth middleware to all presence routes
router.use(authMiddleware);

router.get('/:userId', presenceController.getPresence);
router.patch('/online', presenceController.setOnline);
router.patch('/offline', presenceController.setOffline);

module.exports = router;
