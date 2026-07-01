module.exports = (io, socket) => {

  socket.on('join_sos_alert', (alertId) => {
    socket.join(`sos:${alertId}`);
    console.log(`${socket.user.username} joined SOS room: sos:${alertId}`);
  });

  socket.on('join_sos_tracking', (alertId) => {
    socket.join(`sos:${alertId}`);
    console.log(`${socket.user.username} is now tracking SOS: sos:${alertId}`);
  });

  socket.on('sos_alert_triggered', (data) => {
    // data = { alertId, contactIds }

    data.contactIds.forEach(contactId => {
      socket.to(`user:${contactId}`).emit('sos_alert_triggered', {
        alertId: data.alertId,
        from: socket.user.username
      });
    });
  });

  socket.on('sos_location_update', async (data) => {
    // data = { alertId, lat, lng }

    socket.to(`sos:${data.alertId}`).emit('sos_location_update', {
      alertId: data.alertId,
      lat: data.lat,
      lng: data.lng,
      senderUsername: socket.user.username,
      timestamp: new Date()
    });

    const SOSAlert = require('../../models/SOSAlert');
    await SOSAlert.findByIdAndUpdate(data.alertId, {
      lastLocation: {
        lat: data.lat,
        lng: data.lng,
        updatedAt: new Date()
      }
    });
  });

  // server/socket/events/sos.events.js — add video chunk relay
  socket.on('sos_video_chunk', (data) => {
    // data = { alertId, chunk (binary), timestamp }
    // We don't store chunks on the server — too much storage
    // Just relay them immediately to contacts watching this alert
    socket.to(`sos:${data.alertId}`).emit('sos_video_chunk', {
      chunk: data.chunk,
      timestamp: data.timestamp,
      from: socket.user.username
    });
  });

  socket.on('leave_sos_alert', (alertId) => {
    socket.leave(`sos:${alertId}`);
  });
};