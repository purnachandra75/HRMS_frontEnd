import React, { useEffect, useState } from 'react';
import {
  getPayslipSettings,
  updatePayslipSettings,
  uploadPayslipLogo,
  fetchPayslipLogoObjectUrl,
} from '../services/payslipSettingsService';
import AdminLayout from '../components/AdminLayout';
import '../styles/tailwind.css';

const DEFAULT_FORM = {
  companyName: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  phone: '',
  website: '',
  email: '',
  basicPercent: 50,
  hraPercent: 20,
  specialAllowancePercent: 30,
  pfPercent: 12,
  professionalTax: 200,
  esiAmount: 600,
  customEarnings: [],
  customDeductions: [],
};

const emptyLineItem = () => ({ label: '', valueType: 'FLAT', value: 0 });

const PERCENT_SUM_TOLERANCE = 0.01;

function PayslipSettingsPage({ userName, onLogout }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let revokeUrl = null;

    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const settings = await getPayslipSettings();
        setForm({
          companyName: settings.companyName || '',
          addressLine1: settings.addressLine1 || '',
          addressLine2: settings.addressLine2 || '',
          addressLine3: settings.addressLine3 || '',
          phone: settings.phone || '',
          website: settings.website || '',
          email: settings.email || '',
          basicPercent: settings.basicPercent ?? 50,
          hraPercent: settings.hraPercent ?? 20,
          specialAllowancePercent: settings.specialAllowancePercent ?? 30,
          pfPercent: settings.pfPercent ?? 12,
          professionalTax: settings.professionalTax ?? 200,
          esiAmount: settings.esiAmount ?? 600,
          customEarnings: settings.customEarnings || [],
          customDeductions: settings.customDeductions || [],
        });

        if (settings.hasLogo) {
          const objectUrl = await fetchPayslipLogoObjectUrl();
          revokeUrl = objectUrl;
          setLogoPreviewUrl(objectUrl);
        }
      } catch (err) {
        console.error('Failed to load payslip settings:', err);
        setError(err.message || 'Failed to load payslip settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    return () => {
      if (revokeUrl) window.URL.revokeObjectURL(revokeUrl);
    };
  }, []);

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleNumberFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value === '' ? '' : Number(value) }));
  };

  const customEarningsPercentTotal = form.customEarnings
    .filter((item) => item.valueType === 'PERCENT')
    .reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const percentTotal = Number(form.basicPercent || 0)
    + Number(form.hraPercent || 0)
    + Number(form.specialAllowancePercent || 0)
    + customEarningsPercentTotal;
  const percentTotalValid = Math.abs(percentTotal - 100) <= PERCENT_SUM_TOLERANCE;

  const handleAddLineItem = (listField) => {
    setForm((current) => ({ ...current, [listField]: [...current[listField], emptyLineItem()] }));
  };

  const handleRemoveLineItem = (listField, index) => {
    setForm((current) => ({
      ...current,
      [listField]: current[listField].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleLineItemChange = (listField, index, field, value) => {
    setForm((current) => ({
      ...current,
      [listField]: current[listField].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: field === 'value' ? (value === '' ? '' : Number(value)) : value } : item
      ),
    }));
  };

  const handleLogoChange = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    setError('');
    setStatusMessage('');
    try {
      await uploadPayslipLogo(file);
      const objectUrl = await fetchPayslipLogoObjectUrl();
      setLogoPreviewUrl((current) => {
        if (current) window.URL.revokeObjectURL(current);
        return objectUrl;
      });
      setStatusMessage('Logo uploaded successfully.');
    } catch (err) {
      console.error('Failed to upload payslip logo:', err);
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!percentTotalValid) return;

    setSaving(true);
    setError('');
    setStatusMessage('');
    try {
      await updatePayslipSettings(form);
      setStatusMessage('Payslip settings saved successfully.');
    } catch (err) {
      console.error('Failed to save payslip settings:', err);
      setError(err.message || 'Failed to save payslip settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="payslip-settings"
      title="Payslip Settings"
      subtitle="Configure your company branding and the salary percentages used to auto-generate employee payslips."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading payslip settings...</p>
      ) : (
        <div className="flex flex-col gap-5">
          {(error || statusMessage) && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                error
                  ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                  : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
              }`}
            >
              {error || statusMessage}
            </div>
          )}

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Company Branding</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Shown on every auto-generated payslip.</p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Logo</label>
                <div className="flex items-center gap-3">
                  {logoPreviewUrl && (
                    <img src={logoPreviewUrl} alt="Company logo" className="h-9 w-9 rounded border border-border object-contain" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingLogo}
                    onChange={(e) => handleLogoChange(e.target.files[0])}
                    className="max-w-[220px] text-xs text-muted-foreground"
                  />
                  {uploadingLogo && <span className="text-xs text-muted-foreground">Uploading...</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Address Line 1</label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Address Line 2</label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Address Line 3</label>
                <input
                  type="text"
                  value={form.addressLine3}
                  onChange={(e) => handleFieldChange('addressLine3', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Earnings Split</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Basic, HRA and Special Allowance percentages of monthly gross salary, plus any percent-based Custom
              Earnings below. Must add up to 100%.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Basic %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.basicPercent}
                  onChange={(e) => handleNumberFieldChange('basicPercent', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">HRA %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.hraPercent}
                  onChange={(e) => handleNumberFieldChange('hraPercent', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Special Allowance %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.specialAllowancePercent}
                  onChange={(e) => handleNumberFieldChange('specialAllowancePercent', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
            </div>

            <p className={`mt-3 text-sm ${percentTotalValid ? 'text-muted-foreground' : 'text-[#b91c1c]'}`}>
              Total: {percentTotal.toFixed(2)}%
              {customEarningsPercentTotal > 0 && ` (includes ${customEarningsPercentTotal.toFixed(2)}% from Custom Earnings)`}
              {!percentTotalValid && ' (must equal 100%)'}
            </p>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Deductions</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Applied only when an employee is flagged as PF/ESI applicable.</p>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">PF % (of Basic)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.pfPercent}
                  onChange={(e) => handleNumberFieldChange('pfPercent', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Professional Tax (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.professionalTax}
                  onChange={(e) => handleNumberFieldChange('professionalTax', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">ESI (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.esiAmount}
                  onChange={(e) => handleNumberFieldChange('esiAmount', e.target.value)}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Custom Earnings</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Extra earning components (e.g. Conveyance Allowance). Percent is of monthly gross - Percent-type rows
              share the 100% split with Basic/HRA/Special above; Flat ₹ rows are added on top.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {form.customEarnings.length === 0 && (
                <p className="text-sm text-muted-foreground">No custom earnings added.</p>
              )}
              {form.customEarnings.map((item, index) => (
                <LineItemRow
                  key={index}
                  item={item}
                  onChange={(field, value) => handleLineItemChange('customEarnings', index, field, value)}
                  onRemove={() => handleRemoveLineItem('customEarnings', index)}
                />
              ))}
              <button
                type="button"
                onClick={() => handleAddLineItem('customEarnings')}
                className="h-9 w-fit rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                + Add Earning
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">Custom Deductions</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Extra deduction components (e.g. Loan Recovery) added on top of PF/Professional Tax/ESI. Percent is of earned Basic.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {form.customDeductions.length === 0 && (
                <p className="text-sm text-muted-foreground">No custom deductions added.</p>
              )}
              {form.customDeductions.map((item, index) => (
                <LineItemRow
                  key={index}
                  item={item}
                  onChange={(field, value) => handleLineItemChange('customDeductions', index, field, value)}
                  onRemove={() => handleRemoveLineItem('customDeductions', index)}
                />
              ))}
              <button
                type="button"
                onClick={() => handleAddLineItem('customDeductions')}
                className="h-9 w-fit rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                + Add Deduction
              </button>
            </div>
          </section>

          <div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !percentTotalValid}
              className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function LineItemRow({ item, onChange, onRemove }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 min-w-[160px] flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Label</label>
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="e.g. Conveyance Allowance"
          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Type</label>
        <select
          value={item.valueType}
          onChange={(e) => onChange('valueType', e.target.value)}
          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
        >
          <option value="FLAT">Flat ₹</option>
          <option value="PERCENT">Percent %</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Value</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.value}
          onChange={(e) => onChange('value', e.target.value)}
          className="h-9 w-32 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="h-9 rounded-lg border border-[#fecaca] bg-white px-3 text-sm font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
      >
        Remove
      </button>
    </div>
  );
}

export default PayslipSettingsPage;
