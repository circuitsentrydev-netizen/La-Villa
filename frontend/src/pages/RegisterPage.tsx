import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../app/store';
import { registerUser } from '../features/auth/authSlice';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Bind directly to feedback selectors from your Redux auth state
  const { loading, error } = useSelector((state: RootState) => state.auth);

  // Component local element states
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

    // Dispatches registration credentials straight to the authSlice fetch loop
    const resultAction = await dispatch(registerUser({ name, email, password }));

    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/'); // Instantly redirect to the Home Dashboard upon success
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, sans-serif', padding: '32px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', color: '#1B4D3E', margin: '0 0 4px', fontWeight: 700 }}>La Villa</h2>
        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>lekker stays</span>
      </div>

      {/* Main Registration Box */}
      <section style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px', color: '#111' }}>Create an account.</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px' }}>
          Join La Villa today to discover considered stays and book your next escape.
        </p>

        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: '#111' }}>Get started</h3>

        {/* Display System or Local Input Validation Errors */}
        {(validationError || error) && (
          <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>
            {validationError || error}
          </div>
        )}

        {/* Registration Submission Form */}
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

        {/* OR CONTINUE WITH - Alternative Login Dividers */}
        <div style={{ margin: '24px 0', position: 'relative', textAlign: 'center' }}>
          <hr style={{ border: 0, borderTop: '1px solid #e2e8f0' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#ffffff', padding: '0 12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or continue with
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button type="button" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', fontWeight: 500, fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            Google
          </button>
          <button type="button" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', fontWeight: 500, fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
            Apple
          </button>
        </div>

        {/* Footer Sub-Links */}
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>Sign in →</span></div>
          <div>Just exploring? <span onClick={() => navigate('/')} style={{ color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>Browse stays as a guest →</span></div>
        </div>

      </section>
    </main>
  );
}

export default RegisterPage;
