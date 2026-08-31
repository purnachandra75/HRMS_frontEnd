import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { getAllEmployees } from '../services/employeeService';
import AdminLayout from '../components/AdminLayout';
import '../styles/tailwind.css';

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
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate('/admin')}
            className="flex flex-col items-start gap-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm hover:shadow-md"
          >
            <h3 className="text-sm font-semibold text-foreground">Back to Admin Dashboard</h3>
            <p className="text-sm text-muted-foreground">Return to the main admin panel.</p>
          </button>
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Download Report</h3>
            <p className="mt-1 text-sm text-muted-foreground">Export the salary report for all employees.</p>
            <button
              type="button"
              onClick={downloadSalaryReport}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-client px-3 text-sm font-medium text-client-foreground hover:bg-client/90"
            >
              <Download className="size-4" />
              Download Excel Sheet
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/80 px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Salary Report</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {employeeRecords.length} employee{employeeRecords.length === 1 ? '' : 's'} included in this report.
            </p>
          </div>

          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading salary data...</p>
          ) : error ? (
            <p className="px-5 py-6 text-sm text-[#b91c1c]">{error}</p>
          ) : employeeRecords.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No employee salary data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 500 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['#', 'Employee Name', 'Department', 'Salary'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeeRecords.map((employee, index) => (
                    <tr key={employee.id || index} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{employee.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{employee.department}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{employee.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default SalaryReportPage;
