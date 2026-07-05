// server/utils/notifyUser.js
const emitNotification = (io, recipientId, notification) => {
  if (!io) return;
  io.to(`user:${recipientId}`).emit('new_notification', {
    _id: notification._id,
    type: notification.type,
    sender: notification.sender,
    refId: notification.refId,
    createdAt: notification.createdAt,
    isRead: false
  });
};
module.exports = emitNotification;