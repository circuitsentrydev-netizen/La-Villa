import  {useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface Stay {
  id: string;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string;
  status: string;
}

export function DiscoverStays() {
  const navigate = useNavigate();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/accommodations?status=Published`)
      .then((res) => res.json())
      .then((data) => setStays(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#FAF9F6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '40px' }}>
      <header style={{ maxWidth: '1200px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ color: '#1B4D3E', fontSize: '26px', cursor: 'pointer' }} onClick={() => navigate('/')}>La Villa</strong>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>All available accommodations posted live from the backoffice portal.</p>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
          ← Back to Home
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Downloading database listings arrays...</div>
        ) : stays.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748b' }}>
            No listings are currently online. Log in as an Administrator to populate properties.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {stays.map((stay) => (
              <div key={stay.id} style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ height: '200px', backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url('https://marriott.com')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{stay.accommodation}</h3>
                  <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>{stay.location}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9', fontWeight: 600 }}>
                    <span style={{ color: '#f59e0b' }}>★ {stay.starRating || '5.0'}</span>
                    <strong style={{ color: '#1B4D3E', fontSize: '16px' }}>{stay.nightlyRate}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
export default DiscoverStays;
