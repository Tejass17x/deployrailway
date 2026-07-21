const BaseRepository = require('../../../common/repository/base.repository');
const Presence = require('../../../socket/presence/Presence');

class PresenceRepository extends BaseRepository {
  constructor() {
    super(Presence);
  }
}

module.exports = new PresenceRepository();
