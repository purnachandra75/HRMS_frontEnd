import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import VerifyOtp from './pages/VerifyOtp';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeProfile from './pages/EmployeeProfile';
import LeavePage from './pages/LeavePage';
import EmployeeLeaveRequestPage from './pages/EmployeeLeaveRequestPage';
import MonthlyLeaveReportPage from './pages/MonthlyLeaveReportPage';
import SalaryReportPage from './pages/SalaryReportPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AttendancePage from './pages/AttendancePage';
import EmployeeAttendancePage from './pages/EmployeeAttendancePage';
import PfGeneratorPage from './pages/PfGeneratorPage';
import PayrollPage from './pages/PayrollPage';
import PayrollReportPage from './pages/PayrollReportPage';
import AdminHolidaysPage from './pages/AdminHolidaysPage';
import TeamStructurePage from './pages/TeamStructurePage';
import AdminTimesheetsPage from './pages/AdminTimesheetsPage';
import MyTeamPage from './pages/MyTeamPage';
import TimesheetPage from './pages/TimesheetPage';
import EmployeeHolidaysPage from './pages/EmployeeHolidaysPage';
import EssentialsPage from './pages/EssentialsPage';
import OfferLetterForm from './OfferLetterForm';
import ExperienceLetter from './pages/ExperienceLetter';
import RelievingLetter from './pages/RelievingLetter';
import LetterOfIntent from './pages/LetterOfIntent';
import { setUnauthorizedHandler } from './utils/apiClient';
import './App.css';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setUserRole(user.role);
      setUserId(user.id);
      setUserName(user.name);
    }
  }, []);

  const handleLogin = (userId, role, name, token) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserId(userId);
    setUserName(name);
    localStorage.setItem('user', JSON.stringify({ id: userId, role, name, token }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setUserName(null);
    localStorage.removeItem('user');
  };

  // Any API call that comes back 401 (expired/invalid token) drops the user back to /login,
  // instead of leaving the app showing stale data behind a dead session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      handleLogout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    });
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/verify-otp"
            element={
              isAuthenticated ? (
                <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} />
              ) : (
                <VerifyOtp onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} />
              ) : (
                <Register />
              )
            }
          />

          <Route
            path="/forgot-password"
            element={
              isAuthenticated ? (
                <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} />
              ) : (
                <ForgotPassword />
              )
            }
          />

          <Route
            path="/reset-password"
            element={
              isAuthenticated ? (
                <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} />
              ) : (
                <ResetPassword />
              )
            }
          />

          <Route
            path="/admin"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminDashboard userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/leaves"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <LeavePage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/holidays"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminHolidaysPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/attendance"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AttendancePage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/team-structure"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <TeamStructurePage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/timesheets"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminTimesheetsPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/salary-report"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <SalaryReportPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/reports"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <AdminReportsPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/payroll"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <PayrollPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/payroll-report"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <PayrollReportPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/payslip"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <PfGeneratorPage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/essentials"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <EssentialsPage userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/essentials/offer-letter"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <OfferLetterForm userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/essentials/experience-letter"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <ExperienceLetter userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/essentials/relieving-letter"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <RelievingLetter userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/essentials/letter-of-intent"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <LetterOfIntent userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/employee/leaves"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <EmployeeLeaveRequestPage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/my-team"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <MyTeamPage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/timesheet"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <TimesheetPage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/holidays"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <EmployeeHolidaysPage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/leaves/monthly-report"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <MonthlyLeaveReportPage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/attendance"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <EmployeeAttendancePage userId={userId} userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <EmployeeDashboard userName={userName} userId={userId} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/employee/profile"
            element={
              isAuthenticated && userRole === 'employee' ? (
                <EmployeeProfile
                  userId={userId}
                  userName={userName}
                  userRole={userRole}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/employee/new"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <EmployeeProfile
                  userId={userId}
                  userName={userName}
                  userRole={userRole}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/admin/employee/:id"
            element={
              isAuthenticated && userRole === 'admin' ? (
                <EmployeeProfile
                  userId={userId}
                  userName={userName}
                  userRole={userRole}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? (userRole === 'admin' ? '/admin' : '/employee') : '/login'} />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
