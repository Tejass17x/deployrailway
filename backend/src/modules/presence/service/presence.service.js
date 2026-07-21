const presenceManager = require('../../../socket/presence/presence.manager');
const presenceRepository = require('../repository/presence.repository');
const { getIO } = require('../../../config/socket');

class PresenceService {
  async getPresence(userId) {
    let presence = await presenceRepository.findOne({ userId });
    if (!presence) {
      presence = { userId, status: 'offline', lastSeen: new Date() };
    }
    return presence;
  }

  async setOnline(userId, device = 'desktop') {
    const socketId = `rest-session-${Date.now()}`;
    const io = getIO();
    await presenceManager.setUserOnline(userId, socketId, { device }, io);
    return { success: true, status: 'online' };
  }

  async setOffline(userId) {
    const lastSeen = new Date();
    await presenceRepository.updateMany(
      { userId: userId.toString() },
      { status: 'offline', lastSeen },
      { upsert: true }
    );
    const io = getIO();
    if (io) {
      await presenceManager.broadcastPresence(userId, 'offline', lastSeen, io);
    }
    return { success: true, status: 'offline' };
  }
}

module.exports = new PresenceService();
