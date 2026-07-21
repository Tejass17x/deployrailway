const BaseRepository = require('../../../common/repository/base.repository');
const ContactRequest = require('../models/ContactRequest');
const Grievance = require('../models/Grievance');
const Feedback = require('../models/Feedback');

class ContactRequestRepository extends BaseRepository {
  constructor() {
    super(ContactRequest);
  }
}

class GrievanceRepository extends BaseRepository {
  constructor() {
    super(Grievance);
  }
}

class FeedbackRepository extends BaseRepository {
  constructor() {
    super(Feedback);
  }
}

module.exports = {
  contactRequestRepository: new ContactRequestRepository(),
  grievanceRepository: new GrievanceRepository(),
  feedbackRepository: new FeedbackRepository()
};
