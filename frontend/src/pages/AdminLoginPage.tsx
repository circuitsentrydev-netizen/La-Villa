import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../app/store';
import { loginUser } from '../features/auth/authSlice';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    const resultAction = await dispatch(loginUser({ email, password }));
    
    if (loginUser.fulfilled.match(resultAction)) {
      // 🛠️ FIX: Convert the incoming role string to uppercase to match the database backend ('ADMIN')
      const userRole = resultAction.payload.user?.role?.toUpperCase();
      
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setLocalError('Access denied: This account does not possess an administrator role. Contact your workspace owner.');
      }
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.2fr', background: '#F8F7F4', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Left Design Pane Panel */}
      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #EAE8E3' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: '#1B4D3E', margin: '0 0 4px', fontWeight: 750 }}>La Villa</h2>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>lekker stays</span>
          
          {/* Wireframe Placeholder Shape Visual Item */}
          <div style={{ width: '100%', height: '280px', background: '#BCE3F2', borderRadius: '4px', marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #A4D3E6' }}>
            <span style={{ color: '#558296', fontSize: '13px' }}>Architectural hospitality placeholder</span>
          </div>
        </div>
        
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111', margin: '0 0 12px', lineHeight: 1.2 }}>Thoughtful stays.<br />Clearly managed.</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', maxWidth: '380px' }}>Manage your accommodations, room availability and reservations in one workspace.</p>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}></span>
        </div>
      </div>

      {/* Right Form Processing Panel */}
      <div style={{ background: '#ffffff', padding: '80px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>12.1 / ADMIN · LIVE CONNECTED</span>
          <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#111', margin: '8px 0 24px' }}>Admin sign in</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>For authorized La Villa staff only. Use your work account to continue.</p>

          <form onSubmit={handleAdminSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Work email</label>
              <input type="email" required placeholder="Enter your work email address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required placeholder="Enter your administrative password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#1B4D3E' }} /> Keep me signed in
              </label>
              <span style={{ color: '#64748b', cursor: 'pointer' }}>Forgot password?</span>
            </div>

            <button type="submit" disabled={loading} style={{ background: '#1B4D3E', color: '#ffffff', width: '100%', border: 0, padding: '14px', borderRadius: '6px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Authenticating...' : 'Sign in to admin'}
            </button>
          </form>

          {/* Conditional Error Display Element Box */}
          {(localError || error) && (
            <div style={{ marginTop: '24px', background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '6px' }}>
              <strong style={{ display: 'block', fontSize: '14px', color: '#991B1B', marginBottom: '4px' }}>Access Denied</strong>
              <p style={{ margin: 0, fontSize: '13px', color: '#991B1B' }}>{localError || error}</p>
            </div>
          )}

          <div style={{ marginTop: '40px', fontSize: '13px', color: '#94a3b8' }}>
            Need assistance? <span style={{ color: '#1B4D3E', cursor: 'pointer' }}>Contact your administrator.</span>
            <div style={{ marginTop: '8px' }}><span onClick={() => navigate('/')} style={{ color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}>Back to guest app →</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminLoginPage;
