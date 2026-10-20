
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../app/store';
import { clearAuthError, registerUser } from '../features/auth/authSlice';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleRegisterSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Your password must contain at least 8 characters.');
      return;
    }

    const result = await dispatch(
      registerUser({
        name: trimmedName,
        email: normalizedEmail,
        password,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      navigate('/login', {
        replace: true,
        state: {
          registeredEmail: normalizedEmail,
          message: 'Account created successfully. Please sign in.',
        },
      });
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
          Create an account.
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 28px',
          }}
        >
          Join La Villa today to discover considered stays and book your next
          escape.
        </p>

        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 16px',
            color: '#111',
          }}
        >
          Get started
        </h3>

        {(validationError || error) && (
          <div
            role="alert"
            style={{
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '12px',
              fontWeight: 500,
            }}
          >
            {validationError || error}
          </div>
        )}

        <form
          onSubmit={handleRegisterSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label
              htmlFor="register-name"
              style={{
                fontSize: '13px',
                color: '#334155',
                display: 'block',
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Full name
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError('');
                if (error) dispatch(clearAuthError());
              }}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              style={{
                fontSize: '13px',
                color: '#334155',
                display: 'block',
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              placeholder="alex.morgan@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError('');
                if (error) dispatch(clearAuthError());
              }}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              style={{
                fontSize: '13px',
                color: '#334155',
                display: 'block',
                marginBottom: '6px',
                fontWeight: 500,
              }}
            >
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError('');
                  if (error) dispatch(clearAuthError());
                }}
                style={{ ...inputStyle, paddingRight: '60px' }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 0,
                  background: 'none',
                  color: '#64748b',
                  fontSize: '13px',
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
            margin: '24px 0',
          }}
        >
          Social sign-in is currently unavailable. Please register using your
          email address.
        </p>

        <div
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                ...linkStyle,
                border: 0,
                background: 'none',
              }}
            >
              Sign in →
            </button>
          </div>

          <div>
            Just exploring?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                ...linkStyle,
                border: 0,
                background: 'none',
              }}
            >
              Browse stays as a guest →
            </button>
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px dashed #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              style={{
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500,
                border: 0,
                background: 'none',
              }}
            >
              La Villa Staff?{' '}
              <strong style={{ color: '#1B4D3E' }}>
                Admin Portal login →
              </strong>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
