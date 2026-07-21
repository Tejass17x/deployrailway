const Connection = require('../../connections/model/Connection');
const ConnectionRequest = require('../../connections/model/ConnectionRequest');
const Follow = require('../../follow/model/Follow');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Publication = require('../../../models/Publication');
const CoAuthor = require('../../../models/CoAuthor');
const CollaborationInvitation = require('../../../modules/collaborations/model/CollaborationInvitation');
const mongoose = require('mongoose');

class NetworkRepository {
  /**
   * Helper to sort user IDs to ensure researcherA < researcherB
   */
  _sortUserIds(userIdA, userIdB) {
    const idAStr = userIdA.toString();
    const idBStr = userIdB.toString();
    return idAStr < idBStr 
      ? [userIdA, userIdB] 
      : [userIdB, userIdA];
  }

  /**
   * Get basic stats counts for the My Network dashboard
   */
  async getNetworkCounts(userId) {
    const castUserId = new mongoose.Types.ObjectId(userId);

    const [
      connectionsCount,
      followersCount,
      followingCount,
      pendingRequestsCount,
      collaborationRequestsCount
    ] = await Promise.all([
      Connection.countDocuments({
        $or: [{ researcherA: castUserId }, { researcherB: castUserId }]
      }),
      Follow.countDocuments({ followingId: castUserId }),
      Follow.countDocuments({ followerId: castUserId }),
      ConnectionRequest.countDocuments({ receiverId: castUserId, status: 'pending' }),
      CollaborationInvitation.countDocuments({ invitedUserId: castUserId, status: 'Pending' })
    ]);

    return {
      connections: connectionsCount,
      followers: followersCount,
      following: followingCount,
      pendingRequests: pendingRequestsCount,
      collaborationRequests: collaborationRequestsCount
    };
  }

