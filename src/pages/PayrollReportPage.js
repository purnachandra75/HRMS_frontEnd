import React, { useEffect, useMemo, useState } from 'react';
import { getPayrollReport, updatePayrollStatus, updatePayslipMode, uploadManualPayslip } from '../services/payrollService';
import AdminLayout from '../components/AdminLayout';
import '../styles/Dashboard.css';
import '../styles/Payroll.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const pickReportRecords = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.payrolls)) return response.payrolls;
  if (Array.isArray(response?.employees)) return response.employees;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const buildEmployeeName = (record) => {
  const fullName = record.employeeName || record.name || record.fullName;
  if (fullName) return fullName;

  return `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A';
};

const normalizeStatus = (status) => {
  const originalStatus = String(status || '').trim();
  const value = originalStatus.toLowerCase();
  if (['credited', 'amount credited', 'amount_credited', 'paid', 'payment credited'].includes(value)) {
    return 'Amount Credited';
  }
  if (value === 'processing' || value === 'in process') return 'Processing';
  return originalStatus || 'N/A';
};

const normalizePayrollRecord = (record, selectedMonth, selectedYear) => {
  const employeeId = record.employeeId || record.empId || record.id || record.employee?.id;
  const amount = record.amount
    ?? record.netPay
    ?? record.netSalary
    ?? record.monthlySalary
    ?? record.salary
    ?? record.grossSalary
    ?? 0;

  return {
    payrollId: record.payrollId || record.id || record.payrollProcessId || null,
    employeeId,
    employeeName: buildEmployeeName(record.employee || record),
    month: record.month || selectedMonth,
    year: record.year || selectedYear,
    department: record.department || record.employee?.department || 'N/A',
    designation: record.designation || record.employee?.designation || 'N/A',
    amount,
    status: normalizeStatus(record.creditStatus ?? record.paymentStatus ?? record.status),
    manualPayslip: Boolean(record.manualPayslip),
    hasPayslipFile: Boolean(record.hasPayslipFile),
  };
};

const getPayrollRowKey = (row) => `${row.payrollId || row.employeeId}-${row.month}-${row.year}`;

function PayrollReportPage({ userName, onLogout }) {
  const [reportRows, setReportRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportLoaded, setReportLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingKey, setUpdatingKey] = useState('');
  const [payslipUpdatingKey, setPayslipUpdatingKey] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setReportLoaded(false);
    setReportRows([]);
    setError('');
    setStatusMessage('');
  }, [selectedMonth, selectedYear]);

  const handleLoadReport = async () => {
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const response = await getPayrollReport({
        month: selectedMonth,
        year: selectedYear,
      });
      const records = pickReportRecords(response).map((record) =>
        normalizePayrollRecord(record, selectedMonth, selectedYear)
      );
      setReportRows(records);
      setReportLoaded(true);
    } catch (err) {
      console.error('Failed to load payroll report:', err);
      setReportRows([]);
      setReportLoaded(true);
      setError(err.message || 'Failed to load payroll report');
    } finally {
      setLoading(false);
    }
  };

  const handlePayrollStatusUpdate = async (row) => {
    const rowKey = getPayrollRowKey(row);
    const status = 'Amount Credited';
    const previousRows = reportRows;

    setUpdatingKey(rowKey);
    setError('');
    setStatusMessage('');

    try {
      await updatePayrollStatus({
        payrollId: row.payrollId,
        employeeId: row.employeeId,
        month: row.month,
        year: row.year,
        status,
      });
      setReportRows((currentRows) =>
        currentRows.map((currentRow) =>
          getPayrollRowKey(currentRow) === rowKey
            ? { ...currentRow, status }
            : currentRow
        )
      );
      setStatusMessage('Payroll status updated successfully.');
    } catch (err) {
      console.error('Failed to update payroll status:', err);
      setReportRows(previousRows);
      setError(err.message || 'Failed to update payroll status');
    } finally {
      setUpdatingKey('');
    }
  };

  const handlePayslipModeToggle = async (row) => {
    const rowKey = getPayrollRowKey(row);
    const manualPayslip = !row.manualPayslip;
    const previousRows = reportRows;

    setPayslipUpdatingKey(rowKey);
    setError('');
    setStatusMessage('');

    try {
      await updatePayslipMode({
        payrollId: row.payrollId,
        employeeId: row.employeeId,
        month: row.month,
        year: row.year,
        manualPayslip,
      });
      setReportRows((currentRows) =>
        currentRows.map((currentRow) =>
          getPayrollRowKey(currentRow) === rowKey
            ? { ...currentRow, manualPayslip }
            : currentRow
        )
      );
    } catch (err) {
      console.error('Failed to update payslip mode:', err);
      setReportRows(previousRows);
      setError(err.message || 'Failed to update payslip mode');
    } finally {
      setPayslipUpdatingKey('');
    }
  };

  const handlePayslipFileUpload = async (row, file) => {
    if (!file) return;
    const rowKey = getPayrollRowKey(row);

    setPayslipUpdatingKey(rowKey);
    setError('');
    setStatusMessage('');

    try {
      await uploadManualPayslip(row.payrollId, file);
      setReportRows((currentRows) =>
        currentRows.map((currentRow) =>
          getPayrollRowKey(currentRow) === rowKey
            ? { ...currentRow, manualPayslip: true, hasPayslipFile: true }
            : currentRow
        )
      );
      setStatusMessage('Payslip uploaded successfully.');
    } catch (err) {
      console.error('Failed to upload payslip:', err);
      setError(err.message || 'Failed to upload payslip');
    } finally {
      setPayslipUpdatingKey('');
    }
  };

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
  const selectedMonthName = monthOptions[selectedMonth - 1];

  const payrollReportRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reportRows.filter((row) => {
      if (!query) return true;
      return [
        row.employeeId,
        row.employeeName,
        row.department,
        row.designation,
        row.status,
      ].some((field) => field?.toString().toLowerCase().includes(query));
    });
  }, [reportRows, searchQuery]);

  const creditedCount = payrollReportRows.filter((row) => row.status === 'Amount Credited').length;
  const pendingCount = Math.max(payrollReportRows.length - creditedCount, 0);

  const renderPayrollReport = () => {
    if (!reportLoaded) {
      return <p className="payroll-empty">Select month and year, then click Report to load payroll records.</p>;
    }

    if (payrollReportRows.length === 0) {
      return <p className="payroll-empty">No payroll records found for this month and year.</p>;
    }

    return (
      <div className="table-responsive">
        <table className="employees-table payroll-table payroll-report-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Month</th>
              <th>Year</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
              <th>Payslip</th>
            </tr>
          </thead>
          <tbody>
            {payrollReportRows.map((row) => {
              const rowKey = getPayrollRowKey(row);
              const isUpdating = updatingKey === rowKey;
              const isCredited = row.status === 'Amount Credited';
              const isPayslipUpdating = payslipUpdatingKey === rowKey;

              return (
                <tr key={rowKey}>
                  <td>{row.employeeId || 'N/A'}</td>
                  <td>{row.employeeName}</td>
                  <td>{monthOptions[Number(row.month) - 1] || row.month}</td>
                  <td>{row.year}</td>
                  <td>{row.department}</td>
                  <td>{row.designation}</td>
                  <td>{formatCurrency(row.amount)}</td>
                  <td>
                    <span
                      className={`payroll-status-badge ${
                        isCredited
                          ? 'payroll-status-credited'
                          : 'payroll-status-pending'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="payroll-action-btn"
                      onClick={() => handlePayrollStatusUpdate(row)}
                      disabled={isUpdating || isCredited}
                    >
                      {isUpdating ? 'Updating...' : isCredited ? 'Credited' : 'Update'}
                    </button>
                  </td>
                  <td>
                    <label className="payroll-toggle">
                      <input
                        type="checkbox"
                        checked={row.manualPayslip}
                        disabled={isPayslipUpdating}
                        onChange={() => handlePayslipModeToggle(row)}
                      />
                      Manual Upload
                    </label>
                    {row.manualPayslip && (
                      <div className="payroll-payslip-upload">
                        <input
                          type="file"
                          disabled={isPayslipUpdating}
                          onChange={(e) => handlePayslipFileUpload(row, e.target.files[0])}
                        />
                        {row.hasPayslipFile && (
                          <span className="payroll-payslip-uploaded">Uploaded</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="payroll-report" title="Employee Payroll List" subtitle="Filter payroll records by month and year, then update the status after the amount is credited.">

          <section className="payroll-summary-grid">
            <div className="payroll-summary-card">
              <span>Records</span>
              <strong>{payrollReportRows.length}</strong>
            </div>
            <div className="payroll-summary-card">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>
            <div className="payroll-summary-card">
              <span>Amount Credited</span>
              <strong>{creditedCount}</strong>
            </div>
          </section>

          <section className="payroll-section">
            <div className="payroll-toolbar">
              <div className="header-left">
                <div className="search-bar payroll-search-bar">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by ID, name, email, department, or designation"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="payroll-toolbar-actions">
                <div className="payroll-period-controls">
                  <label>
                    Month
                    <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
                      {monthOptions.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Year
                    <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  className="create-btn payroll-run-btn"
                  onClick={handleLoadReport}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Report'}
                </button>
              </div>
            </div>

            {error && <p className="payroll-empty payroll-error">{error}</p>}
            {statusMessage && (
              <div className="payroll-run-result">
                <p className="payroll-run-title">{statusMessage}</p>
              </div>
            )}
            {loading ? (
              <p className="payroll-empty">Loading payroll report...</p>
            ) : (
              <div className="payroll-group">
                <div className="payroll-group-header">
                  <div>
                    <h3>Payroll Report</h3>
                    <p className="payroll-report-subtitle">
                      Showing employee payroll records for {selectedMonthName} {selectedYear}.
                    </p>
                  </div>
                  <span>{payrollReportRows.length} employees</span>
                </div>
                {renderPayrollReport()}
              </div>
            )}
              </section>
            </AdminLayout>
  );
}

export default PayrollReportPage;
