const networkService = require('../service/network.service');
const NetworkDTO = require('../dto/network.dto');
const asyncHandler = require('../../../common/middlewares/asyncHandler.middleware');
const SocketGateway = require('../../../socket/gateway/socket.gateway');

class NetworkController {
  /**
   * Get dynamic network overview statistics
   */
  getOverview = asyncHandler(async (req, res) => {
    const stats = await networkService.getOverview(req.user._id);
    return res.success('Network overview retrieved successfully.', stats);
  });

  /**
   * Get accepted connections list
   */
  getConnections = asyncHandler(async (req, res) => {
    const connections = await networkService.getConnections(req.user._id, req.query);
    connections.docs = NetworkDTO.formatResearcherList(connections.docs);
    return res.success('Connections list retrieved successfully.', connections);
  });

  /**
   * Get followers list
   */
  getFollowers = asyncHandler(async (req, res) => {
    const followers = await networkService.getFollowers(req.user._id, req.query);
    followers.docs = NetworkDTO.formatResearcherList(followers.docs);
    return res.success('Followers list retrieved successfully.', followers);
  });

  /**
   * Get following list
   */
  getFollowing = asyncHandler(async (req, res) => {
    const following = await networkService.getFollowing(req.user._id, req.query);
    following.docs = NetworkDTO.formatResearcherList(following.docs);
    return res.success('Following list retrieved successfully.', following);
  });

  /**
   * Get dynamic suggestions ("People You May Know")
   */
  getSuggestions = asyncHandler(async (req, res) => {
    const suggestions = await networkService.getSuggestions(req.user._id, req.query);
    // Suggestions are already formatted in FollowService, but let's make sure it fits our format
    return res.success('Network suggestions retrieved successfully.', suggestions);
  });

  /**
   * Get pending received and sent connection requests
   */
  getRequests = asyncHandler(async (req, res) => {
    const requests = await networkService.getRequests(req.user._id);
    return res.success('Connection requests list retrieved successfully.', requests);
  });

  /**
   * Connect request (sends request or accepts opposite if exists)
   */
  connect = asyncHandler(async (req, res) => {
    const { researcherId, note } = req.body;
    if (!researcherId) {
      return res.status(400).json({ success: false, message: 'researcherId is required.' });
    }
    const request = await networkService.connect(req.user._id, researcherId, note);

    // Emit Real-Time Socket Event to Target User
    SocketGateway.emitToUser(researcherId, 'connection_request_received', {
      senderId: req.user._id,
      request
    });

    return res.success('Connection request sent/processed successfully.', request);
  });

  /**
   * Follow user
   */
  follow = asyncHandler(async (req, res) => {
    const { researcherId } = req.body;
    if (!researcherId) {
      return res.status(400).json({ success: false, message: 'researcherId is required.' });
    }
    const followDoc = await networkService.follow(req.user._id, researcherId);

    // Emit Real-Time Socket Event to Target User
    SocketGateway.emitToUser(researcherId, 'follow_updated', {
      followerId: req.user._id,
      following: true
    });

    return res.success('Successfully followed researcher.', followDoc);
  });

  /**
   * Unfollow user
   */
  unfollow = asyncHandler(async (req, res) => {
    const { researcherId } = req.body;
    if (!researcherId) {
      return res.status(400).json({ success: false, message: 'researcherId is required.' });
    }
    const result = await networkService.unfollow(req.user._id, researcherId);

    // Emit Real-Time Socket Event to Target User
    SocketGateway.emitToUser(researcherId, 'follow_updated', {
      followerId: req.user._id,
      following: false
    });

    return res.success('Successfully unfollowed researcher.', result);
  });

  /**
   * Accept connection request
   */
  accept = asyncHandler(async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required.' });
    }
    const result = await networkService.acceptRequest(requestId, req.user._id);

    // Emit Real-Time Socket Event to Sender User
    const senderId = result.request.senderId;
    SocketGateway.emitToUser(senderId, 'connection_accepted', {
      receiverId: req.user._id,
      result
    });

    return res.success('Connection request accepted successfully.', result);
  });

  /**
   * Reject connection request
   */
  reject = asyncHandler(async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required.' });
    }
    const result = await networkService.rejectRequest(requestId, req.user._id);

    // Emit Real-Time Socket Event to Sender User
    const senderId = result.senderId;
    SocketGateway.emitToUser(senderId, 'connection_rejected', {
      receiverId: req.user._id,
      result
    });

    return res.success('Connection request rejected successfully.', result);
  });

  /**
   * Remove connection
   */
  remove = asyncHandler(async (req, res) => {
    const { connectionId } = req.params;
    if (!connectionId) {
      return res.status(400).json({ success: false, message: 'connectionId parameter is required.' });
    }
    const result = await networkService.removeConnection(connectionId, req.user._id);
    return res.success('Connection removed successfully.', result);
  });

  /**
   * Get mutual connections between current user and target user
   */
  getMutual = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId parameter is required.' });
    }
    const mutuals = await networkService.getMutualConnections(req.user._id, userId);
    return res.success('Mutual connections retrieved successfully.', mutuals);
  });

  /**
   * Search network (globally / connections)
   */
  search = asyncHandler(async (req, res) => {
    const results = await networkService.searchNetwork(req.user._id, req.query);
    results.docs = NetworkDTO.formatResearcherList(results.docs);
    return res.success('Search results retrieved successfully.', results);
  });

  /**
   * Get AI recommendations for connections
   */
  getRecommendations = asyncHandler(async (req, res) => {
    const recommendations = await networkService.getRecommendations(req.user._id);
    return res.success('AI recommendations retrieved successfully.', recommendations);
  });
}

module.exports = new NetworkController();
