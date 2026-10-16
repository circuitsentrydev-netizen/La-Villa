import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';
import { API_BASE_URL } from '../config/api';

interface Accommodation {
  id: string;
  accommodation: string;
  location: string;
  starRating: number;
  nightlyRate: string;
  status: string;
  roomInventory: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'overview' | 'accommodations'>('overview');
  const [liveHotels, setLiveHotels] = useState<Accommodation[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  useEffect(() => {
    if (activeTab === 'accommodations' || activeTab === 'overview') {
      const fetchInventory = async () => {
        setLoadingHotels(true);
        try {
          const token = localStorage.getItem('lavilla_token');
          const response = await fetch(`${API_BASE_URL}/accommodations`, {
            method: 'GET',
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
          });
          if (response.ok) {
            const data = await response.json();
            setLiveHotels(data);
          }
        } catch (error) {
          console.error("Error reading database:", error);
        } finally {
          setLoadingHotels(false);
        }
      };
      fetchInventory();
    }
  }, [activeTab]);

  return (
    <div style={{ background: '#FAF9F6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      <aside style={{ background: '#ffffff', borderRight: '1px solid #EAEAEA', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ color: '#1B4D3E', fontSize: '22px', display: 'block', marginBottom: '32px' }}>La Villa</strong>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button type="button" onClick={() => setActiveTab('overview')} style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: '6px', textAlign: 'left', fontWeight: 600, background: activeTab === 'overview' ? '#EAEAEA' : 'none', cursor: 'pointer' }}>Overview</button>
            <button type="button" onClick={() => setActiveTab('accommodations')} style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: '6px', textAlign: 'left', fontWeight: 600, background: activeTab === 'accommodations' ? '#BAE6FD' : 'none', cursor: 'pointer' }}>Accommodations</button>
          </nav>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Admin: <strong>{user?.name || 'Root Master'}</strong>
          </div>
          <button type="button" onClick={() => { localStorage.clear(); dispatch(logout()); navigate('/admin/login'); }} style={{ width: '100%', padding: '8px', border: '1px solid #ef4444', borderRadius: '4px', background: 'none', color: '#ef4444', cursor: 'pointer' }}>Sign out</button>
        </div>
      </aside>

      <main style={{ padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{activeTab === 'overview' ? 'Operational Snapshot' : 'Accommodations Inventory'}</h1>
          <button type="button" onClick={() => navigate('/admin/accommodations/new')} style={{ background: '#1B4D3E', color: 'white', border: 0, padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add accommodation</button>
        </header>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Active Accommodations</span>
              <strong style={{ display: 'block', fontSize: '24px' }}>
                {loadingHotels ? '...' : `${liveHotels.length} Listings`}
              </strong>
            </div>
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>System Status</span>
              <strong style={{ display: 'block', fontSize: '24px', color: '#16a34a' }}>Live & Connected</strong>
            </div>
          </div>
        )}

        {activeTab === 'accommodations' && (
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '24px' }}>
            {/* 💡 Fixed: Implemented loadingHotels flag check interface wrapper to clear TS warnings */}
            {loadingHotels ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                Querying active database rows...
              </div>
            ) : liveHotels.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No accommodations found in your database. Click "+ Add accommodation" to start.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Accommodation</th>
                    <th style={{ padding: '12px' }}>Location</th>
                    <th style={{ padding: '12px' }}>Rating</th>
                    <th style={{ padding: '12px' }}>Rate</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveHotels.map((hotel) => (
                    <tr key={hotel.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{hotel.accommodation}</td>
                      <td style={{ padding: '12px' }}>{hotel.location}</td>
                      <td style={{ padding: '12px', color: '#f59e0b' }}>★ {hotel.starRating}</td>
                      <td style={{ padding: '12px' }}>{hotel.nightlyRate}</td>
                      <td style={{ padding: '12px' }}>{hotel.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
export default AdminDashboard;
