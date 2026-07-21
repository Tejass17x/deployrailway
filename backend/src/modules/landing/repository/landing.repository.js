const BaseRepository = require('../../../common/repository/base.repository');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Session = require('../../../models/Session');
const Publication = require('../../../models/Publication');
const Country = require('../../../models/Country');
const { PlatformStatsCache } = require('../../../cache/cache.service');

class LandingRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async getPlatformStats() {
    // Try cache first (1h TTL set by PlatformStatsCache)
    const cached = await PlatformStatsCache.get();
    if (cached) return cached;

    const [userCount, publicationCount, countryCount, profileCount] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true }, status: { $ne: 'pending' } }),
      Publication.countDocuments({ isDeleted: { $ne: true } }),
      Country.countDocuments({ isActive: true }),
      Profile.countDocuments({ isDeleted: { $ne: true } })
    ]);

    const stats = {
      researchers: userCount,
      publications: publicationCount,
      countries: countryCount || 1, // At least 1 while DB warms up
      universities: profileCount
    };

    await PlatformStatsCache.set(stats);
    return stats;
  }
}

module.exports = new LandingRepository();
