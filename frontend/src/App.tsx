import './App.css';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingPage';
import LoginPage from './pages/loginPage';
import RegisterPage from './pages/RegisterPage'; 
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { AddAccommodationForm } from './pages/AddAccommodationForm';
import { DiscoverStays } from './pages/DiscoverStays';

function App() {
  return (
    <Routes>
      {/* =========================================================================
         1. PUBLIC GUEST INTERFACES MAPPING
         ========================================================================= */}
      {/* Live Landing Layout Feed View */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Front-end Property Cards Grid View for Guests */}
      <Route path="/discover" element={<DiscoverStays />} />

      {/* =========================================================================
         2. CORE AUTH SYSTEM LINKS
         ========================================================================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* =========================================================================
         3. BACKOFFICE ADMINISTRATIVE WORKSPACE PANELS
         ========================================================================= */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/accommodations/new" element={<AddAccommodationForm />} />

      {/* =========================================================================
         4. CATCH-ALL ROUTE LAYOUT DROP (Safely catches dead link targets)
         ========================================================================= */}
      <Route path="*" element={
        <div style={{ padding: '80px 40px', color: '#1E293B', textAlign: 'center', fontFamily: 'system-ui, sans-serif', background: '#FAF9F6', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '32px', color: '#1B4D3E', fontWeight: 700, margin: '0 0 12px' }}>404 - Page Layout Not Found</h2>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 24px' }}>The interface panel resource or view index string state could not be resolved.</p>
          <a href="/" style={{ background: '#1B4D3E', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            Return to La Villa Home
          </a>
        </div>
      } />
    </Routes>
  );
}

export default App;
