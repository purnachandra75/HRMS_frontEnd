import React, { useEffect, useMemo, useState, useRef } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import { getEmployeeProfile } from '../services/employeeService';
import { getEmployeeLeaveRequests } from '../services/leaveService';
import { getPayrollReport, getManualPayslipUrl } from '../services/payrollService';
import { apiFetch } from '../utils/apiClient';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import '../styles/Dashboard.css';
import '../styles/Leave.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COMPANY_DETAILS = {
  name: 'PROMINENT SCIENTIFIC PVT LTD.',
  line1: '4th floor, Jayabheri Enclave, JQ-Chambers',
  line2: 'Dr No. 4-50/5, Plot No. 5, Gachibowli,',
  line3: 'Serilingampalle, Hyderabad - 500032',
  phone: 'Tel: 7801083072',
  website: 'www.prominentscientific.co.in',
  email: 'info@prominentscientific.co.in',
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

function buildSalaryComponents(employee, workingDays, payableDays) {
  const basicActual = Number(employee.basicSalary) || 0;
  const monthlyGross = Number(employee.ctc) > 0 ? Number(employee.ctc) / 12 : basicActual * 2.3;
  const hraActual = basicActual * 0.4;
  const conveyanceActual = Math.min(monthlyGross * 0.025, 1600);
  const medicalActual = Math.min(monthlyGross * 0.0375, 1250);
  const ccaActual = Math.min(monthlyGross * 0.03, 1003);
  const knownTotal = basicActual + hraActual + conveyanceActual + medicalActual + ccaActual;
  const specialActual = Math.max(monthlyGross - knownTotal, 0);
  const earnedRatio = workingDays > 0 ? payableDays / workingDays : 0;
  const earned = (value) => value * earnedRatio;

  return {
    monthlyGross,
    components: [
      { label: 'Basic Pay', actual: basicActual, earned: earned(basicActual) },
      { label: 'House Rent Allowance', actual: hraActual, earned: earned(hraActual) },
      { label: 'Conveyance Allowance', actual: conveyanceActual, earned: earned(conveyanceActual) },
      { label: 'Medical Allowance', actual: medicalActual, earned: earned(medicalActual) },
      { label: 'Special Allowance', actual: specialActual, earned: earned(specialActual) },
      { label: 'CCA', actual: ccaActual, earned: earned(ccaActual) },
    ],
  };
}

function buildDeductions(employee, earnedBasicSalary) {
  const professionalTax = 200;
  const pfDeduction = String(employee.pfApplicable).toLowerCase() === 'yes' ? earnedBasicSalary * 0.12 : 0;
  const insurance = String(employee.esiApplicable).toLowerCase() === 'yes' ? 600 : 0;
  const gratuity = earnedBasicSalary * 0.0481;
  const otherDeductions = 0;

  return [
    { label: 'Professional Tax', amount: professionalTax },
    { label: 'PF Deductions', amount: pfDeduction },
    { label: 'Insurance', amount: insurance },
    { label: 'Gratuity', amount: gratuity },
    { label: 'Other Deductions', amount: otherDeductions },
  ];
}

const pickPayrollRecords = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.payrolls)) return response.payrolls;
  if (Array.isArray(response?.employees)) return response.employees;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data)) return response.data;
  if (response && typeof response === 'object') return [response];
  return [];
};

