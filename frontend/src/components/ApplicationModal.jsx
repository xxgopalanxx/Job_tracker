import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { jobsAPI } from '../services/api';

const STATUS_CHOICES = [
  ['wishlist','Wishlist'],['applied','Applied'],['phone_screen','Phone Screen'],
  ['interview','Interview'],['technical','Technical Round'],['offer','Offer'],
  ['rejected','Rejected'],['withdrawn','Withdrawn'],
];

const WORK_TYPES = [['remote','Remote'],['hybrid','Hybrid'],['onsite','On-site']];
const JOB_TYPES = [['full_time','Full Time'],['part_time','Part Time'],['contract','Contract'],['internship','Internship']];

const emptyForm = {
  company: '', position: '', location: '', job_url: '', status: 'wishlist',
  work_type: 'remote', job_type: 'full_time', salary_min: '', salary_max: '',
  salary_currency: 'USD', applied_date: '', deadline: '', notes: '', description: '',
};

export default function ApplicationModal({ application, onClose, onSaved }) {
  const isEdit = Boolean(application);
  const [form, setForm] = useState(application ? {
    ...emptyForm, ...application,
    salary_min: application.salary_min ?? '',
    salary_max: application.salary_max ?? '',
  } : emptyForm);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? jobsAPI.update(application.id, data)
      : jobsAPI.create(data),
    onSuccess: onSaved,
    onError: (err) => setError(err.response?.data?.detail || 'Something went wrong.'),
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company || !form.position) {
      setError('Company and position are required.');
      return;
    }
    const payload = { ...form };
    if (!payload.salary_min) delete payload.salary_min;
    if (!payload.salary_max) delete payload.salary_max;
    if (!payload.applied_date) delete payload.applied_date;
    if (!payload.deadline) delete payload.deadline;
    mutation.mutate(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Application' : 'New Application'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            <div className="row">
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input className="form-input" value={form.company} onChange={set('company')} placeholder="Google, Meta..." />
              </div>
              <div className="form-group">
                <label className="form-label">Position *</label>
                <input className="form-input" value={form.position} onChange={set('position')} placeholder="Software Engineer..." />
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={set('status')}>
                  {STATUS_CHOICES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={set('location')} placeholder="Remote, New York..." />
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label className="form-label">Work Type</label>
                <select className="form-input" value={form.work_type} onChange={set('work_type')}>
                  {WORK_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select className="form-input" value={form.job_type} onChange={set('job_type')}>
                  {JOB_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Job URL</label>
              <input className="form-input" value={form.job_url} onChange={set('job_url')} placeholder="https://..." />
            </div>
            <div className="row">
              <div className="form-group">
                <label className="form-label">Salary Min</label>
                <input className="form-input" type="number" value={form.salary_min} onChange={set('salary_min')} placeholder="50000" />
              </div>
              <div className="form-group">
                <label className="form-label">Salary Max</label>
                <input className="form-input" type="number" value={form.salary_max} onChange={set('salary_max')} placeholder="80000" />
              </div>
              <div className="form-group" style={{ maxWidth: 90 }}>
                <label className="form-label">Currency</label>
                <input className="form-input" value={form.salary_currency} onChange={set('salary_currency')} placeholder="USD" maxLength={3} />
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label className="form-label">Applied Date</label>
                <input className="form-input" type="date" value={form.applied_date} onChange={set('applied_date')} />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={form.deadline} onChange={set('deadline')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" value={form.notes} onChange={set('notes')} placeholder="Recruiter contact, referral info, etc." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
