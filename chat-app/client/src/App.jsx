
// client/src/App.jsx — full version with global SOS beep listener
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect} from 'react';
import { useSocket } from './context/SocketContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Requests from './pages/Requests';
import SOS from './pages/SOS';
import SOSContacts from './pages/SOSContacts';
import SOSTrack from './pages/SOSTrack';
import CreatePost from './pages/CreatePost';
import CreateMoment from './pages/CreateMoment';
import SafetyMap from './pages/SafetyMap';
import FollowersList from './pages/FollowersList';
import FollowingList from './pages/FollowingList';
import MomentViewer from './pages/MomentViewer';
import VerifyEmail from './pages/VerifyEmail';
import OTPVerify from './pages/OTPVerify';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Separate component so we can use useNavigate inside BrowserRouter
function AppRoutes() {
  // const navigate = useNavigate();
  const { socket } = useSocket();
 

useEffect(() => {
  if (!socket) return;

  const beepedAlerts = new Set();

  const playAttentionBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1200;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      };

      // 5 beeps, 1 second apart
      for (let i = 0; i < 5; i++) {
        playTone(ctx.currentTime + i * 1.0);
        playTone(ctx.currentTime + i * 1.0 + 0.3);
      }
    } catch (err) {
      console.error('Beep failed:', err);
    }
  };
  





  // Fires immediately when someone triggers SOS
  const onSOSTriggered = ({ alertId, from }) => {
    if (!beepedAlerts.has(alertId)) {
      beepedAlerts.add(alertId);
      playAttentionBeep();
    }
  };

  // Fires immediately when someone starts sharing location
  const onLocationShareStarted = ({ alertId, from }) => {
    if (!beepedAlerts.has(alertId)) {
      beepedAlerts.add(alertId);
      playAttentionBeep();
    }
  };

  socket.on('sos_alert_triggered', onSOSTriggered);
  socket.on('sos_location_share_started', onLocationShareStarted);

  return () => {
    socket.off('sos_alert_triggered', onSOSTriggered);
    socket.off('sos_location_share_started', onLocationShareStarted);
  };
}, [socket]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />

      <Route path="/register" element={<Register />} />

      <Route path="/login" element={<Login />} />

      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

      <Route path="/chat" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

      <Route path="/chat/:roomId" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />

      <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />

      <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />

      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

      <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/profile/:userId/followers" element={<ProtectedRoute><FollowersList /></ProtectedRoute>} />

      <Route path="/profile/:userId/following" element={<ProtectedRoute><FollowingList /></ProtectedRoute>} />

      <Route path="/sos" element={<ProtectedRoute><SOS /></ProtectedRoute>} />

      <Route path="/sos/contacts" element={<ProtectedRoute><SOSContacts /></ProtectedRoute>} />

      <Route path="/sos/track/:alertId" element={<ProtectedRoute><SOSTrack /></ProtectedRoute>} />
      
      <Route path="/posts/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />

      <Route path="/moments/create" element={<ProtectedRoute><CreateMoment /></ProtectedRoute>} />

      <Route path="/moments/view" element={<ProtectedRoute><MomentViewer /></ProtectedRoute>} />
      
      <Route path="/sos/map" element={ <ProtectedRoute><SafetyMap /></ProtectedRoute>} />

      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/verify-otp" element={<OTPVerify />} />
      
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}