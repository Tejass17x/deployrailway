const presenceService = require('../service/presence.service');

class PresenceController {
  async getPresence(req, res, next) {
    try {
      const { userId } = req.params;
      const data = await presenceService.getPresence(userId);
      return res.success('Presence status retrieved successfully', data, 200);
    } catch (err) {
      next(err);
    }
  }

  async setOnline(req, res, next) {
    try {
      const { device } = req.body;
      const data = await presenceService.setOnline(req.user.id, device);
      return res.success('User status set to online', data, 200);
    } catch (err) {
      next(err);
    }
  }

  async setOffline(req, res, next) {
    try {
      const data = await presenceService.setOffline(req.user.id);
      return res.success('User status set to offline', data, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PresenceController();
