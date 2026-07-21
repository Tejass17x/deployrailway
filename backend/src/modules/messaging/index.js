const messageRoutes = require('./routes/message.routes');
const conversationRoutes = require('./routes/conversation.routes');

module.exports = {
  routes: messageRoutes,
  conversationRoutes: conversationRoutes
};
