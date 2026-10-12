import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'accommodations' | 'reservations'>('overview');

  // Operational Snapshot Mock Data
  const metrics = { occupancy: '69%', arrivals: 8, pending: 1, revenue: 'R192,000' };

  const recentReservations = [
    { id: 'LV-1043', client: 'Alex Morgan', room: 'Villa Atlantic, Courtyard King', dates: '12-19 Nov 2026', status: 'Confirmed', total: 'R6,380' },
    { id: 'LV-1047', client: 'Jamie Lee', room: 'Garden House, Garden Double', dates: '20-22 Nov 2026', status: 'Pending', total: 'R3,425' },
    { id: 'LV-1049', client: 'Casey Smith', room: 'Clifton Lodge, Ocean Twin', dates: '14-18 Nov 2026', status: 'Confirmed', total: 'R5,210' }
  ];

  const currentHotels = [
    { id: 'HT-001', name: 'Villa Atlantic', loc: 'Sea Point, Cape Town', inventory: '24 rooms · 2 room types', rate: 'From R1,800', status: 'Published' },
    { id: 'HT-002', name: 'Garden House', loc: 'Gardens, Cape Town', inventory: '14 rooms · 2 room types', rate: 'From R1,450', status: 'Published' },
    { id: 'HT-003', name: 'Clifton Lodge', loc: 'Clifton, Cape Town', inventory: '10 rooms · 1 room type', rate: 'From R2,200', status: 'Published' },
    { id: 'HT-004', name: 'Courtyard Annex', loc: 'Sea Point, Cape Town', inventory: '8 rooms · 1 room type', rate: 'From R1,200', status: 'Draft' }
  ];

  return (
    <div style={{ background: '#FAF9F6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      
      {/* Left Structural Side Command Navigation Sidebar */}
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
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Admin: Sam Jacobs<br />Role: Administrator</div>
          <button type="button" onClick={() => navigate('/admin/login')} style={{ width: '100%', padding: '8px', border: '1px solid #ef4444', borderRadius: '4px', background: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Sign out</button>
        </div>
      </aside>

      {/* Right Dashboard Workspace Grid Module Container */}
      <main style={{ padding: '40px' }}>
        
        {/* Top Operational Identity Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Admin · Accommodation management</span>
            <h1 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 700, color: '#111' }}>
              {activeTab === 'overview' ? 'Operational Snapshot' : 'Accommodations Inventory'}
            </h1>
          </div>
          <button type="button" style={{ background: '#1B4D3E', color: 'white', border: 0, padding: '10px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Add accommodation</button>
        </header>

        {/* CONDITION 1: OVERVIEW METRICS SECTION PANEL */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {[
                { title: 'Occupancy today', val: metrics.occupancy, sub: '33 of 48 rooms occupied' },
                { title: 'Arrivals today', val: metrics.arrivals, sub: '5 checked in · 3 expected' },
                { title: 'Pending reservations', val: metrics.pending, sub: 'Review required' },
                { title: 'October revenue', val: metrics.revenue, sub: 'Sample verified payments' }
              ].map((m, idx) => (
                <div key={idx} style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>{m.title}</span>
                  <strong style={{ fontSize: '24px', color: '#111', display: 'block', marginBottom: '4px' }}>{m.val}</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{m.sub}</span>
                </div>
              ))}
            </div>

            {/* Recent Reservations Table Layout Wrapper */}
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Recent reservations</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748b' }}>
                    <th style={{ padding: '12px' }}>Reservation / guest</th>
                    <th style={{ padding: '12px' }}>Accommodation / room</th>
                    <th style={{ padding: '12px' }}>Dates</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px' }}><strong>{r.id}</strong><br /><span style={{ fontSize: '12px', color: '#64748b' }}>{r.client}</span></td>
                      <td style={{ padding: '12px' }}>{r.room}</td>
                      <td style={{ padding: '12px' }}>{r.dates}</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: r.status === 'Confirmed' ? '#DCFCE7' : '#FEF9C3', color: r.status === 'Confirmed' ? '#15803D' : '#A16207' }}>{r.status}</span></td>
                      <td style={{ padding: '12px' }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONDITION 2: ACCOMMODATIONS MANAGEMENT DATA GRID INVENTORY MAP */}
        {activeTab === 'accommodations' && (
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>Accommodation</th>
                  <th style={{ padding: '12px' }}>Location</th>
                  <th style={{ padding: '12px' }}>Room inventory</th>
                  <th style={{ padding: '12px' }}>Nightly rate</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHotels.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '12px' }}><strong>{h.name}</strong><br /><span style={{ fontSize: '11px', color: '#94a3b8' }}>{h.id}</span></td>
                    <td style={{ padding: '12px' }}>{h.loc}</td>
                    <td style={{ padding: '12px' }}>{h.inventory}</td>
                    <td style={{ padding: '12px' }}>{h.rate}</td>
                    <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: h.status === 'Published' ? '#DCFCE7' : '#F1F5F9', color: h.status === 'Published' ? '#15803D' : '#475569' }}>{h.status}</span></td>
                    <td style={{ padding: '12px', color: '#1B4D3E', fontWeight: 600, cursor: 'pointer' }}>View · Edit</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
