const BaseService = require('../../../common/service/base.service');
const notificationRepository = require('../repository/notification.repository');
const Notification = require('../../../models/Notification');
const Profile = require('../../../models/Profile');
const socketService = require('../../../config/socket');
const logger = require('../../../common/logger/winston');

class NotificationService extends BaseService {
  constructor() {
    super(notificationRepository);
  }

  async createNotification(payload) {
    const recipientId = payload.recipientId;
    const actorId = payload.actorId;

    if (!recipientId || !actorId) {
      return null;
    }

    const profile = await Profile.findOne({ userId: recipientId }).lean();
    const settings = this._getNotificationSettings(profile);
    const preferenceKey = this._getPreferenceKey(payload.type);

    if (preferenceKey && settings[preferenceKey] === false) {
      return null;
    }

    const notification = await this.repository.create(payload);
    const populated = await Notification.findById(notification._id)
      .populate('actorId', 'firstName lastName fullName profileImage username profileSlug slug')
      .lean();

    this._emitToRecipient(recipientId, 'notification:new', populated);
    
    const { cacheService } = require('../../../cache/cache.service');
    await cacheService.del(`notifications:count:${recipientId}`);
    
    const unreadStats = await this.getUnreadCount(recipientId);
    this._emitToRecipient(recipientId, 'notification:count', unreadStats);

    return populated;
  }

  async getNotifications(recipientId, queryOptions = {}) {
    return await this.repository.findByRecipient(recipientId, queryOptions);
  }

  async getUnreadCount(recipientId) {
    const { cacheService } = require('../../../cache/cache.service');
    const cacheKey = `notifications:count:${recipientId}`;
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        return { count: Number(cached) };
      }
    } catch (err) {
      logger.warn(`Failed reading notification count cache: ${err.message}`);
    }

    const count = await this.repository.countUnreadByRecipient(recipientId);

    try {
      await cacheService.set(cacheKey, count, 86400); // 24 hours
    } catch (err) {
      logger.warn(`Failed writing notification count cache: ${err.message}`);
    }

    return { count };
  }

  async markAsRead(notificationId, recipientId) {
    const updated = await this.repository.markAsRead(notificationId, recipientId);
    if (!updated) {
      return null;
    }

    const { cacheService } = require('../../../cache/cache.service');
    await cacheService.del(`notifications:count:${recipientId}`);

    this._emitToRecipient(recipientId, 'notification:update', updated);
    
    const unreadStats = await this.getUnreadCount(recipientId);
    this._emitToRecipient(recipientId, 'notification:count', unreadStats);

    return updated;
  }

  async markAllRead(recipientId) {
    await this.repository.markAllRead(recipientId);
    
    const { cacheService } = require('../../../cache/cache.service');
    await cacheService.set(`notifications:count:${recipientId}`, 0, 86400);

    this._emitToRecipient(recipientId, 'notification:count', { count: 0 });
    return { success: true, count: 0 };
  }

  async deleteNotification(notificationId, recipientId) {
    const deleted = await this.repository.deleteForRecipient(notificationId, recipientId);
    if (!deleted) {
      return null;
    }

    const { cacheService } = require('../../../cache/cache.service');
    await cacheService.del(`notifications:count:${recipientId}`);

    this._emitToRecipient(recipientId, 'notification:delete', notificationId.toString());
    
    const unreadStats = await this.getUnreadCount(recipientId);
    this._emitToRecipient(recipientId, 'notification:count', unreadStats);

    return { success: true, deletedId: notificationId.toString() };
  }

  async clearAllNotifications(recipientId) {
    await this.repository.clearAll(recipientId);
    
    const { cacheService } = require('../../../cache/cache.service');
    await cacheService.set(`notifications:count:${recipientId}`, 0, 86400);

    this._emitToRecipient(recipientId, 'notification:delete', 'all');
    this._emitToRecipient(recipientId, 'notification:count', { count: 0 });
    return { success: true };
  }

  async updateSettings(recipientId, settings) {
    const allowedKeys = ['follow', 'connection', 'publication', 'comment', 'mention', 'system', 'emailAlerts', 'weeklyDigest', 'newMessages'];
    const updates = Object.keys(settings || {}).reduce((acc, key) => {
      if (allowedKeys.includes(key)) {
        acc[key] = Boolean(settings[key]);
      }
      return acc;
    }, {});

    if (Object.keys(updates).length === 0) {
      return null;
    }

    const currentProfile = await Profile.findOne({ userId: recipientId }).lean();
    const mergedSettings = {
      ...(await this._getDefaultSettings()),
      ...(currentProfile?.notificationSettings || {}),
      ...updates
    };

    const profile = await Profile.findOneAndUpdate(
      { userId: recipientId },
      { $set: { notificationSettings: mergedSettings } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    try {
      const { ProfileCache } = require('../../../cache/cache.service');
      if (ProfileCache) {
        await ProfileCache.del(recipientId.toString());
      }
    } catch (err) {
      logger.error(`Failed to invalidate ProfileCache: ${err.message}`);
    }

    return profile.notificationSettings;
  }

  _emitToRecipient(recipientId, event, payload) {
    try {
      socketService.emitToUser(recipientId.toString(), event, payload);
    } catch (error) {
      logger.error(`Notification socket emit failed: ${error.message}`);
    }
  }

  _getNotificationSettings(profile) {
    return {
      follow: true,
      connection: true,
      publication: true,
      comment: true,
      mention: true,
      system: true,
      emailAlerts: true,
      weeklyDigest: true,
      newMessages: true,
      ...(profile?.notificationSettings || {})
    };
  }

  async _getDefaultSettings() {
    return {
      follow: true,
      connection: true,
      publication: true,
      comment: true,
      mention: true,
      system: true,
      emailAlerts: true,
      weeklyDigest: true,
      newMessages: true
    };
  }

  _getPreferenceKey(type) {
    if (type === 'follow') return 'follow';
    if (['connection_request', 'connection_accepted', 'connection_rejected', 'connection_removed'].includes(type)) return 'connection';
    if (type === 'publication_commented') return 'comment';
    if (['publication_uploaded', 'publication_updated', 'publication_bookmarked', 'publication_shared', 'publication_cited', 'publication_recommended'].includes(type)) return 'publication';
    if (type === 'mention') return 'mention';
    if (['system', 'admin'].includes(type)) return 'system';
    return null;
  }
}

module.exports = new NotificationService();
