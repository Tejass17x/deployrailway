const networkRepository = require('../repository/network.repository');
const connectionsService = require('../../connections/service/connections.service');
const followService = require('../../follow/service/follow.service');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Publication = require('../../../models/Publication');
const CoAuthor = require('../../../models/CoAuthor');
const { ProfileCache } = require('../../../cache/cache.service');
const { NotFoundError, ValidationError } = require('../../../common/errors/AppError');
const mongoose = require('mongoose');

class NetworkService {
  /**
   * Get dynamic network overview statistics
   */
  async getOverview(userId) {
    return await networkRepository.getNetworkCounts(userId);
  }

  /**
   * Get accepted connections list (paginated, searchable, filterable)
   */
  async getConnections(userId, queryOptions) {
    const { limit = 10, page = 1, search = '', ...filter } = queryOptions;
    return await networkRepository.getConnectionsList(userId, {
      limit: Number(limit),
      page: Number(page),
      search,
      filter
    });
  }

  /**
   * Get followers of current user
   */
  async getFollowers(userId, queryOptions) {
    const { limit = 10, page = 1, search = '' } = queryOptions;
    return await networkRepository.getFollowersList(userId, {
      limit: Number(limit),
      page: Number(page),
      search
    });
  }

  /**
   * Get following list of current user
   */
  async getFollowing(userId, queryOptions) {
    const { limit = 10, page = 1, search = '' } = queryOptions;
    return await networkRepository.getFollowingList(userId, {
      limit: Number(limit),
      page: Number(page),
      search
    });
  }

  /**
   * Get dynamic "People You May Know" suggestions (reuses follow suggestions)
   */
  async getSuggestions(userId, queryOptions) {
    const { limit = 6, page = 1 } = queryOptions;
    const result = await followService.getSuggestions(userId, {
      limit: Number(limit),
      page: Number(page)
    });

    // Attach live connection status (none | pending_sent | pending_received | connected)
    // so the UI can hide/replace the Connect button for users who already have
    // a request sent, received, or accepted.
    for (const item of result.docs) {
      const statusInfo = await connectionsService.getConnectionStatus(userId, item.user._id);
      item.connectionStatus = statusInfo.status;
      item.requestId = statusInfo.requestId;
      item.connectionId = statusInfo.connectionId;
    }

    return result;
  }

  /**
   * Get pending received and sent connection requests
   */
  async getRequests(userId) {
    return await networkRepository.getConnectionRequests(userId);
  }

  /**
   * Connect request (sends or automatically accepts if opposite exists)
   */
  async connect(senderId, targetUserId, note = '') {
    return await connectionsService.sendRequest(senderId, targetUserId, note);
  }

  /**
   * Follow user
   */
  async follow(followerId, targetUserId) {
    return await followService.follow(followerId, targetUserId);
  }

  /**
   * Unfollow user
   */
  async unfollow(followerId, targetUserId) {
    return await followService.unfollow(followerId, targetUserId);
  }

  /**
   * Accept connection request
   */
  async acceptRequest(requestId, receiverId) {
    return await connectionsService.acceptRequest(requestId, receiverId);
  }

  /**
   * Reject connection request
   */
  async rejectRequest(requestId, receiverId) {
    return await connectionsService.rejectRequest(requestId, receiverId);
  }

  /**
   * Remove connection
   */
  async removeConnection(connectionId, userId) {
    return await connectionsService.removeConnection(connectionId, userId);
  }

  /**
   * Get mutual connections list
   */
  async getMutualConnections(userId, otherUserId) {
    if (userId.toString() === otherUserId.toString()) {
      return [];
    }
    return await networkRepository.getMutualConnectionsList(userId, otherUserId);
  }

  /**
   * Search network globally (search researchers by name/institution/department/country)
   */
  async searchNetwork(userId, queryOptions) {
    const { q = '', limit = 10, page = 1 } = queryOptions;
    const skip = (page - 1) * limit;

    const matchQuery = {
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
      isDeleted: { $ne: true },
      status: 'active'
    };

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { 'profile.headline': { $regex: q, $options: 'i' } },
            { 'profile.institution': { $regex: q, $options: 'i' } },
            { 'profile.department': { $regex: q, $options: 'i' } },
            { 'profile.researchAreas.name': { $regex: q, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        username: 1,
        profileSlug: 1,
        profileImage: '$profileImage.url',
        profile: {
          headline: 1,
          institution: 1,
          department: 1,
          country: 1,
          researchAreas: 1,
          connectionsCount: 1,
          followersCount: 1
        }
      }
    });

    const countPipeline = [...pipeline, { $count: 'total' }];
    const counts = await User.aggregate(countPipeline);
    const total = counts[0]?.total || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const docs = await User.aggregate(pipeline);

    // Calculate dynamic connection status for each result
    for (const item of docs) {
      const statusInfo = await connectionsService.getConnectionStatus(userId, item._id);
      item.connectionStatus = statusInfo.status;
      item.connectionId = statusInfo.connectionId;
      item.requestId = statusInfo.requestId;
      item.mutualConnectionsCount = statusInfo.mutualConnectionsCount;
    }

    return {
      docs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * AI Recommendations for collaborations and top researchers
   */
  async getRecommendations(userId) {
    // Generate AI recommendations based on Google Scholar / Publications / Research Areas
    const suggestionsResult = await this.getSuggestions(userId, { limit: 10, page: 1 });
    // Filter/rank suggestions that have high match percentage
    return suggestionsResult.docs;
  }
}

module.exports = new NetworkService();