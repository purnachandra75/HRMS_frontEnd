import React, { useEffect, useMemo, useState, useRef } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import { getEmployeeProfile } from '../services/employeeService';
import { getEmployeeLeaveRequests } from '../services/leaveService';
import { getMyPayrollRecord, getManualPayslipUrl } from '../services/payrollService';
import { getPayslipSettings, fetchPayslipLogoObjectUrl } from '../services/payslipSettingsService';
import { apiFetch } from '../utils/apiClient';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// The printable payslip document below (.payslip-sheet and friends) is captured to PDF via
// html2canvas, so it deliberately keeps its exact print-style markup/CSS rather than being
// re-skinned in Tailwind - only the surrounding controls/page chrome are modernized.
import '../styles/Dashboard.css';
import '../styles/tailwind.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Used until the client's own payslip settings finish loading (or if a client hasn't
// configured any yet) - keeps the page rendering sane rather than showing blank fields.
const DEFAULT_PAYSLIP_SETTINGS = {
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

function toLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

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

function countWeekdaysInMonth(year, monthIndex) {
  const current = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  let count = 0;

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function countLeaveDaysInMonth(fromDate, toDate, year, monthIndex) {
  const start = toLocalDate(fromDate);
  const end = toLocalDate(toDate);
  if (!start || !end) return 0;

  const rangeStart = new Date(year, monthIndex, 1);
  const rangeEnd = new Date(year, monthIndex + 1, 0);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const overlapStart = start > rangeStart ? new Date(start) : new Date(rangeStart);
  const overlapEnd = end < rangeEnd ? new Date(end) : new Date(rangeEnd);
  if (overlapStart > overlapEnd) return 0;

  let leaveDays = 0;
  const current = new Date(overlapStart);
  while (current <= overlapEnd) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      leaveDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return leaveDays;
}

// CTC split driven by the client's configured payslip settings (see PayslipSettingsPage) -
// basic/hra/special percentages always sum to 100 (validated server-side), so the components
// always sum exactly to the same monthly gross the payroll report shows.
function buildSalaryComponents(employee, workingDays, payableDays, settings) {
  const basicPercent = Number(settings.basicPercent) / 100;
  const hraPercent = Number(settings.hraPercent) / 100;
  const specialPercent = Number(settings.specialAllowancePercent) / 100;
  const ctc = Number(employee.ctc) || 0;
  const basicSalary = Number(employee.basicSalary) || 0;
  const monthlyGross = ctc > 0 ? ctc / 12 : basicSalary / basicPercent;
  const basicActual = monthlyGross * basicPercent;
  const hraActual = monthlyGross * hraPercent;
  const specialActual = monthlyGross * specialPercent;
  const earnedRatio = workingDays > 0 ? payableDays / workingDays : 0;
  const earned = (value) => value * earnedRatio;

  const customEarnings = (settings.customEarnings || []).map((item) => {
    const actual = String(item.valueType).toUpperCase() === 'PERCENT'
      ? monthlyGross * (Number(item.value) / 100)
      : Number(item.value) || 0;
    return { label: item.label, actual, earned: earned(actual) };
  });

  const components = [
    { label: 'Basic Pay', actual: basicActual, earned: earned(basicActual) },
    { label: 'House Rent Allowance', actual: hraActual, earned: earned(hraActual) },
    { label: 'Special Allowance', actual: specialActual, earned: earned(specialActual) },
    ...customEarnings,
  ];
  // Basic/HRA/Special always sum to monthlyGross, but custom earnings are additive on top of
  // that split - so the displayed Actuals total must be the sum of every row, not monthlyGross
  // itself, or custom earnings would show in their own row yet never move the total.
  const totalActual = components.reduce((sum, component) => sum + component.actual, 0);

  return {
    monthlyGross,
    totalActual,
    components,
  };
}

function buildDeductions(employee, earnedBasicSalary, settings) {
  const professionalTax = Number(settings.professionalTax) || 0;
  const pfPercent = Number(settings.pfPercent) / 100;
  const pfDeduction = String(employee.pfApplicable).toLowerCase() === 'yes' ? earnedBasicSalary * pfPercent : 0;
  const insurance = String(employee.esiApplicable).toLowerCase() === 'yes' ? Number(settings.esiAmount) || 0 : 0;
  const otherDeductions = 0;

  const customDeductions = (settings.customDeductions || []).map((item) => {
    const amount = String(item.valueType).toUpperCase() === 'PERCENT'
      ? earnedBasicSalary * (Number(item.value) / 100)
      : Number(item.value) || 0;
    return { label: item.label, amount };
  });

  return [
    { label: 'Professional Tax', amount: professionalTax },
    { label: 'PF Deductions', amount: pfDeduction },
    { label: 'Insurance', amount: insurance },
    { label: 'Other Deductions', amount: otherDeductions },
    ...customDeductions,
  ];
}

const buildEmployeeName = (employee) =>
  `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || employee?.name || 'N/A';

const getPayrollCreditStatus = (record) =>
  record.creditStatus ?? record.paymentStatus ?? record.payrollStatus ?? record.employee?.creditStatus ?? record.status ?? '';

const isAmountCredited = (status) => {
  const value = String(status || '').trim().toLowerCase();
  return ['amount credited', 'credited', 'amount_credited', 'paid', 'payment credited'].includes(value);
};

const getPayrollManualFlag = (record) => Boolean(record.manualPayslip);
const getPayrollHasFile = (record) => Boolean(record.hasPayslipFile);

function PayslipGeneratorPage({ userId, userName, onLogout }) {
  const [employee, setEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [checkingPayroll, setCheckingPayroll] = useState(false);
  const [canGeneratePayslip, setCanGeneratePayslip] = useState(false);
  const [payrollMessage, setPayrollMessage] = useState('');
  const [manualPayslipPayrollId, setManualPayslipPayrollId] = useState(null);
  const [downloadingManualPayslip, setDownloadingManualPayslip] = useState(false);
  const [payrollRecord, setPayrollRecord] = useState(null);
  const [payslipSettings, setPayslipSettings] = useState(DEFAULT_PAYSLIP_SETTINGS);
  const [logoUrl, setLogoUrl] = useState(null);
  const payslipRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const loadData = async () => {
      setLoading(true);
      try {
        const [employeeData, leaveData, settingsData] = await Promise.all([
          getEmployeeProfile(userId),
          getEmployeeLeaveRequests(userId),
          getPayslipSettings().catch((err) => {
            console.error('Failed to load payslip settings:', err);
            return DEFAULT_PAYSLIP_SETTINGS;
          }),
        ]);

        if (cancelled) return;
        setEmployee(employeeData);
        setLeaveRequests(leaveData);
        setPayslipSettings(settingsData);
        if (settingsData?.hasLogo) {
          objectUrl = await fetchPayslipLogoObjectUrl();
          if (!cancelled) setLogoUrl(objectUrl);
        }
        setError('');
      } catch (err) {
        console.error('Failed to load payslip generator data:', err);
        if (!cancelled) setError('Unable to load payslip data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [userId]);

  useEffect(() => {
    setCanGeneratePayslip(false);
    setPayrollMessage('');
    setManualPayslipPayrollId(null);
    setPayrollRecord(null);
  }, [selectedMonth, selectedYear]);

  const handleGeneratePayslip = async () => {
    if (!employee) return;

    setCheckingPayroll(true);
    setCanGeneratePayslip(false);
    setManualPayslipPayrollId(null);
    setPayrollRecord(null);
    setPayrollMessage('');
    setError('');

    try {
      const employeePayroll = await getMyPayrollRecord({ month: selectedMonth, year: selectedYear });

      if (employeePayroll && isAmountCredited(getPayrollCreditStatus(employeePayroll))) {
        if (getPayrollManualFlag(employeePayroll)) {
          if (getPayrollHasFile(employeePayroll)) {
            setManualPayslipPayrollId(employeePayroll.payrollId);
            setPayrollMessage('Payroll amount credited. Payslip is ready to download.');
          } else {
            setPayrollMessage('Payslip will be available once uploaded by admin.');
          }
          return;
        }

        setPayrollRecord(employeePayroll);
        setCanGeneratePayslip(true);
        setPayrollMessage('Payroll amount credited. Payslip is ready to download.');
        return;
      }

      setPayrollMessage('Amount was not credited.');
    } catch (err) {
      console.error('Failed to verify payroll status:', err);
      setPayrollMessage('');
      setError(err.message || 'Unable to verify payroll status.');
    } finally {
      setCheckingPayroll(false);
    }
  };

  const handleDownloadManualPayslip = async () => {
    if (!manualPayslipPayrollId) return;
    setDownloadingManualPayslip(true);
    try {
      const response = await apiFetch(getManualPayslipUrl(manualPayslipPayrollId));
      if (!response.ok) throw new Error('Failed to download payslip');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Payslip.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Failed to download payslip:', err);
      setError(err.message || 'Failed to download payslip');
    } finally {
      setDownloadingManualPayslip(false);
    }
  };

  const payslip = useMemo(() => {
    if (!employee || !canGeneratePayslip) return null;

    const monthIndex = selectedMonth - 1;
    const workingDays = countWeekdaysInMonth(selectedYear, monthIndex);

    // LOP is anchored to what was actually processed for this month (frozen on the payroll
    // record at run time) rather than recalculated live - live leave requests could have
    // changed since then. Net Pay itself is always derived from the earnings/deductions
    // breakdown below (a live formula-based estimate, since component-level figures aren't
    // persisted on the record), so it stays consistent with what the table displays.
    const liveApprovedLeaveDays = leaveRequests
      .filter((request) => {
        const employeeId = request.employeeId ?? request.empId;
        return String(employeeId) === String(employee.id) && (request.status || '').toLowerCase() === 'approved';
      })
      .reduce(
        (total, request) => total + countLeaveDaysInMonth(request.fromDate, request.toDate, selectedYear, monthIndex),
        0
      );
    const lop = payrollRecord?.lop ?? liveApprovedLeaveDays;
    const variablePay = Number(payrollRecord?.variablePay) || 0;

    const payableDays = Math.max(workingDays - lop, 0);
    const salaryData = buildSalaryComponents(employee, workingDays, payableDays, payslipSettings);
    const totalEarned = salaryData.components.reduce((sum, item) => sum + item.earned, 0);
    const earnedBasicSalary = salaryData.components[0]?.earned || 0;
    const deductions = buildDeductions(employee, earnedBasicSalary, payslipSettings);
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    // Net Pay must match what the table above it shows: (Total Earned + Variable Pay) minus
    // Total Deductions - not payrollRecord.netSalary, which is the processed payroll amount
    // (gross minus LOP plus variable pay) and never had PF/PT/ESI subtracted from it.
    const netPay = totalEarned + variablePay - totalDeductions;

    return {
      employee,
      monthLabel: MONTH_NAMES[monthIndex],
      year: selectedYear,
      workingDays,
      payableDays,
      lop,
      variablePay,
      salaryData,
      deductions,
      totalEarned,
      totalDeductions,
      netPay,
      grade: employee.employeeCategory || 'B1',
      location: employee.workLocation || 'Hyderabad',
      designation: employee.designation || 'N/A',
      department: employee.department || 'N/A',
      panNumber: employee.panNumber || 'N/A',
      gender: employee.gender || 'N/A',
      doj: employee.dateOfJoining || 'N/A',
      pfNumber: employee.pfNumber || 'N/A',
      uanNumber: employee.uanNumber || 'N/A',
      bankName: employee.bankName || 'N/A',
      bankAccount: employee.accountNumber || 'N/A',
    };
  }, [canGeneratePayslip, employee, leaveRequests, payrollRecord, payslipSettings, selectedMonth, selectedYear]);

  const yearOptions = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 5 + index);

  const handleDownloadPdf = async () => {
    if (!payslipRef.current) return;

    const input = payslipRef.current;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const pdfWidth = 210;

    const pageHeight = 297;

    const imgWidth = pdfWidth;

    const imgHeight =
      canvas.height * pdfWidth / canvas.width;

    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(
      imgData,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );

    heightLeft -= pageHeight;

    while (heightLeft > 0) {

      position = heightLeft - imgHeight;

      pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pageHeight;
    }

    pdf.save("Payslip.pdf");

  };

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="payslip"
      title="Payslip"
      subtitle="Generate your payslip after payroll amount is credited for the selected month."
    >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Employee ID</label>
                <div className="flex h-9 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground">
                  {employee?.id || userId || 'N/A'}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Employee Name</label>
                <div className="flex h-9 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground">
                  {employee ? buildEmployeeName(employee) : userName || 'N/A'}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="payMonth" className="text-sm font-medium text-foreground">Month</label>
                <select
                  id="payMonth"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="payYear" className="text-sm font-medium text-foreground">Year</label>
                <select
                  id="payYear"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleGeneratePayslip}
                disabled={loading || checkingPayroll || !employee}
                className="h-9 rounded-lg bg-employee px-4 text-sm font-medium text-employee-foreground hover:bg-employee/90 disabled:opacity-60"
              >
                {checkingPayroll ? 'Checking...' : 'Generate Payslip'}
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading payslip data...</p>
            ) : error ? (
              <p className="text-sm text-[#b91c1c]">{error}</p>
            ) : !employee ? (
              <p className="text-sm text-muted-foreground">No employee available for payslip generation.</p>
            ) : payrollMessage && !canGeneratePayslip && !manualPayslipPayrollId ? (
              <p className="text-sm text-[#b91c1c]">{payrollMessage}</p>
            ) : payrollMessage && (canGeneratePayslip || manualPayslipPayrollId) ? (
              <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm text-[#15803d]">{payrollMessage}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Select month and year, then click Generate Payslip.</p>
            )}

            {manualPayslipPayrollId && (
              <button
                type="button"
                onClick={handleDownloadManualPayslip}
                disabled={downloadingManualPayslip}
                className="h-9 w-fit rounded-lg bg-employee px-4 text-sm font-medium text-employee-foreground hover:bg-employee/90 disabled:opacity-60"
              >
                {downloadingManualPayslip ? 'Downloading...' : 'Download Payslip'}
              </button>
            )}

            {payslip && (
              <>
                <div className="payslip-preview">
                  <div className="payslip-sheet" ref={payslipRef}>
                    <div className="payslip-border">
                    <div className="payslip-top-grid">
                      <div className="payslip-logo-box">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Company logo" className="payslip-logo-image" />
                        ) : (
                          <div className="payslip-logo-text">
                            <div className="payslip-logo-main">{payslipSettings.companyName || 'COMPANY'}</div>
                          </div>
                        )}
                      </div>
                      <div className="payslip-company-box">
                        <div className="payslip-bluebar payslip-company-title">{payslipSettings.companyName}</div>
                        <div className="payslip-company-content">
                          <p>{payslipSettings.addressLine1}</p>
                          <p>{payslipSettings.addressLine2}</p>
                          <p>{payslipSettings.addressLine3}</p>
                          <p>{payslipSettings.phone}</p>
                          <p className="payslip-link">{payslipSettings.website}</p>
                          <p className="payslip-link">{payslipSettings.email}</p>
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
                          <td className="value">{payslip.employee.firstName} {payslip.employee.lastName}</td>
                          <td className="label">Emp.Code</td>
                          <td className="value">{payslip.employee.id}</td>
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
                          length: Math.max(payslip.salaryData.components.length, payslip.deductions.length),
                        }).map((_, index) => {
                          const earning = payslip.salaryData.components[index];
                          const deduction = payslip.deductions[index];
                          return (
                            <tr key={earning?.label || deduction?.label || index}>
                              <td>{earning?.label || ''}</td>
                              <td className="amount">{earning ? formatCurrency(earning.actual) : ''}</td>
                              <td className="amount">{earning ? formatCurrency(earning.earned) : ''}</td>
                              <td>{deduction?.label || ''}</td>
                              <td className="amount">{deduction ? formatDisplayAmount(deduction.amount) : ''}</td>
                            </tr>
                          );
                        })}
                        {payslip.variablePay > 0 && (
                          <tr>
                            <td>Variable Pay</td>
                            <td className="amount">{formatCurrency(payslip.variablePay)}</td>
                            <td className="amount">{formatCurrency(payslip.variablePay)}</td>
                            <td></td>
                            <td className="amount"></td>
                          </tr>
                        )}
                        <tr className="total-row">
                          <td>Total(INR)</td>
                          <td className="amount">{formatCurrency(payslip.salaryData.totalActual)}</td>
                          <td className="amount">{formatCurrency(payslip.totalEarned + payslip.variablePay)}</td>
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

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="h-9 w-fit rounded-lg bg-employee px-4 text-sm font-medium text-employee-foreground hover:bg-employee/90"
                >
                  Download Payslip PDF
                </button>
              </>
            )}
          </div>
    </EmployeeLayout>
  );
}

export default PayslipGeneratorPage;
