import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface StayCard {
  id: string;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [featuredStays, setFeaturedStays] = useState<StayCard[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/accommodations?status=Published`)
      .then(res => res.json())
      .then(data => setFeaturedStays(data.slice(0, 3)))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ background: '#FAF9F6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* ==================== TOP NAVIGATION HEADER BAR ==================== */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #EAEAEA', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <strong style={{ color: '#1B4D3E', fontSize: '24px', cursor: 'pointer' }} onClick={() => navigate('/')}>La Villa</strong>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginLeft: '8px', letterSpacing: '0.5px' }}>Lekker Stays</span>
        </div>
        
        {/* Updated Links: Direct to individual Login/Register routes instead of forced admin panels */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span 
            onClick={() => navigate('/login')} 
            style={{ fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#1B4D3E')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#475569')}
          >
            Sign in
          </span>
          <button 
            type="button"
            onClick={() => navigate('/register')} 
            style={{ background: '#1B4D3E', color: '#ffffff', border: 0, padding: '10px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* ==================== HERO IMAGE HEADER SECTION ==================== */}
      <header style={{ 
        position: 'relative',
        backgroundImage: `linear-gradient(rgba(27, 77, 62, 0.45), rgba(27, 77, 62, 0.65)), url('https://cache.marriott.com/is/image/marriotts7prod/mc-dxbpj-royal-penthouse-21124:Classic-Hor?wid=856&fit=constrain')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff', 
        padding: '120px 40px', 
        textAlign: 'center',
        boxShadow: 'inset 0 -40px 80px rgba(250,249,246,1)' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          <h1 style={{ fontSize: '52px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.15 }}>Your next chapter starts with a stay.</h1>
          <p style={{ color: '#A3E635', fontSize: '20px', margin: '0 0 32px', fontWeight: 600 }}>A change of scene is closer than you think.</p>
          
          {/* Updated Action: Directs cleanly to frontend customer catalog view */}
          <button 
            onClick={() => navigate('/discover')} 
            style={{ background: '#ffffff', color: '#1B4D3E', padding: '14px 28px', border: 0, borderRadius: '24px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            Explore properties
          </button>
        </div>
      </header>

      {/* ==================== VALUES / HIGHLIGHTS BAR ==================== */}
      <section style={{ background: '#BAE6FD', padding: '30px', textAlign: 'center', display: 'flex', justifyContent: 'space-around', fontWeight: 600, color: '#0369a1', borderBottom: '1px solid #BAE6FD' }}>
        <div> Slow Mornings</div>
        <div> Stay Connected</div>
        <div>Clear Checkout</div>
      </section>

      {/* ==================== DYNAMIC PROPERTIES SELECTION LOOP ==================== */}
      <section style={{ padding: '60px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Discover Stays</h2>
        
        {featuredStays.length === 0 ? (
          <div style={{ padding: '24px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748b', fontSize: '14px' }}>
            No properties are currently live. Sign in using your Admin account to upload your first accommodation.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {featuredStays.map(stay => (
              <div key={stay.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '160px', background: '#e2e8f0', marginBottom: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                   Listing Image Block
                </div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{stay.accommodation}</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 12px' }}>{stay.location}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontWeight: 600, paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ color: '#f59e0b' }}>★ {stay.starRating || 'Unrated'}</span>
                  <span style={{ color: '#1B4D3E', fontSize: '16px' }}>{stay.nightlyRate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER LAYOUT SECTION  */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #EAEAEA', padding: '32px 40px', marginTop: '60px', fontSize: '13px', color: '#64748b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}></div>
          <span>© 2026 La Villa Stays. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
           
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
