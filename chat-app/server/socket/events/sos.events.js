// server/socket/events/sos.events.js

module.exports = (io, socket) => {

  // Sender's device calls this once, right when SOS triggers,
  // so their location updates broadcast into a dedicated channel
  socket.on('join_sos_alert', (alertId) => {
    socket.join(`sos:${alertId}`);
    console.log(`${socket.user.username} joined SOS room: sos:${alertId}`);
  });

  // Trusted contacts call this when they open the "track" screen
  // after getting notified, so they receive the live location stream
  socket.on('join_sos_tracking', (alertId) => {
    socket.join(`sos:${alertId}`);
    console.log(`${socket.user.username} is now tracking SOS: sos:${alertId}`);
  });

  // Sender's browser emits this every time watchPosition fires
  socket.on('sos_location_update', async (data) => {
    // data = { alertId, lat, lng }

    // Broadcast to everyone in this SOS room EXCEPT the sender themselves
    // (the sender doesn't need their own location echoed back)
    socket.to(`sos:${data.alertId}`).emit('sos_location_update', {
      alertId: data.alertId,
      lat: data.lat,
      lng: data.lng,
      senderUsername: socket.user.username,
      timestamp: new Date()
    });

    // Also persist the latest location to MongoDB so it's available
    // even if a contact opens the tracking screen late
    const SOSAlert = require('../../models/SOSAlert');
    await SOSAlert.findByIdAndUpdate(data.alertId, {
      lastLocation: { lat: data.lat, lng: data.lng, updatedAt: new Date() }
    });
  });

  socket.on('leave_sos_alert', (alertId) => {
    socket.leave(`sos:${alertId}`);
  });
};