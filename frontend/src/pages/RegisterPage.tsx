import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../app/store';
import { registerUser, loginWithOAuth } from '../features/auth/authSlice';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password) {
      setValidationError('Please fill in all layout credentials fields.');
      return;
    }

    const resultAction = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  const handleGoogleMockOAuth = async () => {
    const mockUserPayload = {
      email: 'circuitsentrydev@gmail.com',   // Triggers Super Admin privileges on backend
      name: 'CircuitsEntry Dev Admin',
      avatar: 'https://unsplash.com'
    };

    const resultAction = await dispatch(loginWithOAuth(mockUserPayload));
    if (loginWithOAuth.fulfilled.match(resultAction)) {
      const role = resultAction.payload.user?.role?.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, sans-serif', padding: '32px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', color: '#1B4D3E', margin: '0 0 4px', fontWeight: 700 }}>La Villa</h2>
        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>lekker stays</span>
      </div>

      <section style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: '#111' }}>Create an account.</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px' }}>
          Join La Villa today to discover considered stays and book your next escape.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: '#111' }}>Get started</h3>

        {(validationError || error) && (
          <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Full name</label>
            <input type="text" required placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Email address</label>
            <input type="email" required placeholder="alex.morgan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', paddingRight: '60px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: '#1B4D3E', color: '#ffffff', width: '100%', border: 0, padding: '14px', borderRadius: '6px', fontWeight: 600, fontSize: '15px', marginTop: '12px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={{ margin: '24px 0', position: 'relative', textAlign: 'center' }}>
          <hr style={{ border: 0, borderTop: '1px solid #e2e8f0' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#ffffff', padding: '0 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or continue with
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button type="button" onClick={handleGoogleMockOAuth} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', fontWeight: 500, fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            Google
          </button>
          <button type="button" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', fontWeight: 500, fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            Apple
          </button>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>Sign in →</span></div>
          <div>Just exploring? <span onClick={() => navigate('/')} style={{ color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>Browse stays as a guest →</span></div>
          
          {/* Staff Dashboard Portal Link */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
            <span onClick={() => navigate('/admin/login')} style={{ color: '#64748b', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
              La Villa Staff? <strong style={{ color: '#1B4D3E' }}>Admin Portal login →</strong>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
