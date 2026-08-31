import React, { useEffect, useMemo, useState } from 'react';
import { getAllEmployees } from '../services/employeeService';
import { runPayroll } from '../services/payrollService';
import { Search } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/tailwind.css';

function PayrollPage({ userName, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [includedEmployeeIds, setIncludedEmployeeIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [excludedSearchQuery, setExcludedSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [runError, setRunError] = useState('');

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await getAllEmployees();
        const activeEmployees = data.filter(
          (employee) => (employee.role || '').toLowerCase() !== 'admin'
            && (employee.employeeStatus || '').toLowerCase() !== 'inactive'
        );

        setEmployees(activeEmployees);
        setIncludedEmployeeIds(activeEmployees.map((employee) => String(employee.id)));
        setError('');
      } catch (err) {
        console.error('Failed to load payroll employees:', err);
        setError('Unable to load payroll employees at this time.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleToggleEmployee = (employeeId) => {
    const key = String(employeeId);
    setIncludedEmployeeIds((current) =>
      current.includes(key)
        ? current.filter((id) => id !== key)
        : [...current, key]
    );
  };

  const handleRunPayroll = async () => {
    const employeesForPayroll = employees.filter((employee) =>
      includedEmployeeIds.includes(String(employee.id))
    );

    const payload = {
      employees: employeesForPayroll.map((employee) => ({
        employeeId: employee.id,
        employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      })),
      month: selectedMonth,
      year: selectedYear,
    };

    setRunning(true);
    setRunError('');
    setDownloadMessage('');

    try {
      const { fileBlob, filename } = await runPayroll(payload);
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `payroll-${selectedMonth}-${selectedYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      setDownloadMessage('Payroll Excel generated and downloaded successfully.');
    } catch (err) {
      console.error('Failed to run payroll:', err);
      setRunError(err.message || 'Failed to run payroll');
    } finally {
      setRunning(false);
    }
  };

  // ID must match exactly (searching "1" should not also return 10, 11, 12...);
  // the rest stay substring matches since that's expected for text search.
  const matchesEmployeeSearch = (employee, query) => {
    if (!query) return true;
    if (String(employee.id ?? '').toLowerCase() === query) return true;

    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    return [
      fullName,
      employee.email,
      employee.phone,
      employee.department,
      employee.designation,
    ].some((field) => field?.toString().toLowerCase().includes(query));
  };

  // Included/excluded employees are split from the full roster first, so the two
  // search boxes stay independent - text typed in one can't hide results in the other.
  const includedEmployeesUnfiltered = useMemo(
    () => employees.filter((employee) => includedEmployeeIds.includes(String(employee.id))),
    [employees, includedEmployeeIds]
  );

  const excludedEmployeesUnfiltered = useMemo(
    () => employees.filter((employee) => !includedEmployeeIds.includes(String(employee.id))),
    [employees, includedEmployeeIds]
  );

  const includedEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return includedEmployeesUnfiltered;

    return includedEmployeesUnfiltered.filter((employee) => matchesEmployeeSearch(employee, query));
  }, [includedEmployeesUnfiltered, searchQuery]);

  const filteredExcludedEmployees = useMemo(() => {
    const query = excludedSearchQuery.trim().toLowerCase();
    if (!query) return excludedEmployeesUnfiltered;

    return excludedEmployeesUnfiltered.filter((employee) => matchesEmployeeSearch(employee, query));
  }, [excludedEmployeesUnfiltered, excludedSearchQuery]);

  const activeEmployeeCount = employees.length;
  const includedCount = includedEmployeeIds.length;
  const excludedCount = Math.max(activeEmployeeCount - includedCount, 0);
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
  const selectedMonthName = monthOptions[selectedMonth - 1];
  const payrollReportRows = useMemo(() => {
    return employees
      .filter((employee) => includedEmployeeIds.includes(String(employee.id)))
      .map((employee) => ({
        id: employee.id,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        department: employee.department || 'N/A',
        designation: employee.designation || 'N/A',
        amount: employee.ctc || employee.basicSalary || 'N/A',
      }));
  }, [employees, includedEmployeeIds]);

  const renderPayrollTable = (rows, emptyMessage) => {
    if (rows.length === 0) {
      return <p className="px-5 py-6 text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth: 860 }}>
          <thead>
            <tr className="border-b border-border/80 bg-muted/40">
              {['Include', 'ID', 'Name', 'Email', 'Department', 'Designation', 'Phone', 'Salary'].map((col) => (
                <th key={col} className="h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((employee) => {
              const employeeId = String(employee.id);
              const isIncluded = includedEmployeeIds.includes(employeeId);

              return (
                <tr key={employee.id} className={`border-b border-border/60 last:border-0 hover:bg-muted/30 ${!isIncluded ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => handleToggleEmployee(employee.id)}
                      className="size-4 rounded border-border accent-client"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{employee.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.email || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.department || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.designation || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.ctc || employee.basicSalary || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="payroll" title="Payroll" subtitle="Search active employees, then use the checkbox to include or exclude them from payroll.">
      <div className="flex flex-col gap-5">
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Employees', value: activeEmployeeCount },
            { label: 'Included', value: includedCount },
            { label: 'Excluded', value: excludedCount },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
              <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">Uncheck a row to exclude it from payroll.</p>
            <button
              type="button"
              onClick={handleRunPayroll}
              disabled={running || includedCount === 0}
              className="ml-auto h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
            >
              {running ? 'Running...' : 'Run'}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading payroll data...</p>
          ) : error ? (
            <p className="text-sm text-[#b91c1c]">{error}</p>
          ) : (
            <>
              {(runError || downloadMessage) && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    runError
                      ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                      : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                  }`}
                >
                  {runError || downloadMessage}
                </div>
              )}

              <div className="rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Payroll Report</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Showing selected employees for {selectedMonthName} {selectedYear}.
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{payrollReportRows.length} employees</span>
                </div>

                {payrollReportRows.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No employees selected for this payroll report.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: 780 }}>
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/40">
                          {['Employee ID', 'Employee Name', 'Month', 'Year', 'Department', 'Designation', 'Amount'].map((col) => (
                            <th key={col} className="h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payrollReportRows.map((row) => (
                          <tr key={`${row.id}-${selectedMonth}-${selectedYear}`} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm text-foreground">{row.id}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{row.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{selectedMonthName}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{selectedYear}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{row.department}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{row.designation}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{row.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
                  <h3 className="text-base font-semibold text-foreground">Included Employees</h3>
                  <span className="text-sm text-muted-foreground">{includedEmployees.length} employees</span>
                </div>
                <div className="px-5 pt-4">
                  <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by ID, name, email, department, or designation"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                    />
                  </div>
                </div>
                {renderPayrollTable(includedEmployees, 'No included employees match your search.')}
              </div>

              <div className="rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
                  <h3 className="text-base font-semibold text-foreground">Excluded Employees</h3>
                  <span className="text-sm text-muted-foreground">{filteredExcludedEmployees.length} employees</span>
                </div>
                <div className="px-5 pt-4">
                  <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search excluded employees"
                      value={excludedSearchQuery}
                      onChange={(e) => setExcludedSearchQuery(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                    />
                  </div>
                </div>
                {renderPayrollTable(filteredExcludedEmployees, 'No excluded employees match your search.')}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default PayrollPage;
