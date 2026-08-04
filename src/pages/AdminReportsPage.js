import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getEmployeesPage } from '../services/employeeService';
import { getLeaveRequests } from '../services/leaveService';
import AdminLayout from '../components/AdminLayout';
import { getEmploymentTypeLabel, matchesEmploymentFilter } from '../utils/reportUtils';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function AdminReportsPage({ userName, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('salary');
  const [employeeReportType, setEmployeeReportType] = useState('status');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employmentFilter, setEmploymentFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [backendTotal, setBackendTotal] = useState(0);
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    payroll: true,
    employee: false,
    leave: false,
    attendance: false,
  });
  const getReportEmployeeParams = useCallback((page, size) => {
    const trimmedDepartment = String(departmentFilter || '').trim();
    const params = {
      page,
      size,
    };

    if (trimmedDepartment && trimmedDepartment.toLowerCase() !== 'all') {
      params.department = trimmedDepartment;
    }

    if (selectedReport === 'salary' || selectedReport === 'leaves' || selectedReport === 'attendance') {
      params.status = 'active';
    }

    if (selectedReport === 'employee') {
      if (employeeReportType === 'status') {
        params.status = 'inactive';
      } else if (employeeReportType !== 'all') {
        params.status = 'active';
      }

      if (employeeReportType === 'employment' && employmentFilter) {
        const normalizedEmployment = String(employmentFilter || '').trim().toLowerCase();
        if (normalizedEmployment !== 'all') {
          params.employeeType = normalizedEmployment === 'full' ? 'Full Time' : 'Part Time';
        }
      }
    }

    return params;
  }, [departmentFilter, selectedReport, employeeReportType, employmentFilter]);

  const leaveRequestsRef = useRef(leaveRequests);
  useEffect(() => {
    leaveRequestsRef.current = leaveRequests;
  }, [leaveRequests]);

  useEffect(() => {
    const loadReportPage = async () => {
      if (!['salary', 'leaves', 'attendance', 'employee'].includes(selectedReport)) return;

      setLoading(true);
      try {
        const params = getReportEmployeeParams(currentPage, rowsPerPage);

        const [
          { employees: paged, total, totalPages },
          leaveRequestsData,
        ] = await Promise.all([
          getEmployeesPage(params),
          selectedReport === 'leaves' ? getLeaveRequests() : Promise.resolve(leaveRequestsRef.current),
        ]);

        setEmployees(paged);
        if (selectedReport === 'leaves') {
          setLeaveRequests(Array.isArray(leaveRequestsData) ? leaveRequestsData : []);
        }
        setBackendTotal(total ?? paged.length);
        setBackendTotalPages(totalPages ?? Math.max(1, Math.ceil((total ?? paged.length) / rowsPerPage)));
        setError('');
      } catch (err) {
        console.error('Failed to load report page:', err);
        setError('Unable to load report data.');
      } finally {
        setLoading(false);
      }
    };

    loadReportPage();
  }, [selectedReport, employeeReportType, departmentFilter, employmentFilter, currentPage, getReportEmployeeParams]);

  const parseDateOfJoining = (value) => {
    if (!value) return null;
    const normalized = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const [year, month, day] = normalized.split('-').map((part) => parseInt(part, 10));
      return new Date(year, month - 1, day);
    }

    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(normalized)) {
      const parts = normalized.includes('/') ? normalized.split('/') : normalized.split('-');
      const [first, second, year] = parts.map((part) => parseInt(part, 10));
      return first > 12 ? new Date(year, second - 1, first) : new Date(year, first - 1, second);
    }

    return new Date(normalized);
  };

  const getJoiningDate = (employee) => {
    return parseDateOfJoining(
      employee.dateOfJoining ||
      employee.jobDetails?.dateOfJoining ||
      employee.jobDetails?.joinedDate
    );
  };

  const nonAdminEmployees = employees;

  const getActiveEmployees = (employeeList) => employeeList.filter((employee) => {
    const status = (employee.employeeStatus || '').toLowerCase();
    return status !== 'inactive';
  });

  const activeEmployees = getActiveEmployees(nonAdminEmployees);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isWithinProbationPeriod = (employee) => {
    const joinedDate = getJoiningDate(employee);
    if (!joinedDate || Number.isNaN(joinedDate.getTime())) return false;

    joinedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - joinedDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 180;
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const getEmployeeId = (employee) => String(employee?.id ?? employee?.empId ?? '').trim();

  const getLeaveEmployeeId = (leave) => String(
    leave?.employeeId ??
    leave?.empId ??
    leave?.employee?.employeeId ??
    leave?.employee?.empId ??
    leave?.employee?.id ??
    ''
  ).trim();

  const addLeaveDaysToMonths = (monthlyLeaves, request) => {
    if ((request.status || '').toLowerCase() !== 'approved') {
      return;
    }

    const fromDate = new Date(request.fromDate);
    const toDate = new Date(request.toDate);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      return;
    }

    const currentDate = new Date(fromDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(toDate);
    endDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const day = currentDate.getDay();
      if (currentDate.getFullYear() === selectedYear && day !== 0 && day !== 6) {
        monthlyLeaves[currentDate.getMonth()] += 1;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  };

  const buildLeavesReportRows = (employeeList, requestsList) => employeeList.map((employee, index) => {
    const monthlyLeaves = Array(12).fill(0);
    const employeeId = getEmployeeId(employee);

    requestsList
      .filter((leave) => getLeaveEmployeeId(leave) === employeeId)
      .forEach((leave) => addLeaveDaysToMonths(monthlyLeaves, leave));

    return {
      id: employee.id || index,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      department: employee.department || 'N/A',
      jan: monthlyLeaves[0],
      feb: monthlyLeaves[1],
      mar: monthlyLeaves[2],
      apr: monthlyLeaves[3],
      may: monthlyLeaves[4],
      jun: monthlyLeaves[5],
      jul: monthlyLeaves[6],
      aug: monthlyLeaves[7],
      sep: monthlyLeaves[8],
      oct: monthlyLeaves[9],
      nov: monthlyLeaves[10],
      dec: monthlyLeaves[11],
    };
  });

  const buildAttendanceReportRows = (employeeList) => employeeList.map((employee, index) => ({
    id: employee.id || index,
    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
    department: employee.department || 'N/A',
    status: employee.employeeStatus || 'Active',
  }));

  const buildSalaryReportRows = (employeeList) => employeeList.map((employee, index) => ({
    id: employee.id || index,
    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
    department: employee.department || 'N/A',
    salary: employee.ctc || employee.basicSalary || '0',
  }));

  const buildEmployeeReportRows = (employeeList, reportType) => {
    if (reportType === 'employment') {
      return employeeList
        .filter((employee) => matchesEmploymentFilter(employee.employeeType, employmentFilter))
        .map((employee, index) => ({
          id: employee.id || index,
          name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
          type: getEmploymentTypeLabel(employee.employeeType),
          department: employee.department || 'N/A',
        }));
    }

    if (reportType === 'newJoiners' || reportType === 'probation') {
      return employeeList.filter(isWithinProbationPeriod).map((employee, index) => {
        const joinedDate = getJoiningDate(employee);
        const joinedText =
          joinedDate && !Number.isNaN(joinedDate.getTime())
            ? joinedDate.toISOString().split('T')[0]
            : 'N/A';

        return {
          id: employee.id || index,
          name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
          joined: joinedText,
          department: employee.department || 'N/A',
        };
      });
    }

    return employeeList.map((employee, index) => ({
      id: employee.id || index,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      status: employee.employeeStatus || 'N/A',
      department: employee.department || 'N/A',
    }));
  };

  const leavesReportRows = buildLeavesReportRows(activeEmployees, leaveRequests);
  const attendanceReportRows = buildAttendanceReportRows(activeEmployees);
  const salaryReportRows = buildSalaryReportRows(activeEmployees);

  const reportDetails = {
    salary: {
      title: 'Salary Reports',
      description: 'Review salary records for active employees only.',
      rows: salaryReportRows,
      columns: ['#', 'Employee Name', 'Department', 'Salary'],
      hasDownload: true,
    },
    leaves: {
      title: `Leave Report (${selectedYear})`,
      description: 'View employee leaves month-wise for the selected year.',
      rows: leavesReportRows,
      columns: [
        '#',
        'Employee Name',
        'Department',
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      hasDownload: true,
      hasYearFilter: true,
    },
    attendance: {
      title: 'Attendance Report',
      description: 'View attendance records for all active employees.',
      rows: attendanceReportRows,
      columns: ['#', 'Employee Name', 'Department', 'Status'],
      hasDownload: true,
    },
  };

  const employeeReports = {
    all: {
      title: 'All Employees',
      description: 'View all employees (both active and inactive).',
      rows: buildEmployeeReportRows(employees, 'all'),
      columns: ['#', 'Employee Name', 'Status', 'Department'],
      hasDownload: true,
    },
    status: {
      title: 'Employee Exit Report',
      description: 'See employees with inactive status (resigned, terminated, or inactive).',
      rows: buildEmployeeReportRows(employees, 'status'),
      columns: ['#', 'Employee Name', 'Status', 'Department'],
      hasDownload: true,
    },
    employment: {
      title: 'Employment Type Report',
      description: 'View active employees by employment type with a full/part filter.',
      rows: buildEmployeeReportRows(employees, 'employment'),
      columns: ['#', 'Employee Name', 'Employment Type', 'Department'],
      hasDownload: true,
    },
    newJoiners: {
      title: 'New Joiners',
      description: 'Active employees who joined within the last 6 months (probation period).',
      rows: buildEmployeeReportRows(employees, 'newJoiners'),
      columns: ['#', 'Employee Name', 'Date Joined', 'Department'],
      hasDownload: true,
    },
    probation: {
      title: 'Probation Period',
      description: 'Active employees within 6 months of joining date (probation period).',
      rows: buildEmployeeReportRows(employees, 'probation'),
      columns: ['#', 'Employee Name', 'Date Joined', 'Department'],
      hasDownload: true,
    },
  };

  const matchesDepartment = (dept) => {
    const filter = String(departmentFilter || '').trim().toLowerCase().replace(/-/g, ' ');
    if (!filter || filter === 'all') return true;

    const normalized = String(dept || '').trim().toLowerCase();

    if (!normalized) return false;

    if (filter === 'non it') {
      return !/\bit\b/.test(normalized);
    }

    if (filter === 'hr') {
      return (
        /\bhr\b/.test(normalized) ||
        normalized.includes('hr department') ||
        normalized.includes('human resources')
      );
    }

    if (filter === 'it') {
      return /\bit\b/.test(normalized) || normalized.includes('it department');
    }

    if (filter === 'admin') {
      return normalized.includes('admin');
    }

    return normalized.replace(/-/g, ' ') === filter;
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const selectPayrollReport = (report) => {
    setSelectedReport(report);
    setCurrentPage(1);
    setExpandedSections((prev) => ({ ...prev, payroll: true }));
  };

  const selectEmployeeReport = (reportType) => {
    setEmployeeReportType(reportType);
    setSelectedReport('employee');
    setCurrentPage(1);
    setExpandedSections((prev) => ({ ...prev, employee: true }));
  };

  const selectedReportData = selectedReport === 'employee'
    ? employeeReports[employeeReportType]
    : reportDetails[selectedReport];

  const visibleRows = selectedReportData && Array.isArray(selectedReportData.rows)
    ? selectedReportData.rows
    : [];

  const isBackendPagedReport = ['salary', 'leaves', 'attendance', 'employee'].includes(selectedReport);

  // For backend-paged reports, backend already filtered by department, so don't filter again
  const filteredRows = isBackendPagedReport 
    ? visibleRows 
    : visibleRows.filter((row) => matchesDepartment(row.department));

  const totalRows = isBackendPagedReport ? backendTotal : filteredRows.length;
  const totalPages = isBackendPagedReport
    ? backendTotalPages
    : Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const currentPageRows = isBackendPagedReport
    ? visibleRows
    : filteredRows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      );

  const selected = selectedReportData
    ? {
        ...selectedReportData,
        rows: currentPageRows,
        totalRows,
      }
    : null;

  const reportForDownload = selectedReportData
    ? { ...selectedReportData, rows: currentPageRows }
    : null;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const fetchAllReportEmployees = async () => {
    const pageSize = 1000;
    const allEmployees = [];
    let page = 1;
    let totalPagesToLoad = 1;

    do {
      const result = await getEmployeesPage(getReportEmployeeParams(page, pageSize));
      const pageEmployees = Array.isArray(result.employees) ? result.employees : [];
      allEmployees.push(...pageEmployees);

      totalPagesToLoad = result.totalPages || Math.ceil((result.total || allEmployees.length) / pageSize) || 1;
      if (pageEmployees.length === 0 || pageEmployees.length < pageSize) {
        break;
      }

      page += 1;
    } while (page <= totalPagesToLoad && page <= 100);

    return allEmployees;
  };

  const buildCompleteReportForDownload = async () => {
    if (!selectedReportData) {
      return null;
    }

    const allReportEmployees = await fetchAllReportEmployees();
    const activeReportEmployees = getActiveEmployees(allReportEmployees);

    if (selectedReport === 'salary') {
      return {
        ...selectedReportData,
        rows: buildSalaryReportRows(activeReportEmployees),
      };
    }

    if (selectedReport === 'leaves') {
      const allLeaveRequests = await getLeaveRequests();
      return {
        ...selectedReportData,
        rows: buildLeavesReportRows(activeReportEmployees, Array.isArray(allLeaveRequests) ? allLeaveRequests : []),
      };
    }

    if (selectedReport === 'attendance') {
      return {
        ...selectedReportData,
        rows: buildAttendanceReportRows(activeReportEmployees),
      };
    }

    if (selectedReport === 'employee') {
      return {
        ...selectedReportData,
        rows: buildEmployeeReportRows(allReportEmployees, employeeReportType),
      };
    }

    return {
      ...selectedReportData,
      rows: filteredRows,
    };
  };

  const downloadReport = (report) => {
    const headers = report.columns || [];
    const rows = (report.rows || []).map((row, index) => [
      index + 1,
      ...Object.keys(row)
        .filter((key) => key !== 'id')
        .map((cellKey) => row[cellKey]),
    ]);

    const escapeHtml = (value) =>
      String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const headerRow = headers
      .map((header) => `<th style="font-weight:bold; text-align:left; padding:6px;">${escapeHtml(header)}</th>`)
      .join('');

    const bodyRows = rows
      .map(
        (row) => `
        <tr>
          ${row.map((cell) => `<td style="padding:6px;">${escapeHtml(cell)}</td>`).join('')}
        </tr>
      `
      )
      .join('');

    const tableHtml = `
      <table border="1" style="border-collapse:collapse;">
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;

    const excelHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${tableHtml}</body></html>`;

    const fileName = `${(report.title || 'report').replace(/\s+/g, '-').toLowerCase()}.xls`;
    const blob = new Blob([excelHtml], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = async () => {
    if (!reportForDownload || downloading) {
      return;
    }

    setDownloading(true);
    try {
      const completeReport = await buildCompleteReportForDownload();
      downloadReport(completeReport || reportForDownload);
    } catch (err) {
      console.error('Failed to download complete report:', err);
      alert('Unable to download the complete report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="reports" title="Admin Reports">

      <div className="reports-page-content">
        <div className="reports-page-grid with-submenu">
          <aside className="reports-submenu profile-sidebar reports-submenu-container">
            <div className="sidebar-header">
              <h3>Report Sections</h3>
            </div>
            <nav className="sidebar-menu">
              <button
                type="button"
                className={`menu-item ${expandedSections.payroll ? 'active' : ''}`}
                onClick={() => toggleSection('payroll')}
              >
                <span className="menu-icon">💰</span>
                <span className="menu-label">Payroll</span>
                <span className="submenu-arrow">{expandedSections.payroll ? '▼' : '▶'}</span>
              </button>
              {expandedSections.payroll && (
                <div className="submenu-children">
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'salary' ? 'active' : ''}`}
                    onClick={() => selectPayrollReport('salary')}
                  >
                    <span className="menu-label">Salary Report</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`menu-item ${expandedSections.employee ? 'active' : ''}`}
                onClick={() => toggleSection('employee')}
              >
                <span className="menu-icon">👥</span>
                <span className="menu-label">Employee Reports</span>
                <span className="submenu-arrow">{expandedSections.employee ? '▼' : '▶'}</span>
              </button>
              {expandedSections.employee && (
                <div className="submenu-children">
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'employee' && employeeReportType === 'all' ? 'active' : ''}`}
                    onClick={() => selectEmployeeReport('all')}
                  >
                    <span className="menu-label">All Employees</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'employee' && employeeReportType === 'status' ? 'active' : ''}`}
                    onClick={() => selectEmployeeReport('status')}
                  >
                    <span className="menu-label">Employee Exit Report</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'employee' && employeeReportType === 'employment' ? 'active' : ''}`}
                    onClick={() => selectEmployeeReport('employment')}
                  >
                    <span className="menu-label">Employment Type Report</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'employee' && employeeReportType === 'newJoiners' ? 'active' : ''}`}
                    onClick={() => selectEmployeeReport('newJoiners')}
                  >
                    <span className="menu-label">New Joiners</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'employee' && employeeReportType === 'probation' ? 'active' : ''}`}
                    onClick={() => selectEmployeeReport('probation')}
                  >
                    <span className="menu-label">Probation Period</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`menu-item ${expandedSections.leave ? 'active' : ''}`}
                onClick={() => toggleSection('leave')}
              >
                <span className="menu-icon">📅</span>
                <span className="menu-label">Leave Report</span>
                <span className="submenu-arrow">{expandedSections.leave ? '▼' : '▶'}</span>
              </button>
              {expandedSections.leave && (
                <div className="submenu-children">
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'leaves' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReport('leaves');
                      setCurrentPage(1);
                    }}
                  >
                    <span className="menu-label">View Leave Report</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`menu-item ${expandedSections.attendance ? 'active' : ''}`}
                onClick={() => toggleSection('attendance')}
              >
                <span className="menu-icon">✓</span>
                <span className="menu-label">Attendance Report</span>
                <span className="submenu-arrow">{expandedSections.attendance ? '▼' : '▶'}</span>
              </button>
              {expandedSections.attendance && (
                <div className="submenu-children">
                  <button
                    type="button"
                    className={`menu-item ${selectedReport === 'attendance' ? 'active' : ''}`}
                    onClick={() => { setSelectedReport('attendance'); }}
                  >
                    <span className="menu-label">View Attendance Report</span>
                  </button>
                </div>
              )}
            </nav>
          </aside>
          <section className="reports-content report-body">
            <div className="reports-content-header">
              <h2>{selected?.title}</h2>
              <p>{selected?.description}</p>
            </div>

            <div className="report-controls-top">
              {selected?.hasYearFilter && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginRight: '4px' }}>
                    Year:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value, 10));
                      setCurrentPage(1);
                    }}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReport === 'employee' && employeeReportType === 'employment' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginRight: '4px' }}>
                    Employment:
                  </label>
                  <select value={employmentFilter} onChange={(e) => {
                    setEmploymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}>
                    <option value="all">All</option>
                    <option value="full">Full Time</option>
                    <option value="part">Part Time</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginRight: '4px' }}>
                  Department:
                </label>
                <select value={departmentFilter} onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}>
                  <option value="All">All</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Non IT">Non IT</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {selected?.hasDownload && reportForDownload && (
                <button type="button" className="create-btn" onClick={handleDownloadReport} disabled={downloading}>
                  {downloading ? 'Exporting...' : 'Export All'}
                </button>
              )}
            </div>

            {loading ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                Loading report data...
              </p>
            ) : error ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>{error}</p>
            ) : !selected ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Please select a report.</p>
            ) : selected.rows.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                No records found for this report.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <span style={{ color: '#374151', fontSize: '14px' }}>
                    Showing {Math.min((currentPage - 1) * rowsPerPage + 1, selected.totalRows)}
                    {' - '}
                    {Math.min(currentPage * rowsPerPage, selected.totalRows)} of {selected.totalRows}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="create-btn"
                      style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="create-btn"
                      style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="reports-table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>
                        {selected.columns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.rows.map((row, index) => (
                        <tr key={row.id || index}>
                          <td>{index + 1}</td>
                          {Object.keys(row)
                            .filter((key) => key !== 'id')
                            .map((field) => (
                              <td key={field}>{row[field]}</td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminReportsPage;