const buildEmployeeName = (employee) =>
  `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || employee?.name || 'N/A';

const getPayrollEmployeeId = (record) =>
  record.employeeId ?? record.empId ?? record.employee?.id ?? record.employee?.empId ?? record.id;

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
  const payslipRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [employeeData, leaveData] = await Promise.all([
          getEmployeeProfile(userId),
          getEmployeeLeaveRequests(userId),
        ]);

        setEmployee(employeeData);
        setLeaveRequests(leaveData);
        setError('');
      } catch (err) {
        console.error('Failed to load payslip generator data:', err);
        setError('Unable to load payslip data.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  useEffect(() => {
    setCanGeneratePayslip(false);
    setPayrollMessage('');
    setManualPayslipPayrollId(null);
  }, [selectedMonth, selectedYear]);

  const handleGeneratePayslip = async () => {
    if (!employee) return;

    const employeeName = buildEmployeeName(employee);
    setCheckingPayroll(true);
    setCanGeneratePayslip(false);
    setManualPayslipPayrollId(null);
    setPayrollMessage('');
    setError('');

    try {
      const response = await getPayrollReport({
        employeeId: employee.id,
        employeeName,
        month: selectedMonth,
        year: selectedYear,
      });
      const payrollRecords = pickPayrollRecords(response);
      const employeePayroll = payrollRecords.find((record) => {
        const recordEmployeeId = getPayrollEmployeeId(record);
        return String(recordEmployeeId) === String(employee.id);
      });

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
    const approvedLeaveDays = leaveRequests
      .filter((request) => {
        const employeeId = request.employeeId ?? request.empId;
        return String(employeeId) === String(employee.id) && (request.status || '').toLowerCase() === 'approved';
      })
      .reduce(
        (total, request) => total + countLeaveDaysInMonth(request.fromDate, request.toDate, selectedYear, monthIndex),
        0
      );

    const payableDays = Math.max(workingDays - approvedLeaveDays, 0);
    const salaryData = buildSalaryComponents(employee, workingDays, payableDays);
    const totalEarned = salaryData.components.reduce((sum, item) => sum + item.earned, 0);
    const earnedBasicSalary = salaryData.components[0]?.earned || 0;
    const deductions = buildDeductions(employee, earnedBasicSalary);
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    const netPay = totalEarned - totalDeductions;

    return {
      employee,
      monthLabel: MONTH_NAMES[monthIndex],
      year: selectedYear,
      workingDays,
      payableDays,
      lop: approvedLeaveDays,
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
  }, [canGeneratePayslip, employee, leaveRequests, selectedMonth, selectedYear]);

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
          <div className="pf-generator-panel">
            <div className="pf-controls">
              <div className="pf-field">
                <label>Employee ID</label>
                <div className="pf-readonly-value">{employee?.id || userId || 'N/A'}</div>
              </div>

              <div className="pf-field">
                <label>Employee Name</label>
                <div className="pf-readonly-value">{employee ? buildEmployeeName(employee) : userName || 'N/A'}</div>
              </div>

              <div className="pf-field">
                <label htmlFor="payMonth">Month</label>
                <select id="payMonth" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              <div className="pf-field">
                <label htmlFor="payYear">Year</label>
                <select id="payYear" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="pf-actions pf-inline-action">
                <button
                  type="button"
                  className="create-btn"
                  onClick={handleGeneratePayslip}
                  disabled={loading || checkingPayroll || !employee}
                >
                  {checkingPayroll ? 'Checking...' : 'Generate Payslip'}
                </button>
              </div>
            </div>

            {loading ? (
              <p className="pf-empty">Loading payslip data...</p>
            ) : error ? (
              <p className="pf-empty pf-error">{error}</p>
            ) : !employee ? (
              <p className="pf-empty">No employee available for payslip generation.</p>
            ) : payrollMessage && !canGeneratePayslip && !manualPayslipPayrollId ? (
              <p className="pf-empty pf-error">{payrollMessage}</p>
            ) : payrollMessage && (canGeneratePayslip || manualPayslipPayrollId) ? (
              <div className="payroll-run-result">
                <p className="payroll-run-title">{payrollMessage}</p>
              </div>
            ) : (
              <p className="pf-empty">Select month and year, then click Generate Payslip.</p>
            )}

            {manualPayslipPayrollId && (
              <div className="pf-actions pf-inline-action">
                <button
                  type="button"
                  className="create-btn"
                  onClick={handleDownloadManualPayslip}
                  disabled={downloadingManualPayslip}
                >
                  {downloadingManualPayslip ? 'Downloading...' : 'Download Payslip'}
                </button>
              </div>
            )}

            {payslip && (
              <>
                <div className="payslip-preview">
                  <div className="payslip-sheet" ref={payslipRef}>
                    <div className="payslip-border">
                    <div className="payslip-top-grid">
                      <div className="payslip-logo-box">
                        <div className="payslip-logo-text">
                          <div className="payslip-logo-main">PROMINENT</div>
                          <div className="payslip-logo-sub">SCIENTIFIC</div>
                        </div>
                      </div>
                      <div className="payslip-company-box">
                        <div className="payslip-bluebar payslip-company-title">{COMPANY_DETAILS.name}</div>
                        <div className="payslip-company-content">
                          <p>{COMPANY_DETAILS.line1}</p>
                          <p>{COMPANY_DETAILS.line2}</p>
                          <p>{COMPANY_DETAILS.line3}</p>
                          <p>{COMPANY_DETAILS.phone}</p>
                          <p className="payslip-link">{COMPANY_DETAILS.website}</p>
                          <p className="payslip-link">{COMPANY_DETAILS.email}</p>
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
                        {payslip.salaryData.components.map((item, index) => (
                          <tr key={item.label}>
                            <td>{item.label}</td>
                            <td className="amount">{formatCurrency(item.actual)}</td>
                            <td className="amount">{formatCurrency(item.earned)}</td>
                            <td>{payslip.deductions[index]?.label || ''}</td>
                            <td className="amount">
                              {payslip.deductions[index] ? formatDisplayAmount(payslip.deductions[index].amount) : ''}
                            </td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td>Total(INR)</td>
                          <td className="amount">{formatCurrency(payslip.salaryData.monthlyGross)}</td>
                          <td className="amount">{formatCurrency(payslip.totalEarned)}</td>
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

                <div className="pf-actions">
                  <button type="button" className="create-btn" onClick={handleDownloadPdf}>
                    Download Payslip PDF
                  </button>
                </div>
              </>
            )}
          </div>
    </EmployeeLayout>
  );
}

export default PayslipGeneratorPage;
