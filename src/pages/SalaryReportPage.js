import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees } from '../services/employeeService';
import AdminLayout from '../components/AdminLayout';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function SalaryReportPage({ userName, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSalaryReport = async () => {
      setLoading(true);
      try {
        const data = await getAllEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load salary report:', err);
        setError('Unable to load salary report at this time.');
      } finally {
        setLoading(false);
      }
    };

    loadSalaryReport();
  }, []);

  const downloadSalaryReport = () => {
    const headers = ['Employee Name', 'Department', 'Salary'];
    const rows = employees.map((employee) => [
      `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      employee.department || 'N/A',
      employee.ctc || employee.basicSalary || '0',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee-salary-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const employeeRecords = employees.map((employee) => ({
    id: employee.id,
    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
    department: employee.department || 'N/A',
    salary: employee.ctc || employee.basicSalary || '0',
  }));

  return (
    <AdminLayout userName={userName} onLogout={onLogout} activeItem="salary-report" title="Employee Salary Report">
      <main className="dashboard-main">
        <div className="dashboard-cards" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '30px' }}>
          <div className="dashboard-card clickable" onClick={() => navigate('/admin')}>
            <h3>Back to Admin Dashboard</h3>
            <p>Return to the main admin panel.</p>
          </div>
          <div className="dashboard-card">
            <h3>Download Report</h3>
            <p>Export the salary report for all employees.</p>
            <button type="button" className="create-btn" onClick={downloadSalaryReport}>
              Download Excel Sheet
            </button>
          </div>
        </div>

        <section className="employees-section">
          <div className="employees-header">
            <div>
              <h2>Salary Report</h2>
              <p>{employeeRecords.length} employee{employeeRecords.length === 1 ? '' : 's'} included in this report.</p>
            </div>
          </div>

          {loading ? (
            <p>Loading salary data...</p>
          ) : error ? (
            <p>{error}</p>
          ) : employeeRecords.length === 0 ? (
            <p>No employee salary data available.</p>
          ) : (
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRecords.map((employee, index) => (
                    <tr key={employee.id || index}>
                      <td>{index + 1}</td>
                      <td>{employee.name}</td>
                      <td>{employee.department}</td>
                      <td>{employee.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}

export default SalaryReportPage;
