import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../app/store';
import { logout } from '../features/auth/authSlice';


interface Accommodation {
  id: string;
  name: string;
  address: string;
  star_rating: number;
  price_per_night: string | number;
  facilities: string[];
  policies: string[];
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. Read the REAL authenticated admin profile from Redux State Storage
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'overview' | 'accommodations' | 'reservations'>('overview');
  const [liveHotels, setLiveHotels] = useState<Accommodation[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // 2. Real-time API Connection Loop to pull accommodations straight from PostgreSQL
  useEffect(() => {
    if (activeTab === 'accommodations') {
      const fetchInventory = async () => {
        setLoadingHotels(true);
        try {
          const response = await fetch(`$/api/accommodations`)
          if (response.ok) {
            const data = await response.json();
            setLiveHotels(data);
          }
        } catch (error) {
          console.error("Error reading database rows:", error);
        } finally {
          setLoadingHotels(false);
        }
      };
      fetchInventory();
    }
  }, [activeTab]);

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  return (
    <div style={{ background: '#FAF9F6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      
      {/* Dynamic Sidebar Control Module */}
      <aside style={{ background: '#ffffff', borderRight: '1px solid #EAEAEA', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ color: '#1B4D3E', fontSize: '22px', display: 'block', marginBottom: '32px' }}>La Villa</strong>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button type="button" onClick={() => setActiveTab('overview')} style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: '6px', textAlign: 'left', fontWeight: 600, background: activeTab === 'overview' ? '#EAEAEA' : 'none', cursor: 'pointer', color: '#111' }}>Overview</button>
            <button type="button" onClick={() => setActiveTab('accommodations')} style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: '6px', textAlign: 'left', fontWeight: 600, background: activeTab === 'accommodations' ? '#BAE6FD' : 'none', cursor: 'pointer', color: '#111' }}>Accommodations</button>
            <button type="button" onClick={() => setActiveTab('reservations')} style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: '6px', textAlign: 'left', fontWeight: 600, background: activeTab === 'reservations' ? '#EAEAEA' : 'none', cursor: 'pointer', color: '#111' }}>Reservations</button>
          </nav>
        </div>
        <div>
          {/* 🛠️ Dynamic Admin Profile Render (No longer hardcoded!) */}
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: '1.4' }}>
            Admin: <strong>{user?.name || 'CircuitsEntry Dev Admin'}</strong><br />
            Email: <span style={{ fontSize: '11px' }}>{user?.email || 'circuitsentrydev@gmail.com'}</span>
          </div>
          <button type="button" onClick={handleSignOut} style={{ width: '100%', padding: '8px', border: '1px solid #ef4444', borderRadius: '4px', background: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Sign out</button>
        </div>
      </aside>

      {/* Main Workspace Display Grid */}
      <main style={{ padding: '40px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Admin Workspace Portal</span>
            <h1 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: '#111' }}>
              {activeTab === 'overview' ? 'Operational Snapshot' : activeTab === 'accommodations' ? 'Accommodations Inventory' : 'Reservations Logs'}
            </h1>
          </div>
          <button type="button" style={{ background: '#1B4D3E', color: 'white', border: 0, padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add accommodation</button>
        </header>

        {/* VIEW 1: OVERVIEW snap boards */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>Active Accommodations</span>
                <strong style={{ fontSize: '24px', color: '#111' }}>{liveHotels.length || '...'} Listings</strong>
              </div>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>Pending Bookings Review</span>
                <strong style={{ fontSize: '24px', color: '#0284c7' }}>0 Pending</strong>
              </div>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>System Operational Health</span>
                <strong style={{ fontSize: '24px', color: '#16a34a' }}>Live & Active</strong>
              </div>
            </div>
            
            <div style={{ padding: '32px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
              Click on the <strong>Accommodations</strong> tab on the left sidebar to access your live database entries panel.
            </div>
          </div>
        )}

        {/* VIEW 2: LIVE ACCOMMODATIONS INVENTORY DATAGRID */}
        {activeTab === 'accommodations' && (
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '24px' }}>
            {loadingHotels ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Querying active database rows...</div>
            ) : liveHotels.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#64748b', margin: '0 0 16px' }}>No accommodations found in your PostgreSQL database table rows.</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Click "+ Add accommodation" at the top right to populate your inventory.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748b' }}>
                    <th style={{ padding: '12px' }}>Accommodation listing</th>
                    <th style={{ padding: '12px' }}>Address location</th>
                    <th style={{ padding: '12px' }}>Star Rating</th>
                    <th style={{ padding: '12px' }}>Cost per night</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liveHotels.map((hotel) => (
                    <tr key={hotel.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px' }}><strong>{hotel.name}</strong></td>
                      <td style={{ padding: '12px' }}>{hotel.address}</td>
                      <td style={{ padding: '12px', color: '#eab308' }}>{'★'.repeat(hotel.star_rating || 5)}</td>
                      <td style={{ padding: '12px' }}><strong>R {hotel.price_per_night}</strong></td>
                      <td style={{ padding: '12px', color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>Manage</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VIEW 3: LIVE RESERVATIONS MANAGEMENT SNAP */}
        {activeTab === 'reservations' && (
          <div style={{ padding: '40px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
            No incoming guest bookings have been recorded in the database transaction queues yet.
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
