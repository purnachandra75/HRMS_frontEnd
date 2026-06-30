import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployeesPage, deleteEmployee } from '../services/employeeService';
import '../styles/Dashboard.css';

function AdminDashboard({ userName, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const RECORDS_PER_PAGE = 5;
  const navigate = useNavigate();
  const employeeDetailsRef = useRef(null);

  useEffect(() => {
    loadEmployees(currentPage, searchQuery.trim());
  }, [currentPage, searchQuery]);

  const loadEmployees = async (page, query) => {
    setLoading(true);
    try {
      const { employees: data, total, pageSize: responsePageSize } = await getEmployeesPage({
        page,
        size: RECORDS_PER_PAGE,
        searchQuery: query,
      });
      setEmployees(data);
      setTotalEmployees(total);
      setPageSize(responsePageSize || RECORDS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    navigate(`/admin/employee/${employee.id}?edit=true`);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(employeeId);
        setEmployees(employees.filter((emp) => emp.id !== employeeId));
        alert('Employee deleted successfully');
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const showEmployeeDetails = () => {
    if (employeeDetailsRef.current) {
      employeeDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalPages = totalEmployees !== null ? Math.max(1, Math.ceil(totalEmployees / pageSize)) : null;
  const isNextDisabled = totalPages ? currentPage >= totalPages : employees.length < pageSize;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (!isNextDisabled) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="reports-layout admin-dashboard-layout">
        <aside className="reports-sidebar">
          <h2>Dashboard</h2>
          <nav>
            <button type="button" className="active" onClick={showEmployeeDetails}>
              Employee Details
            </button>
            <button type="button" onClick={() => navigate('/admin/leaves')}>
              Leave Management
            </button>
            <button type="button" onClick={() => navigate('/admin/reports')}>
              Reports
            </button>
            <button type="button" onClick={() => navigate('/admin/holidays')}>
              Holidays
            </button>
            <button type="button" onClick={() => navigate('/admin/attendance')}>
              Attendance
            </button>
            <button type="button" onClick={() => navigate('/admin/payroll')}>
              Payroll
            </button>
            <button type="button" onClick={() => navigate('/admin/payroll-report')}>
              Payroll Report
            </button>
            <hr className="reports-sidebar-divider" />
            <button type="button" onClick={() => navigate('/admin/employee/new')}>
              + Create Employee
            </button>
          </nav>
        </aside>

        <main className="reports-main">
          <div className="reports-content-header">
            <h2>Employee Details</h2>
            <p>View and manage all employee records in one place.</p>
          </div>

          <div className="employees-section admin-employees-section" ref={employeeDetailsRef}>
            <div className="employees-header">
              <div className="header-left">
                <h2>All Employees</h2>
                <div className="search-bar">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by first name, last name, email, phone, or designation"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={() => navigate('/admin/employee/new')} className="create-btn">Create Employee</button>
            </div>
            
            {loading ? (
              <p>Loading employees...</p>
            ) : employees.length === 0 ? (
              <p>No employees found.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="employees-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td>{employee.id}</td>
                          <td>{employee.firstName || 'N/A'}</td>
                          <td>{employee.lastName || 'N/A'}</td>
                          <td>{employee.email}</td>
                          <td>{employee.phone || 'N/A'}</td>
                          <td>{employee.designation || 'N/A'}</td>
                          <td>{employee.department || 'N/A'}</td>
                          <td>{employee.employeeStatus || 'Active'}</td>
                          <td className="table-action-buttons">
                            <button
                              className="view-btn"
                              onClick={() => navigate(`/admin/employee/${employee.id}`)}
                            >
                              View
                            </button>
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit(employee)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(employee.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={handleNextPage}
                    disabled={isNextDisabled}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}

export default AdminDashboard;
