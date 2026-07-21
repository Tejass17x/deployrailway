// The legacy feed/profile features also use Project. Re-export the shared model
// to ensure Mongoose only compiles it once during development reloads.
module.exports = require('../../../models/Project');
