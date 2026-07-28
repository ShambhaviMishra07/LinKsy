// server/utils/notifyUser.js

const emitNotification = async (io, recipientId, notifDoc) => {
  if (!io) return;
  
  // Populate sender before emitting so bell shows username immediately
  let populated = notifDoc;
  try {
    populated = await notifDoc.populate('sender', 'username avatar');
  } catch (e) {
    // already populated or no populate needed
  }

  io.to(`user:${recipientId}`).emit('new_notification', {
    _id: populated._id,
    type: populated.type,
    sender: populated.sender,
    refId: populated.refId,
    createdAt: populated.createdAt,
    isRead: false
  });
};

module.exports = emitNotification;