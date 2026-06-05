import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import ApplicationModal from '../components/ApplicationModal';

const STATUS_LABELS = {
  wishlist: 'Wishlist', applied: 'Applied', phone_screen: 'Phone Screen',
  interview: 'Interview', technical: 'Technical', offer: 'Offer',
  rejected: 'Rejected', withdrawn: 'Withdrawn',
};

const WORK_TYPE_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

export default function Applications() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter],
    queryFn: () => jobsAPI.list({ search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => jobsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });

  const handleEdit = (app) => { setEditing(app); setModalOpen(true); };
  const handleNew = () => { setEditing(null); setModalOpen(true); };
  const handleDelete = (id) => {
    if (window.confirm('Delete this application?')) deleteMutation.mutate(id);
  };

  const applications = data?.results ?? data ?? [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Applications</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Application
        </button>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            className="form-input"
            placeholder="Search company, position..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications yet</h3>
              <p>Click "Add Application" to track your first one.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Applied</th>
                    <th>Salary</th>
                    <th>Interviews</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} onClick={() => handleEdit(app)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600 }}>{app.company}</td>
                      <td style={{ color: 'var(--text-2)' }}>{app.position}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <span className={`status-badge status-${app.status}`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>
                        {WORK_TYPE_LABELS[app.work_type]}
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: 13 }}>
                        {app.applied_date ? format(parseISO(app.applied_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {app.salary_min
                          ? `${app.salary_currency} ${Number(app.salary_min).toLocaleString()}${app.salary_max ? `–${Number(app.salary_max).toLocaleString()}` : '+'}`
                          : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 13, color: app.interview_count > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                        {app.interview_count > 0 ? `${app.interview_count} scheduled` : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--red)' }}
                          onClick={() => handleDelete(app.id)}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ApplicationModal
          application={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            qc.invalidateQueries({ queryKey: ['applications'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
          }}
        />
      )}
    </>
  );
}
