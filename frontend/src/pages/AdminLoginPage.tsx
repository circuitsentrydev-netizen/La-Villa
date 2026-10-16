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
  const [showPassword, setShowPassword] = useState(false); // 💡 Hooked up below to toggle input fields
  const [localError, setLocalError] = useState('');

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    const resultAction = await dispatch(loginUser({ email, password }));
    
    if (loginUser.fulfilled.match(resultAction)) {
      // 💡 FIX: Safely parse the flattened role field from your controller response payload
      const payloadData = resultAction.payload as any;
      const userRole = (payloadData?.user?.role || payloadData?.role)?.toUpperCase();
      const token = payloadData?.token;
      
      if (userRole === 'ADMIN') {
        if (token) {
          localStorage.setItem('lavilla_token', token);
        }
        navigate('/admin/dashboard');
      } else {
        setLocalError('Access denied: Your account role profile layout lacks ADMIN operational privileges.');
      }
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.2fr', background: '#F8F7F4', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Design Side Tracking Branding Banner */}
      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #EAE8E3', backgroundImage: `linear-gradient(rgba(27,77,62,0.85), rgba(27,77,62,0.95)), url('https://marriott.com')`, backgroundSize: 'cover', color: '#fff' }}>
        <div>
          <h2 style={{ fontSize: '28px', margin: '0 0 4px', fontWeight: 750 }}>La Villa</h2>
          <span style={{ fontSize: '12px', color: '#A3E635', textTransform: 'uppercase' }}>lekker stays</span>
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 12px' }}>Thoughtful stays.<br />Clearly managed.</h1>
          <p style={{ fontSize: '14px', color: '#cbd5e1', maxWidth: '380px' }}>Manage accommodations, active configurations, and listing structures seamlessly.</p>
        </div>
      </div>

      {/* Interactive Form Controls */}
      <div style={{ background: '#ffffff', padding: '80px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>ADMIN PORTAL CONTROL</span>
          <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#111', margin: '8px 0 24px' }}>Admin sign in</h2>

          <form onSubmit={handleAdminSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Work email</label>
              <input type="email" required placeholder="Enter work email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ background: '#1B4D3E', color: '#ffffff', width: '100%', border: 0, padding: '14px', borderRadius: '6px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Authenticating...' : 'Sign in to admin'}
            </button>
          </form>

          {(localError || error) && (
            <div style={{ marginTop: '24px', background: '#FEE2E2', padding: '16px', borderRadius: '6px', color: '#991B1B', fontSize: '13px' }}>
              <strong>Access Denied:</strong> {localError || error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminLoginPage;
