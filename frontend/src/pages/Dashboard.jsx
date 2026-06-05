import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { jobsAPI } from '../services/api';
import { format, parseISO } from 'date-fns';

const STATUS_COLORS = {
  wishlist: '#5c5d6e',
  applied: '#3b82f6',
  phone_screen: '#06b6d4',
  interview: '#6c63ff',
  technical: '#f59e0b',
  offer: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#374151',
};

const STATUS_LABELS = {
  wishlist: 'Wishlist', applied: 'Applied', phone_screen: 'Phone Screen',
  interview: 'Interview', technical: 'Technical', offer: 'Offer',
  rejected: 'Rejected', withdrawn: 'Withdrawn',
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-3)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13
    }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{payload[0].value} applications</div>
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => jobsAPI.dashboard().then(r => r.data),
  });

  if (isLoading) return (
    <div className="loading-center"><div className="spinner" /></div>
  );

  const pieData = data
    ? Object.entries(data.by_status)
        .filter(([, v]) => v > 0)
        .map(([status, value]) => ({ name: STATUS_LABELS[status], value, status }))
    : [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {format(new Date(), 'EEEE, MMMM d yyyy')}
        </div>
      </div>
      <div className="page-body">
        <div className="stat-grid">
          <StatCard label="Total Applications" value={data?.total ?? 0} sub="All time" />
          <StatCard label="Active" value={(data?.by_status?.applied ?? 0) + (data?.by_status?.interview ?? 0)} sub="Applied + interview" color="var(--accent)" />
          <StatCard label="Response Rate" value={`${data?.response_rate ?? 0}%`} sub="Heard back" color="var(--cyan)" />
          <StatCard label="Offers" value={data?.by_status?.offer ?? 0} sub={`${data?.offer_rate ?? 0}% offer rate`} color="var(--green)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 20 }}>
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Monthly Applications</div>
            {data?.monthly_applications?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.monthly_applications} barSize={28}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-4)' }} />
                  <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <p>No data yet — start adding applications!</p>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>By Status</div>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <p>No applications yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Activity</div>
          {data?.recent_activity?.length ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th><th>Position</th><th>Status</th><th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_activity.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500 }}>{app.company}</td>
                      <td style={{ color: 'var(--text-2)' }}>{app.position}</td>
                      <td>
                        <span className={`status-badge status-${app.status}`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: 13 }}>
                        {format(parseISO(app.updated_at), 'MMM d')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><p>No recent activity</p></div>
          )}
        </div>
      </div>
    </>
  );
}