  /**
   * Get list of connections (with optional search, filter, pagination)
   */
  async getConnectionsList(userId, { limit = 10, page = 1, search = '', filter = {} }) {
    const castUserId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          $or: [
            { researcherA: castUserId },
            { researcherB: castUserId }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          connectedAt: 1,
          otherUserId: {
            $cond: {
              if: { $eq: ['$researcherA', castUserId] },
              then: '$researcherB',
              else: '$researcherA'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherUserId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'otherUserId',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'presences',
          localField: 'otherUserId',
          foreignField: 'userId',
          as: 'presence'
        }
      },
      { $unwind: { path: '$presence', preserveNullAndEmptyArrays: true } }
    ];

    // Build query matches for search & filters
    const matchConditions = {};

    if (search) {
      matchConditions.$or = [
        { 'user.fullName': { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { 'profile.headline': { $regex: search, $options: 'i' } },
        { 'profile.institution': { $regex: search, $options: 'i' } },
        { 'profile.department': { $regex: search, $options: 'i' } }
      ];
    }

    if (filter.institution) {
      matchConditions['profile.institution'] = { $regex: filter.institution, $options: 'i' };
    }
    if (filter.department) {
      matchConditions['profile.department'] = { $regex: filter.department, $options: 'i' };
    }
    if (filter.country) {
      matchConditions['profile.country'] = { $regex: filter.country, $options: 'i' };
    }
    if (filter.researchArea) {
      matchConditions['profile.researchAreas.name'] = { $regex: filter.researchArea, $options: 'i' };
    }
    if (filter.keyword) {
      matchConditions['profile.skills.name'] = { $regex: filter.keyword, $options: 'i' };
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    pipeline.push({
      $project: {
        _id: 1,
        connectedAt: 1,
        otherUserId: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          fullName: 1,
          username: 1,
          profileSlug: 1,
          profileImage: '$user.profileImage.url'
        },
        profile: {
          headline: 1,
          institution: 1,
          department: 1,
          country: 1,
          researchAreas: 1,
          connectionsCount: 1,
          followersCount: 1,
          publicationsCount: 1
        },
        presence: {
          status: 1,
          lastSeen: 1
        }
      }
    });

    // Execute paginated queries
    const countPipeline = [...pipeline, { $count: 'total' }];
    const counts = await Connection.aggregate(countPipeline);
    const total = counts[0]?.total || 0;

    pipeline.push({ $sort: { connectedAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const docs = await Connection.aggregate(pipeline);

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get followers list of current user
   */
  async getFollowersList(userId, { limit = 10, page = 1, search = '' }) {
    const castUserId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { followingId: castUserId } },
      {
        $lookup: {
          from: 'users',
          localField: 'followerId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'followerId',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'presences',
          localField: 'followerId',
          foreignField: 'userId',
          as: 'presence'
        }
      },
      { $unwind: { path: '$presence', preserveNullAndEmptyArrays: true } },
      // Check whether the current user already follows this follower back,
      // so the UI can show "Following" instead of "Follow Back" for people
      // we've already followed.
      {
        $lookup: {
          from: 'follows',
          let: { followerUserId: '$followerId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followerId', castUserId] },
                    { $eq: ['$followingId', '$$followerUserId'] }
                  ]
                }
              }
            }
          ],
          as: 'followBackDoc'
        }
      },
      {
        $addFields: {
          isFollowingBack: { $gt: [{ $size: '$followBackDoc' }, 0] }
        }
      }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.fullName': { $regex: search, $options: 'i' } },
            { 'user.firstName': { $regex: search, $options: 'i' } },
            { 'profile.headline': { $regex: search, $options: 'i' } },
            { 'profile.institution': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        createdAt: 1,
        isFollowingBack: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          fullName: 1,
          username: 1,
          profileSlug: 1,
          profileImage: '$user.profileImage.url'
        },
        profile: {
          headline: 1,
          institution: 1,
          department: 1,
          country: 1,
          researchAreas: 1,
          connectionsCount: 1,
          followersCount: 1
        },
        presence: {
          status: 1,
          lastSeen: 1
        }
      }
    });

    const counts = await Follow.aggregate([...pipeline, { $count: 'total' }]);
    const total = counts[0]?.total || 0;

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const docs = await Follow.aggregate(pipeline);

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get following list of current user
   */
  async getFollowingList(userId, { limit = 10, page = 1, search = '' }) {
    const castUserId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { followerId: castUserId } },
      {
        $lookup: {
          from: 'users',
          localField: 'followingId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'followingId',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'presences',
          localField: 'followingId',
          foreignField: 'userId',
          as: 'presence'
        }
      },
      { $unwind: { path: '$presence', preserveNullAndEmptyArrays: true } }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.fullName': { $regex: search, $options: 'i' } },
            { 'user.firstName': { $regex: search, $options: 'i' } },
            { 'profile.headline': { $regex: search, $options: 'i' } },
            { 'profile.institution': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        createdAt: 1,
        user: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          fullName: 1,
          username: 1,
          profileSlug: 1,
          profileImage: '$user.profileImage.url'
        },
        profile: {
          headline: 1,
          institution: 1,
          department: 1,
          country: 1,
          researchAreas: 1,
          connectionsCount: 1,
          followersCount: 1
        },
        presence: {
          status: 1,
          lastSeen: 1
        }
      }
    });

    const counts = await Follow.aggregate([...pipeline, { $count: 'total' }]);
    const total = counts[0]?.total || 0;

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const docs = await Follow.aggregate(pipeline);

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get all connection requests (incoming + outgoing)
   */
  async getConnectionRequests(userId) {
    const castUserId = new mongoose.Types.ObjectId(userId);

    const [received, sent] = await Promise.all([
      ConnectionRequest.aggregate([
        { $match: { receiverId: castUserId, status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'senderId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'profiles',
            localField: 'senderId',
            foreignField: 'userId',
            as: 'profile'
          }
        },
        { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'google_scholar_profiles',
            localField: 'senderId',
            foreignField: 'userId',
            as: 'googleScholar'
          }
        },
        {
          $project: {
            _id: 1,
            senderId: 1,
            receiverId: 1,
            note: 1,
            status: 1,
            createdAt: 1,
            hasGoogleScholar: { $gt: [{ $size: '$googleScholar' }, 0] },
            user: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              fullName: 1,
              username: 1,
              profileSlug: 1,
              profileImage: '$user.profileImage.url'
            },
            profile: {
              headline: 1,
              institution: 1,
              department: 1,
              country: 1,
              bio: 1,
              skills: 1,
              researchAreas: 1,
              connectionsCount: 1,
              followersCount: 1,
              metrics: 1
            }
          }
        },
        { $sort: { createdAt: -1 } }
      ]),
      ConnectionRequest.aggregate([
        { $match: { senderId: castUserId, status: 'pending' } },
        {
          $lookup: {
            from: 'users',
            localField: 'receiverId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'profiles',
            localField: 'receiverId',
            foreignField: 'userId',
            as: 'profile'
          }
        },
        { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'google_scholar_profiles',
            localField: 'receiverId',
            foreignField: 'userId',
            as: 'googleScholar'
          }
        },
        {
          $project: {
            _id: 1,
            senderId: 1,
            receiverId: 1,
            note: 1,
            status: 1,
            createdAt: 1,
            hasGoogleScholar: { $gt: [{ $size: '$googleScholar' }, 0] },
            user: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              fullName: 1,
              username: 1,
              profileSlug: 1,
              profileImage: '$user.profileImage.url'
            },
            profile: {
              headline: 1,
              institution: 1,
              department: 1,
              country: 1,
              bio: 1,
              skills: 1,
              researchAreas: 1,
              connectionsCount: 1,
              followersCount: 1,
              metrics: 1
            }
          }
        },
        { $sort: { createdAt: -1 } }
      ])
    ]);

    return { received, sent };
  }

  /**
   * Find accepted connection between two users
   */
  async findConnection(userIdA, userIdB) {
    const [researcherA, researcherB] = this._sortUserIds(userIdA, userIdB);
    return await Connection.findOne({ researcherA, researcherB }).lean();
  }

  /**
   * Get mutual connections count between A and B
   */
  async getMutualConnectionsIds(userIdA, userIdB) {
    const [connsA, connsB] = await Promise.all([
      Connection.find({ $or: [{ researcherA: userIdA }, { researcherB: userIdA }] }).lean(),
      Connection.find({ $or: [{ researcherA: userIdB }, { researcherB: userIdB }] }).lean()
    ]);

    const idsA = connsA.map(c => c.researcherA.toString() === userIdA.toString() ? c.researcherB.toString() : c.researcherA.toString());
    const idsB = connsB.map(c => c.researcherA.toString() === userIdB.toString() ? c.researcherB.toString() : c.researcherA.toString());

    return idsA.filter(id => idsB.includes(id));
  }

  /**
   * Get mutual connections full profiles list
   */
  async getMutualConnectionsList(userIdA, userIdB) {
    const mutualIds = await this.getMutualConnectionsIds(userIdA, userIdB);
    if (mutualIds.length === 0) return [];

    const objectIds = mutualIds.map(id => new mongoose.Types.ObjectId(id));
    return await User.aggregate([
      { $match: { _id: { $in: objectIds }, isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
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
            country: 1
          }
        }
      }
    ]);
  }
}

module.exports = new NetworkRepository();