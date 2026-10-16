import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { getAllEmployees } from '../services/employeeService';
import { getPayslipSettings, fetchPayslipLogoObjectUrl } from '../services/payslipSettingsService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// The printable payslip (.payslip-sheet and friends) is captured to PDF via html2canvas, so it
// keeps its exact print-style markup/CSS rather than being re-skinned in Tailwind.
import '../styles/Dashboard.css';
import '../styles/tailwind.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DEFAULT_SETTINGS = {
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
};

const inputClass =
  'h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDisplayAmount(value, fallback = 'NA') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number' && Number.isNaN(value)) return fallback;
  return typeof value === 'number' ? formatCurrency(value) : value;
}

/**
 * The company payslip template (same layout as the employee Payslip page).
 *
 * settings: the client's payslip settings (company name/address/contact).
 * logoUrl: object URL of the uploaded logo, or null to show the company name instead.
 * payslip: {
 *   employeeName, employeeCode, monthLabel, year,
 *   designation, location, department, grade, panNumber, gender, doj,
 *   payableDays, workingDays, lop, pfNumber, uanNumber, bankName, bankAccount,
 *   earnings: [{ label, actual, earned }], deductions: [{ label, amount }],
 *   variablePay, totalActual, totalEarned (without variable pay), totalDeductions, netPay
 * }
 */
const PayslipDocument = forwardRef(function PayslipDocument({ settings, logoUrl, payslip }, ref) {
  const variablePay = Number(payslip.variablePay) || 0;

  return (
    <div className="payslip-preview keep-light">
      <div className="payslip-sheet" ref={ref}>
        <div className="payslip-border">
          <div className="payslip-top-grid">
            <div className="payslip-logo-box">
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo" className="payslip-logo-image" />
              ) : (
                <div className="payslip-logo-text">
                  <div className="payslip-logo-main">{settings.companyName || 'COMPANY'}</div>
                </div>
              )}
            </div>
            <div className="payslip-company-box">
              <div className="payslip-bluebar payslip-company-title">{settings.companyName}</div>
              <div className="payslip-company-content">
                <p>{settings.addressLine1}</p>
                <p>{settings.addressLine2}</p>
                <p>{settings.addressLine3}</p>
                <p>{settings.phone}</p>
                <p className="payslip-link">{settings.website}</p>
                <p className="payslip-link">{settings.email}</p>
              </div>
            </div>
          </div>

          <div className="payslip-bluebar payslip-month-bar">
            Pay Slip for the Month of {payslip.monthLabel} {payslip.year}
          </div>

          <table className="payslip-details-table">
            <tbody>
              <tr>
                <td className="label">Name</td>
                <td className="value">{payslip.employeeName}</td>
                <td className="label">Emp.Code</td>
                <td className="value">{payslip.employeeCode || 'N/A'}</td>
              </tr>
              <tr>
                <td className="label">Designation</td>
                <td className="value">{payslip.designation}</td>
                <td className="label">Location</td>
                <td className="value">{payslip.location}</td>
              </tr>
              <tr>
                <td className="label">Department</td>
                <td className="value">{payslip.department}</td>
                <td className="label">Grade</td>
                <td className="value">{payslip.grade}</td>
              </tr>
              <tr>
                <td className="label">PAN</td>
                <td className="value">{payslip.panNumber}</td>
                <td className="label">Payable Days</td>
                <td className="value">{payslip.payableDays}</td>
              </tr>
              <tr>
                <td className="label">Gender</td>
                <td className="value">{payslip.gender}</td>
                <td className="label">Working Days</td>
                <td className="value">{payslip.workingDays}</td>
              </tr>
              <tr>
                <td className="label">D.O.J</td>
                <td className="value">{payslip.doj}</td>
                <td className="label">LOP</td>
                <td className="value">{payslip.lop}</td>
              </tr>
              <tr>
                <td className="label">PF No</td>
                <td className="value">{payslip.pfNumber}</td>
                <td className="label">UAN No</td>
                <td className="value">{payslip.uanNumber}</td>
              </tr>
              <tr>
                <td className="label">Bank Name</td>
                <td className="value">{payslip.bankName}</td>
                <td className="label">Bank A/C</td>
                <td className="value">{payslip.bankAccount}</td>
              </tr>
            </tbody>
          </table>

          <table className="payslip-salary-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th className="amount">Actuals</th>
                <th className="amount">Earned</th>
                <th>Deductions</th>
                <th className="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({
                length: Math.max(payslip.earnings.length, payslip.deductions.length),
              }).map((_, index) => {
                const earning = payslip.earnings[index];
                const deduction = payslip.deductions[index];
                return (
                  <tr key={`${earning?.label || ''}-${deduction?.label || ''}-${index}`}>
                    <td>{earning?.label || ''}</td>
                    <td className="amount">{earning ? formatCurrency(earning.actual) : ''}</td>
                    <td className="amount">{earning ? formatCurrency(earning.earned) : ''}</td>
                    <td>{deduction?.label || ''}</td>
                    <td className="amount">{deduction ? formatDisplayAmount(deduction.amount) : ''}</td>
                  </tr>
                );
              })}
              {variablePay > 0 && (
                <tr>
                  <td>Variable Pay</td>
                  <td className="amount">{formatCurrency(variablePay)}</td>
                  <td className="amount">{formatCurrency(variablePay)}</td>
                  <td></td>
                  <td className="amount"></td>
                </tr>
              )}
              <tr className="total-row">
                <td>Total(INR)</td>
                <td className="amount">{formatCurrency(payslip.totalActual)}</td>
                <td className="amount">{formatCurrency(payslip.totalEarned + variablePay)}</td>
                <td>Total Deductions(INR)</td>
                <td className="amount">{formatCurrency(payslip.totalDeductions)}</td>
              </tr>
              <tr className="net-row">
                <td colSpan="2">Net Pay(INR)</td>
                <td colSpan="3" className="net-value">{formatCurrency(payslip.netPay)}</td>
              </tr>
            </tbody>
          </table>

          <p className="payslip-footer">
            This is a system generated payslip and does not require authentication
          </p>
        </div>
      </div>
    </div>
  );
});

