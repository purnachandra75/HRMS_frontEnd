import React, { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { createClient } from '../../../services/superAdminService';

const EMPTY_FORM = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function CreateClientDrawer({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await createClient(form);
    setLoading(false);
    if (result.success) {
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } else {
      setError(result.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
      <div className="fixed right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border/80 bg-card shadow-lg">
        <div className="relative border-b border-border/80 bg-gradient-to-br from-primary/12 via-card to-sky-500/8 px-6 pb-5 pt-6">
          <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Add client company</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creates the company and its first admin account. The admin logs in through the normal employee login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-6 py-6">
          {error && (
            <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
              {error}
            </div>
          )}

          <Field label="Company name" required value={form.companyName} onChange={update('companyName')} />
          <Field label="Contact email" type="email" value={form.contactEmail} onChange={update('contactEmail')} />
          <Field label="Contact phone" value={form.contactPhone} onChange={update('contactPhone')} />

          <div className="mt-2 border-t border-border/80 pt-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              First admin account
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" value={form.adminFirstName} onChange={update('adminFirstName')} />
                <Field label="Last name" value={form.adminLastName} onChange={update('adminLastName')} />
              </div>
              <Field label="Admin email" type="email" required value={form.adminEmail} onChange={update('adminEmail')} />
              <Field
                label="Admin password"
                type="password"
                required
                value={form.adminPassword}
                onChange={update('adminPassword')}
              />
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Adding…' : 'Add client'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="h-9 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, type = 'text', value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-[#ef4444]"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
