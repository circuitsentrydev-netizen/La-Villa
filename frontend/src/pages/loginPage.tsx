
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../app/store';
import { clearAuthError, loginUser } from '../features/auth/authSlice';

interface LoginLocationState {
  registeredEmail?: string;
  message?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const navigationState = (location.state || {}) as LoginLocationState;

  const [email, setEmail] = useState(navigationState.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (navigationState.registeredEmail) {
      setEmail(navigationState.registeredEmail);
    }
  }, [navigationState.registeredEmail]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setFormError('Please enter your email address and password.');
      return;
    }

    const result = await dispatch(
      loginUser({
        email: cleanEmail,
        password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.user.role?.toUpperCase();

      // Remove the registration message from navigation history.
      navigate(role === 'ADMIN' ? '/admin/dashboard' : '/', {
        replace: true,
        state: null,
      });
    } else {
      setFormError(
        typeof result.payload === 'string'
          ? result.payload
          : result.error.message || 'Login failed. Please try again.'
      );
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const linkStyle: React.CSSProperties = {
    color: '#1B4D3E',
    fontWeight: 600,
    cursor: 'pointer',
    border: 0,
    background: 'none',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        padding: '32px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '28px',
            color: '#1B4D3E',
            margin: '0 0 4px',
            fontWeight: 700,
          }}
        >
          La Villa
        </h2>
        <span
          style={{
            fontSize: '12px',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          lekker stays
        </span>
      </div>

      <section style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            margin: '0 0 8px',
            color: '#111',
          }}
        >
          A place to slow down.
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 28px',
          }}
        >
          Discover considered stays. Book your next escape with La Villa.
        </p>

        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 16px',
            color: '#111',
          }}
        >
          Welcome back
        </h3>

        {navigationState.message && (
          <div
            role="status"
            style={{
              color: '#166534',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '14px',
              marginBottom: '14px',
            }}
          >
            {navigationState.message}
          </div>
        )}

        {(formError || error) && (
          <div
            role="alert"
            style={{
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '12px',
            }}
          >
            {formError || error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label
              htmlFor="login-email"
              style={{
                fontSize: '13px',
                color: '#334155',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError('');
                if (error) dispatch(clearAuthError());
              }}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              style={{
                fontSize: '13px',
                color: '#334155',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError('');
                  if (error) dispatch(clearAuthError());
                }}
                style={{ ...inputStyle, paddingRight: '65px' }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 0,
                  background: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#1B4D3E',
              color: '#ffffff',
              width: '100%',
              border: 0,
              padding: '14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '15px',
              marginTop: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            marginTop: '32px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            New to La Villa?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={linkStyle}
            >
              Create an account →
            </button>
          </div>

          <div>
            Just exploring?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              style={linkStyle}
            >
              Browse stays as a guest →
            </button>
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px dashed #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              style={{
                ...linkStyle,
                fontSize: '12px',
                letterSpacing: '0.5px',
              }}
            >
              LA VILLA STAFF? ADMIN PORTAL LOGIN →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
