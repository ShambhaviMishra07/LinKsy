// server/utils/notifyUser.js — new file

const emitNotification = (io, recipientId, notification) => {
  if (!io) return;
  io.to(`user:${recipientId}`).emit('new_notification', {
    _id: notification._id,
    type: notification.type,
    sender: notification.sender,
    refId: notification.refId,
    createdAt: notification.createdAt
  });
};

module.exports = emitNotification;