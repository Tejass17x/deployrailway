const getImageUrl = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.url || '';
};

class NetworkDTO {
  /**
   * Format a researcher profile for network lists
   */
  formatResearcher(user, profile = {}) {
    return {
      id: user._id || user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`,
      username: user.username,
      profileSlug: user.profileSlug || user.username,
      profileImage: getImageUrl(user.profileImage) || getImageUrl(profile.profileImage) || '',
      headline: profile.headline || '',
      institution: profile.institution || '',
      department: profile.department || '',
      country: profile.country || '',
      researchAreas: profile.researchAreas || [],
      connectionsCount: profile.connectionsCount || 0,
      followersCount: profile.followersCount || 0,
      publicationsCount: profile.publicationsCount || 0,
      connectionStatus: user.connectionStatus || 'none',
      connectionId: user.connectionId || null,
      requestId: user.requestId || null,
      mutualConnectionsCount: user.mutualConnectionsCount || 0
    };
  }

  /**
   * Format a list of researchers
   */
  formatResearcherList(docs) {
    return docs.map(doc => {
      const user = doc.user || doc;
      const profile = doc.profile || {};
      const presence = doc.presence || {};
      const formatted = this.formatResearcher(user, profile);
      formatted.presenceStatus = presence.status || 'offline';
      formatted.lastSeen = presence.lastSeen || null;
      formatted.connectionId = doc.connectionId || doc._id || null;
      // Only meaningful on the Followers tab: whether the current user
      // already follows this follower back (so UI can show "Following"
      // instead of "Follow Back").
      formatted.isFollowing = doc.isFollowingBack || false;
      return formatted;
    });
  }
}

module.exports = new NetworkDTO();