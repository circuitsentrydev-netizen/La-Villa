import './App.css';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage'; 
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';


function App() {
  return (
    <Routes>
      {/* Base Landing Layout */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth System Links */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
         
      {/* Admin Operations Paths */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      
      {/* Catch-all fallback layout */}
      <Route path="*" element={<div style={{ padding: '40px', color: 'black', textAlign: 'center' }}><h2>404 - Page Layout Not Found</h2><a href="/">Return Home</a></div>} />
    </Routes>
  );
}

export default App;
