/**
 * Lightweight module-level event bus.
 * Used to communicate between MessagingContext and SocketContext
 * without circular imports.
 *
 * Usage:
 *   const off = eventBus.on('message:sent', handler);
 *   eventBus.emit('message:sent', { messageId, convId });
 *   off(); // unsubscribe
 */

const _listeners = {};

export const eventBus = {
  on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return function off() {
      _listeners[event] = (_listeners[event] || []).filter((cb) => cb !== callback);
    };
  },

  emit(event, data) {
    (_listeners[event] || []).forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[eventBus] Error in handler for "${event}":`, err);
      }
    });
  },
};
