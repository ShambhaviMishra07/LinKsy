
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import Requests from './pages/Requests';
import EditProfile from './pages/EditProfile';


// Protect chat route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

         <Route 
         path="/home" 
         element={
          <ProtectedRoute>
            <Home />
            </ProtectedRoute>
        } />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />
        <Route 
        path="/profile/edit" 
        element={
        <ProtectedRoute>
          <EditProfile />
          </ProtectedRoute>
} />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
         path="/requests" 
         element={
         <ProtectedRoute>
          <Requests />
        </ProtectedRoute>
       } />
      </Routes>
    </BrowserRouter>
  );
}