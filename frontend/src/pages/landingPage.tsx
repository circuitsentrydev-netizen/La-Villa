import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';

export function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Extract state properties directly from active Redux Context
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Search Engine States
  const [destination, setDestination] = useState('Cape Town, South Africa');
  const [checkIn, setCheckIn] = useState('12 June 2026');
  const [checkOut, setCheckOut] = useState('19 June 2026');
  const [guests, setGuests] = useState('1 room · 2 adults · 0 children');

  // Mock Data mimicking the "Stays to discover" layout
  const mockStays = [
    {
      id: '1',
      name: 'Villa Atlantic',
      location: 'Sea Point, Cape Town',
      rating: '4.8 (120 reviews)',
      price: 'R1,480'
    },
    {
      id: '2',
      name: 'Garden House',
      location: 'Gardens, Cape Town',
      rating: '4.9 (85 reviews)',
      price: 'R1,450'
    }
  ];

  return (
    <main style={{ background: '#FAF9F6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>
      
      {/* Navbar header */}
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #eaeaea' }}>
        <strong style={{ color: '#1B4D3E', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>La Villa</strong>
        
        {/* Conditional Header Rendering Based on Auth Token Cache Status */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#334155' }}>Hello, <strong>{user?.name || 'Explorer'}</strong></span>
            <button type="button" onClick={() => dispatch(logout())} style={{ border: '1px solid #ef4444', background: 'none', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => navigate('/login')} style={{ border: '1px solid #1B4D3E', background: 'none', color: '#1B4D3E', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            Sign In
          </button>
        )}
      </header>

      {/* Hero Banner Section */}
      <section style={{ position: 'relative', height: '240px', background: '#222222', color: '#ffffff', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>A place for refinement</span>
        <h1 style={{ fontSize: '32px', fontWeight: 600, margin: '4px 0 0', lineHeight: 1.2 }}>Stay a little.<br />Live a lot.</h1>
      </section>

      {/* Where will you unwind? - Search Box Card */}
      <section style={{ margin: '-20px 16px 0', background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', zIndex: 10 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#111' }}>Where will you unwind?</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Destination</label>
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Check in</label>
              <input type="text" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Check out</label>
              <input type="text" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Rooms & guests</label>
            <input type="text" value={guests} onChange={(e) => setGuests(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
          </div>

          <button type="button" style={{ background: '#1B4D3E', color: 'white', border: 0, padding: '12px', borderRadius: '6px', fontWeight: 600, marginTop: '8px', cursor: 'pointer' }}>
            Search accommodations →
          </button>
        </div>
      </section>

      {/* Accommodations Grid Feed */}
      <section style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: 0 }}>Stays to discover</h2>
          <span style={{ fontSize: '13px', color: '#1B4D3E', fontWeight: 500, cursor: 'pointer' }}>Show all →</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mockStays.map((stay) => (
            <div key={stay.id} style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1B4D3E', fontWeight: 600 }}>{stay.name}</h4>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#64748b' }}>{stay.location}</p>
                <span style={{ fontSize: '12px', color: '#eab308' }}>★ {stay.rating}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '16px', color: '#111', display: 'block' }}>{stay.price}</strong>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '8px' }}>/ night</span>
                <span style={{ fontSize: '13px', color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>View stay →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}

export default LandingPage;
