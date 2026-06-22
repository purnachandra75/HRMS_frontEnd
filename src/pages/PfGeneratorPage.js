import React, { useEffect, useMemo, useState, useRef } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import { getEmployeeProfile } from '../services/employeeService';
import { getEmployeeLeaveRequests } from '../services/leaveService';
import { getPayrollReport } from '../services/payrollService';
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

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildPayslipPdf(payslip) {
  const width = 595;
  const height = 842;
  const left = 36;
  const sheetWidth = 523;
  const topY = 690;
  const logoWidth = 230;
  const companyWidth = sheetWidth - logoWidth;
  const blue = '0.078 0.435 0.714';

  const commands = [];
  const text = (x, y, size, value, font = 'F1', align = 'left', color = '0 0 0') => {
    const safe = escapePdfText(value);
    if (align === 'center') {
      commands.push('BT');
      commands.push(`/${font} ${size} Tf`);
      commands.push(`${color} rg`);
      commands.push(`1 0 0 1 ${x} ${y} Tm`);
      commands.push(`(${safe}) Tj`);
      commands.push('ET');
      return;
    }
    commands.push('BT');
    commands.push(`/${font} ${size} Tf`);
    commands.push(`${color} rg`);
    commands.push(`1 0 0 1 ${x} ${y} Tm`);
    commands.push(`(${safe}) Tj`);
    commands.push('ET');
  };
  const line = (x1, y1, x2, y2, w = 1) => {
    commands.push(`${w} w`);
    commands.push(`${x1} ${y1} m`);
    commands.push(`${x2} ${y2} l`);
    commands.push('S');
  };
  const rect = (x, y, w, h, fill = false, stroke = true, color = '0 0 0') => {
    commands.push(`${color} rg`);
    commands.push(`${color} RG`);
    commands.push(`${x} ${y} ${w} ${h} re`);
    commands.push(fill && stroke ? 'B' : fill ? 'f' : 'S');
  };

  const sectionBar = (y, label, size = 14) => {
    rect(left, y, sheetWidth, 22, true, true, blue);
    text(left + sheetWidth / 2 - 120, y + 5, size, label, 'F2', 'center', '1 1 1');
  };

  const detailsRows = [
    ['Name', `${payslip.employee.firstName} ${payslip.employee.lastName}`, 'Emp.Code', payslip.employee.id],
    ['Designation', payslip.designation, 'Location', payslip.location],
    ['Department', payslip.department, 'Grade', payslip.grade],
    ['PAN', payslip.panNumber, 'Payable Days', payslip.payableDays],
    ['Gender', payslip.gender, 'Working Days', payslip.workingDays],
    ['D.O.J', payslip.doj, 'LOP', payslip.lop],
    ['PF No', payslip.pfNumber, 'UAN No', payslip.uanNumber],
    ['Bank Name', payslip.bankName, 'Bank A/C', payslip.bankAccount],
  ];

  rect(left, 110, sheetWidth, 620, false, true);
  rect(left, topY, logoWidth, 150, false, true);
  rect(left + logoWidth, topY, companyWidth, 150, false, true);

  text(left + 65, topY + 90, 28, 'PROMINENT', 'F2');
  text(left + 87, topY + 64, 14, 'SCIENTIFIC', 'F2', 'left', '0.694 0.294 0.408');

  rect(left + logoWidth, topY + 124, companyWidth, 26, true, true, blue);
  text(left + logoWidth + 70, topY + 132, 11, COMPANY_DETAILS.name, 'F2', 'left', '1 1 1');
  text(left + logoWidth + 56, topY + 106, 10, COMPANY_DETAILS.line1, 'F2');
  text(left + logoWidth + 40, topY + 84, 10, COMPANY_DETAILS.line2, 'F2');
  text(left + logoWidth + 56, topY + 62, 10, COMPANY_DETAILS.line3, 'F2');
  text(left + logoWidth + 95, topY + 40, 10, COMPANY_DETAILS.phone, 'F2');
  text(left + logoWidth + 50, topY + 18, 10, COMPANY_DETAILS.website, 'F2', 'left', blue);
  text(left + logoWidth + 52, topY - 2, 10, COMPANY_DETAILS.email, 'F2', 'left', blue);

  sectionBar(topY - 26, `Pay Slip for the Month of ${payslip.monthLabel} ${payslip.year}`);

  const rowHeight = 28;
  const detailTop = topY - 54;
  const colWidths = [66, 162, 66, 229];
  let x = left;
  colWidths.forEach((w) => {
    line(x, detailTop - detailsRows.length * rowHeight, x, detailTop);
    x += w;
  });
  line(left + sheetWidth, detailTop - detailsRows.length * rowHeight, left + sheetWidth, detailTop);
  for (let i = 0; i <= detailsRows.length; i += 1) {
    const y = detailTop - i * rowHeight;
    line(left, y, left + sheetWidth, y);
  }

  detailsRows.forEach((row, index) => {
    const y = detailTop - (index + 0.7) * rowHeight;
    text(left + 8, y, 9, row[0], 'F2');
    text(left + 78, y, 9, row[1]);
    text(left + 236, y, 9, row[2], 'F2');
    text(left + 307, y, 9, row[3]);
  });

  const salaryTop = detailTop - detailsRows.length * rowHeight - 24;
  const salaryHeaderHeight = 26;
  const salaryRowHeight = 28;
  const salaryCols = [175, 120, 120, 165, 83];
  let sx = left;
  salaryCols.forEach((w, index) => {
    rect(sx, salaryTop - salaryHeaderHeight, w, salaryHeaderHeight, true, true, blue);
    sx += w;
  });
  const headers = ['Earnings', 'Actuals', 'Earned', 'Deductions', 'Amount'];
  sx = left;
  headers.forEach((header, index) => {
    text(sx + 8, salaryTop - 18, 10, header, 'F2', 'left', '1 1 1');
    sx += salaryCols[index];
  });

  const maxRows = Math.max(payslip.salaryData.components.length, payslip.deductions.length);
  const startY = salaryTop - salaryHeaderHeight;
  let currentY = startY;
  for (let i = 0; i < maxRows; i += 1) {
    currentY -= salaryRowHeight;
    line(left, currentY, left + sheetWidth, currentY);
  }
  let vx = left;
  salaryCols.forEach((w) => {
    line(vx, startY - maxRows * salaryRowHeight, vx, salaryTop);
    vx += w;
  });
  line(left + sheetWidth, startY - maxRows * salaryRowHeight, left + sheetWidth, salaryTop);

  for (let i = 0; i < maxRows; i += 1) {
    const earning = payslip.salaryData.components[i];
    const deduction = payslip.deductions[i];
    const y = startY - (i + 0.7) * salaryRowHeight;
    if (earning) {
      text(left + 8, y, 9, earning.label);
      text(left + salaryCols[0] + 65, y, 9, formatCurrency(earning.actual));
      text(left + salaryCols[0] + salaryCols[1] + 65, y, 9, formatCurrency(earning.earned));
    }
    if (deduction) {
      text(left + salaryCols[0] + salaryCols[1] + salaryCols[2] + 8, y, 9, deduction.label);
      text(left + salaryCols[0] + salaryCols[1] + salaryCols[2] + salaryCols[3] + 40, y, 9, formatDisplayAmount(deduction.amount));
    }
  }

  const totalsY = startY - maxRows * salaryRowHeight - 28;
  rect(left, totalsY, salaryCols[0], 28, true, true, '0.851 0.851 0.851');
  rect(left + salaryCols[0], totalsY, salaryCols[1], 28, true, true, '0.851 0.851 0.851');
  rect(left + salaryCols[0] + salaryCols[1], totalsY, salaryCols[2], 28, true, true, '0.851 0.851 0.851');
  rect(left + salaryCols[0] + salaryCols[1] + salaryCols[2], totalsY, salaryCols[3], 28, true, true, '0.851 0.851 0.851');
  rect(left + salaryCols[0] + salaryCols[1] + salaryCols[2] + salaryCols[3], totalsY, salaryCols[4], 28, true, true, '0.851 0.851 0.851');
  text(left + 8, totalsY + 9, 9, 'Total(INR)', 'F2');
  text(left + salaryCols[0] + 55, totalsY + 9, 9, formatCurrency(payslip.salaryData.monthlyGross));
  text(left + salaryCols[0] + salaryCols[1] + 55, totalsY + 9, 9, formatCurrency(payslip.totalEarned));
  text(left + salaryCols[0] + salaryCols[1] + salaryCols[2] + 8, totalsY + 9, 9, 'Total Deductions(INR)', 'F2');
  text(left + salaryCols[0] + salaryCols[1] + salaryCols[2] + salaryCols[3] + 35, totalsY + 9, 9, formatCurrency(payslip.totalDeductions));

  const netY = totalsY - 30;
  rect(left, netY, salaryCols[0] + salaryCols[1], 30, true, true, blue);
  rect(left + salaryCols[0] + salaryCols[1], netY, salaryCols[2] + salaryCols[3] + salaryCols[4], 30, true, true, blue);
  text(left + 8, netY + 9, 11, 'Net Pay(INR)', 'F2', 'left', '1 1 1');
  text(left + salaryCols[0] + salaryCols[1] + 160, netY + 9, 12, formatCurrency(payslip.netPay), 'F2', 'left', '1 1 1');

  const footerY = netY - 26;
  rect(left, footerY, sheetWidth, 26, false, true);
  text(left + 110, footerY + 8, 9, 'This is a system generated payslip and does not require authentication');

  const content = commands.join('\n');

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`);
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
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
  }, [selectedMonth, selectedYear]);

  const handleGeneratePayslip = async () => {
    if (!employee) return;

    const employeeName = buildEmployeeName(employee);
    setCheckingPayroll(true);
    setCanGeneratePayslip(false);
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
            ) : payrollMessage && !canGeneratePayslip ? (
              <p className="pf-empty pf-error">{payrollMessage}</p>
            ) : payrollMessage && canGeneratePayslip ? (
              <div className="payroll-run-result">
                <p className="payroll-run-title">{payrollMessage}</p>
              </div>
            ) : (
              <p className="pf-empty">Select month and year, then click Generate Payslip.</p>
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
