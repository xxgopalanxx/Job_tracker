import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsAPI } from '../services/api';
import ApplicationModal from '../components/ApplicationModal';

const COLUMNS = [
  { key: 'wishlist', label: 'Wishlist', color: 'var(--text-3)' },
  { key: 'applied', label: 'Applied', color: 'var(--blue)' },
  { key: 'phone_screen', label: 'Phone Screen', color: 'var(--cyan)' },
  { key: 'interview', label: 'Interview', color: 'var(--accent)' },
  { key: 'technical', label: 'Technical', color: 'var(--amber)' },
  { key: 'offer', label: 'Offer ✓', color: 'var(--green)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--red)' },
];

const WORK_LABELS = { remote: '🌐', hybrid: '🏢', onsite: '📍' };

export default function KanbanBoard() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['applications', '', ''],
    queryFn: () => jobsAPI.list({ page_size: 200 }).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => jobsAPI.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });

  const applications = allData?.results ?? allData ?? [];

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = applications.filter(a => a.status === col.key);
    return acc;
  }, {});

  const handleDragStart = (e, app) => {
    setDragging(app);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (dragging && dragging.status !== targetStatus) {
      statusMutation.mutate({ id: dragging.id, status: targetStatus });
    }
    setDragging(null);
    setDragOver(null);
  };

  if (isLoading) return (
    <div className="loading-center"><div className="spinner" /></div>
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Kanban Board</h1>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Drag cards to update status
        </div>
      </div>
      <div className="page-body">
        <div className="kanban-board">
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className="kanban-column"
              style={dragOver === col.key ? { borderColor: col.color, background: 'var(--bg-3)' } : {}}
              onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.key)}
            >
              <div className="kanban-header">
                <span className="kanban-title" style={{ color: col.color }}>{col.label}</span>
                <span className="kanban-count">{byStatus[col.key]?.length ?? 0}</span>
              </div>
              <div className="kanban-cards">
                {byStatus[col.key]?.map(app => (
                  <div
                    key={app.id}
                    className="kanban-card"
                    draggable
                    onDragStart={e => handleDragStart(e, app)}
                    onClick={() => setEditing(app)}
                    style={dragging?.id === app.id ? { opacity: 0.4 } : {}}
                  >
                    <div className="kanban-card-company">{app.company}</div>
                    <div className="kanban-card-position">{app.position}</div>
                    <div className="kanban-card-meta">
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {WORK_LABELS[app.work_type]} {app.work_type}
                      </span>
                      {app.interview_count > 0 && (
                        <span style={{ fontSize: 11, background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 6, padding: '1px 6px' }}>
                          {app.interview_count} interviews
                        </span>
                      )}
                    </div>
                    {app.salary_min && (
                      <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>
                        {app.salary_currency} {Number(app.salary_min).toLocaleString()}+
                      </div>
                    )}
                  </div>
                ))}
                {byStatus[col.key]?.length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: 8, marginTop: 4 }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <ApplicationModal
          application={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ['applications'] });
          }}
        />
      )}
    </>
  );
}
