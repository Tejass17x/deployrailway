/**
 * Project module entry point — plug-and-play integration
 */
const projectRoutes = require('./routes/project.routes');

module.exports = {
  routes: projectRoutes,

  // Pre-load all models at startup for proper index creation
  models: {
    Project: require('../../models/Project'),
    ProjectMember: require('../../models/ProjectMember').ProjectMember,
    ProjectApplication: require('../../models/ProjectApplication').ProjectApplication,
    ProjectInvitation: require('../../models/ProjectInvitation'),
    ProjectTask: require('../../models/ProjectTask').ProjectTask,
    ProjectMilestone: require('../../models/ProjectMilestone'),
    ProjectFile: require('../../models/ProjectFile'),
    ProjectMessage: require('../../models/ProjectMessage'),
    ProjectAnnouncement: require('../../models/ProjectAnnouncement'),
    ProjectMeeting: require('../../models/ProjectMeeting'),
    ProjectBookmark: require('../../models/ProjectBookmark'),
    ProjectActivityLog: require('../../models/ProjectActivityLog').ProjectActivityLog,
  },
};