// Captures a rendered payslip element and saves it as an A4 PDF, spilling onto extra pages
// if it's taller than one page.
async function downloadElementAsPdf(element, fileName = 'Payslip.pdf') {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pageHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
}

function countWeekdaysInMonth(year, monthIndex) {
  const current = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  let count = 0;
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const fullName = (employee) =>
  `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || 'N/A';

let nextRowId = 1;
const newRow = (label = '', amount = '') => ({ id: nextRowId++, label, amount: String(amount) });

// Starting point when an employee is picked: the company's usual salary split of their CTC
// (from Payslip Settings) and the standard deductions. Every row stays editable/removable.
function suggestedEarnings(employee, settings) {
  const ctc = Number(employee.ctc) || 0;
  const basicPercent = Number(settings.basicPercent) / 100 || 0.5;
  const monthlyGross = ctc > 0 ? ctc / 12 : (Number(employee.basicSalary) || 0) / basicPercent;
  if (!monthlyGross) {
    return [newRow('Basic Pay'), newRow('House Rent Allowance'), newRow('Special Allowance')];
  }
  return [
    newRow('Basic Pay', round2(monthlyGross * basicPercent)),
    newRow('House Rent Allowance', round2(monthlyGross * (Number(settings.hraPercent) / 100))),
    newRow('Special Allowance', round2(monthlyGross * (Number(settings.specialAllowancePercent) / 100))),
  ];
}

function suggestedDeductions(employee, settings, basicAmount) {
  const rows = [newRow('Professional Tax', round2(settings.professionalTax))];
  if (String(employee.pfApplicable).toLowerCase() === 'yes') {
    rows.push(newRow('PF Deductions', round2(basicAmount * (Number(settings.pfPercent) / 100))));
  }
  if (String(employee.esiApplicable).toLowerCase() === 'yes') {
    rows.push(newRow('Insurance', round2(settings.esiAmount)));
  }
  return rows;
}

function ManualPayslipPage({ userName, onLogout }) {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [workingDays, setWorkingDays] = useState(String(countWeekdaysInMonth(now.getFullYear(), now.getMonth())));
  const [lopDays, setLopDays] = useState('0');
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [formError, setFormError] = useState('');

  // Snapshot taken when Generate is clicked - later form edits don't change the shown payslip
  // until it's generated again.
  const [payslip, setPayslip] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const payslipRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const load = async () => {
      try {
        const [employeeList, settingsData] = await Promise.all([
          getAllEmployees(),
          getPayslipSettings().catch(() => DEFAULT_SETTINGS),
        ]);
        if (cancelled) return;
        setEmployees(
          employeeList
            .filter((employee) => employee.employeeId)
            .sort((a, b) => String(a.employeeId).localeCompare(String(b.employeeId), undefined, { numeric: true }))
        );
        setSettings({ ...DEFAULT_SETTINGS, ...settingsData });
        if (settingsData?.hasLogo) {
          objectUrl = await fetchPayslipLogoObjectUrl();
          if (!cancelled) setLogoUrl(objectUrl);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
        if (!cancelled) setLoadError('Unable to load employees. Please refresh the page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === String(selectedEmployeeId)) || null,
    [employees, selectedEmployeeId]
  );

  const handleEmployeeChange = (value) => {
    setSelectedEmployeeId(value);
    setPayslip(null);
    setFormError('');
    const employee = employees.find((item) => String(item.id) === String(value));
    if (!employee) {
      setEarnings([]);
      setDeductions([]);
      return;
    }
    const suggested = suggestedEarnings(employee, settings);
    setEarnings(suggested);
    setDeductions(suggestedDeductions(employee, settings, Number(suggested[0]?.amount) || 0));
  };

  const handleMonthYearChange = (nextMonth, nextYear) => {
    setMonth(nextMonth);
    setYear(nextYear);
    setWorkingDays(String(countWeekdaysInMonth(nextYear, nextMonth - 1)));
    setPayslip(null);
  };

  const updateRow = (setRows) => (id, field, value) =>
    setRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  const removeRow = (setRows) => (id) => setRows((rows) => rows.filter((row) => row.id !== id));
  const updateEarning = updateRow(setEarnings);
  const updateDeduction = updateRow(setDeductions);

  const sumRows = (rows) => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  // Earnings are entered as full-month actuals; what's actually earned is pro-rated for LOP:
  // earned = actual x (working days - LOP days) / working days.
  const workingNumber = Number(workingDays);
  const lopNumber = Number(lopDays) || 0;
  const payRatio = workingNumber > 0 && lopNumber >= 0 && lopNumber <= workingNumber
    ? (workingNumber - lopNumber) / workingNumber
    : 1;
  const earnedAmount = (actual) => round2((Number(actual) || 0) * payRatio);
  const totalActualEarnings = sumRows(earnings);
  const totalEarnedEarnings = earnings.reduce((sum, row) => sum + earnedAmount(row.amount), 0);
  const totalDeductions = sumRows(deductions);

  const handleGenerate = () => {
    setFormError('');
    if (!selectedEmployee) {
      setFormError('Please select an employee.');
      return;
    }
    const working = Number(workingDays);
    const lop = Number(lopDays) || 0;
    if (!Number.isFinite(working) || working <= 0) {
      setFormError('Working days must be greater than 0.');
      return;
    }
    if (lop < 0 || lop > working) {
      setFormError('LOP days must be between 0 and the working days.');
      return;
    }
    const filledEarnings = earnings.filter((row) => row.label.trim() || row.amount !== '');
    const filledDeductions = deductions.filter((row) => row.label.trim() || row.amount !== '');
    const invalid = [...filledEarnings, ...filledDeductions].find(
      (row) => !row.label.trim() || row.amount === '' || Number.isNaN(Number(row.amount)) || Number(row.amount) < 0
    );
    if (invalid) {
      setFormError('Every earning and deduction needs a name and an amount of 0 or more.');
      return;
    }
    if (filledEarnings.length === 0) {
      setFormError('Add at least one earning.');
      return;
    }

    const ratio = (working - lop) / working;
    const earningItems = filledEarnings.map((row) => ({
      label: row.label.trim(),
      actual: Number(row.amount),
      earned: round2(Number(row.amount) * ratio),
    }));
    const deductionItems = filledDeductions.map((row) => ({ label: row.label.trim(), amount: Number(row.amount) }));
    const actualTotal = earningItems.reduce((sum, item) => sum + item.actual, 0);
    const earnedTotal = earningItems.reduce((sum, item) => sum + item.earned, 0);
    const deductionTotal = deductionItems.reduce((sum, item) => sum + item.amount, 0);
    const employee = selectedEmployee;

    setPayslip({
      employeeName: fullName(employee),
      employeeCode: employee.employeeId,
      monthLabel: MONTH_NAMES[month - 1],
      year,
      designation: employee.designation || 'N/A',
      location: employee.workLocation || 'N/A',
      department: employee.department || 'N/A',
      grade: employee.employeeCategory || 'N/A',
      panNumber: employee.panNumber || 'N/A',
      gender: employee.gender || 'N/A',
      doj: employee.dateOfJoining || 'N/A',
      workingDays: working,
      lop,
      payableDays: working - lop,
      pfNumber: employee.pfNumber || 'N/A',
      uanNumber: employee.uanNumber || 'N/A',
      bankName: employee.bankName || 'N/A',
      bankAccount: employee.accountNumber || 'N/A',
      earnings: earningItems,
      deductions: deductionItems,
      variablePay: 0,
      totalActual: actualTotal,
      totalEarned: earnedTotal,
      totalDeductions: deductionTotal,
      netPay: earnedTotal - deductionTotal,
    });
    // Bring the generated payslip into view below the form.
    setTimeout(() => payslipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleDownload = async () => {
    if (!payslip) return;
    setDownloading(true);
    try {
      const safeCode = String(payslip.employeeCode || 'employee').replace(/[^A-Za-z0-9_-]/g, '');
      await downloadElementAsPdf(payslipRef.current, `Payslip_${safeCode}_${payslip.monthLabel}_${payslip.year}.pdf`);
    } catch (err) {
      console.error('Failed to download payslip:', err);
      setFormError('Failed to download the payslip PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const yearOptions = Array.from({ length: 11 }, (_, index) => now.getFullYear() - 5 + index);

  // showEarned: for earnings, show the LOP-adjusted earned amount next to each actual.
  const renderRows = (rows, update, remove, placeholder, showEarned = false) => (
    <div className="flex flex-col gap-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No rows yet.</p>}
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="text"
            value={row.label}
            onChange={(e) => update(row.id, 'label', e.target.value)}
            placeholder={placeholder}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={row.amount}
            onChange={(e) => update(row.id, 'amount', e.target.value)}
            placeholder={showEarned ? 'Actual' : 'Amount'}
            className={`${inputClass} w-32`}
          />
          {showEarned && (
            <span className="w-28 shrink-0 text-right text-xs text-muted-foreground" title="Earned after LOP">
              Earned {formatCurrency(earnedAmount(row.amount))}
            </span>
          )}
          <button
            type="button"
            onClick={() => remove(row.id)}
            title="Remove"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-[#b91c1c]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="manual-payslip"
      title="Manual Payslip Generator"
      subtitle="Select an employee, enter earnings and deductions, then generate and download the payslip."
    >
      <div className="flex flex-col gap-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading employees...</p>
        ) : loadError ? (
          <p className="text-sm text-[#b91c1c]">{loadError}</p>
        ) : (
          <>
            <section className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Employee ID
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className={`${inputClass} min-w-64`}
                  >
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.employeeId} - {fullName(employee)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Month
                  <select value={month} onChange={(e) => handleMonthYearChange(Number(e.target.value), year)} className={inputClass}>
                    {MONTH_NAMES.map((name, index) => (
                      <option key={name} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Year
                  <select value={year} onChange={(e) => handleMonthYearChange(month, Number(e.target.value))} className={inputClass}>
                    {yearOptions.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Working Days
                  <input type="number" min="1" value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} className={`${inputClass} w-28`} />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  LOP Days
                  <input type="number" min="0" step="0.5" value={lopDays} onChange={(e) => setLopDays(e.target.value)} className={`${inputClass} w-28`} />
                </label>
              </div>

              {selectedEmployee && (
                <p className="text-sm text-muted-foreground">
                  {fullName(selectedEmployee)} &middot; {selectedEmployee.designation || 'N/A'} &middot; {selectedEmployee.department || 'N/A'}
                  {' '}&middot; Amounts below are pre-filled from the employee's CTC and Payslip Settings - edit them as needed.
                </p>
              )}
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Earnings</h3>
                  <button
                    type="button"
                    onClick={() => setEarnings((rows) => [...rows, newRow()])}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Plus className="size-3.5" /> Add Earning
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the full-month (actual) amounts. Earned is calculated for LOP:
                  actual &times; ({workingNumber > 0 ? workingNumber : 0} &minus; {lopNumber}) &divide; {workingNumber > 0 ? workingNumber : 0} working days.
                </p>
                {renderRows(earnings, updateEarning, removeRow(setEarnings), 'e.g. Basic Pay, Bonus', true)}
                <div className="flex flex-col gap-1 border-t border-border/80 pt-3 text-sm text-foreground">
                  <div className="flex justify-between">
                    <span>Total Actual</span>
                    <span>{formatCurrency(totalActualEarnings)}</span>
                  </div>
                  {lopNumber > 0 && (
                    <div className="flex justify-between text-[#b91c1c]">
                      <span>LOP ({lopNumber} day{lopNumber === 1 ? '' : 's'})</span>
                      <span>&minus; {formatCurrency(totalActualEarnings - totalEarnedEarnings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total Earned</span>
                    <span>{formatCurrency(totalEarnedEarnings)}</span>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Deductions</h3>
                  <button
                    type="button"
                    onClick={() => setDeductions((rows) => [...rows, newRow()])}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Plus className="size-3.5" /> Add Deduction
                  </button>
                </div>
                {renderRows(deductions, updateDeduction, removeRow(setDeductions), 'e.g. PF Deductions, TDS')}
                <div className="flex justify-between border-t border-border/80 pt-3 text-sm font-semibold text-foreground">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(totalDeductions)}</span>
                </div>
              </section>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="text-sm text-foreground">
                Net Pay: <strong>{formatCurrency(totalEarnedEarnings - totalDeductions)}</strong>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="ml-auto h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90"
              >
                Generate Payslip
              </button>
            </div>

            {formError && <p className="text-sm text-[#b91c1c]">{formError}</p>}

            {payslip && (
              <>
                <PayslipDocument ref={payslipRef} settings={settings} logoUrl={logoUrl} payslip={payslip} />
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
                >
                  <Download className="size-4" />
                  {downloading ? 'Preparing PDF...' : 'Download Payslip PDF'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default ManualPayslipPage;
