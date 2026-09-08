import React, { useEffect, useState } from 'react';
import { getPayrollReport, updatePayrollStatus, updatePayslipMode, uploadManualPayslip } from '../services/payrollService';
import { Search } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';
import useDebouncedValue from '../hooks/useDebouncedValue';
import '../styles/tailwind.css';

const PAGE_SIZE = 15;

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
    variablePay: record.variablePay ?? 0,
    status: normalizeStatus(record.creditStatus ?? record.paymentStatus ?? record.status),
    manualPayslip: Boolean(record.manualPayslip),
    hasPayslipFile: Boolean(record.hasPayslipFile),
  };
};

const getPayrollRowKey = (row) => `${row.payrollId || row.employeeId}-${row.month}-${row.year}`;

function PayrollReportPage({ userName, onLogout }) {
  const [reportRows, setReportRows] = useState([]);
  const [searchDraft, setSearchDraft] = useState('');
  const debouncedSearch = useDebouncedValue(searchDraft, 400);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportLoaded, setReportLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingKey, setUpdatingKey] = useState('');
  const [payslipUpdatingKey, setPayslipUpdatingKey] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [creditedCount, setCreditedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setReportLoaded(false);
    setReportRows([]);
    setError('');
    setStatusMessage('');
  }, [selectedMonth, selectedYear]);

  // Debounced search auto-fetches (page reset to 1) once a report has been loaded at least
  // once - typing before that just edits the box, nothing to search yet.
  useEffect(() => {
    if (!reportLoaded) return;
    setCurrentPage(1);
    loadReport(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const loadReport = async (page, search) => {
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const response = await getPayrollReport({
        month: selectedMonth,
        year: selectedYear,
        page: page - 1,
        size: PAGE_SIZE,
        search,
      });
      const records = pickReportRecords(response).map((record) =>
        normalizePayrollRecord(record, selectedMonth, selectedYear)
      );
      setReportRows(records);
      setTotalEmployees(response.totalEmployees ?? records.length);
      setCreditedCount(response.creditedCount ?? 0);
      setPendingCount(response.pendingCount ?? 0);
      setTotalPages(Math.max(1, response.totalPages ?? 1));
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

  const handleReportClick = () => {
    setCurrentPage(1);
    loadReport(1, debouncedSearch);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadReport(page, debouncedSearch);
  };

  const handlePayrollStatusUpdate = async (row) => {
    const rowKey = getPayrollRowKey(row);
    const status = 'Amount Credited';

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
      setStatusMessage('Payroll status updated successfully.');
      // Reload rather than patch locally - the credited/pending stat tiles are computed
      // server-side over the full filtered set, not just this page.
      await loadReport(currentPage, debouncedSearch);
    } catch (err) {
      console.error('Failed to update payroll status:', err);
      setError(err.message || 'Failed to update payroll status');
    } finally {
      setUpdatingKey('');
    }
  };

  const handlePayslipModeToggle = async (row) => {
    const rowKey = getPayrollRowKey(row);
    const manualPayslip = !row.manualPayslip;

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
      await loadReport(currentPage, debouncedSearch);
    } catch (err) {
      console.error('Failed to update payslip mode:', err);
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
      setStatusMessage('Payslip uploaded successfully.');
      await loadReport(currentPage, debouncedSearch);
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

  const renderPayrollReport = () => {
    if (!reportLoaded) {
      return <p className="px-5 py-6 text-sm text-muted-foreground">Select month and year, then click Report to load payroll records.</p>;
    }

    if (reportRows.length === 0) {
      return <p className="px-5 py-6 text-sm text-muted-foreground">No payroll records found for this month and year.</p>;
    }

    return (
      <>
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth: 1080 }}>
          <thead>
            <tr className="border-b border-border/80 bg-muted/40">
              {['Employee ID', 'Employee Name', 'Month', 'Year', 'Department', 'Designation', 'Amount', 'Variable Pay', 'Status', 'Action', 'Payslip'].map((col) => (
                <th key={col} className="h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row) => {
              const rowKey = getPayrollRowKey(row);
              const isUpdating = updatingKey === rowKey;
              const isCredited = row.status === 'Amount Credited';
              const isPayslipUpdating = payslipUpdatingKey === rowKey;

              return (
                <tr key={rowKey} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-foreground">{row.employeeId || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{row.employeeName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{monthOptions[Number(row.month) - 1] || row.month}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.year}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.department}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.designation}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.variablePay ? formatCurrency(row.variablePay) : '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                        isCredited
                          ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                          : 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handlePayrollStatusUpdate(row)}
                      disabled={isUpdating || isCredited}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : isCredited ? 'Credited' : 'Update'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-1.5 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={row.manualPayslip}
                        disabled={isPayslipUpdating}
                        onChange={() => handlePayslipModeToggle(row)}
                        className="size-4 rounded border-border accent-client"
                      />
                      Manual Upload
                    </label>
                    {row.manualPayslip && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="file"
                          disabled={isPayslipUpdating}
                          onChange={(e) => handlePayslipFileUpload(row, e.target.files[0])}
                          className="max-w-[160px] text-xs text-muted-foreground"
                        />
                        {row.hasPayslipFile && (
                          <span className="text-xs font-medium text-[#15803d]">Uploaded</span>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalEmployees}
        pageSize={PAGE_SIZE}
      />
      </>
    );
  };

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="payroll-report" title="Employee Payroll List" subtitle="Filter payroll records by month and year, then update the status after the amount is credited.">
      <div className="flex flex-col gap-5">
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: 'Records', value: totalEmployees },
            { label: 'Pending', value: pendingCount },
            { label: 'Amount Credited', value: creditedCount },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
              <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by employee ID or name"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Month</label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              >
                {monthOptions.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Year</label>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleReportClick}
              disabled={loading}
              className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Report'}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
          )}
          {statusMessage && (
            <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm text-[#15803d]">{statusMessage}</div>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading payroll report...</p>
          ) : (
            <div className="rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Payroll Report</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Showing employee payroll records for {selectedMonthName} {selectedYear}.
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{totalEmployees} employees</span>
              </div>
              {renderPayrollReport()}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default PayrollReportPage;
