import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../services/authService';
import '../styles/Auth.css';

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyOtp({ onLogin }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = location.state || {};
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!userId && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate('/login', { replace: true });
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!userId) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyOtp(userId, otp);
      if (response.success) {
        onLogin(response.userId, response.role, response.name, response.token);
        navigate(response.role === 'admin' ? '/admin' : '/employee');
      } else {
        setError(response.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('An error occurred while verifying the OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);

    try {
      const response = await resendOtp(userId);
      if (response.success) {
        setInfo(response.message);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred while resending the OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Employee Management System</h1>
        <h2>Verify OTP</h2>
        <p>
          Enter the verification code sent to{' '}
          {email ? <strong>{email}</strong> : 'your registered email'}.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">OTP Code:</label>
            <input
              type="text"
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              maxLength={6}
              placeholder="Enter 6-digit code"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {info && <div className="success-message">{info}</div>}
          <button type="submit" disabled={loading || otp.length === 0} className="submit-btn">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <p className="auth-link">
          {cooldown > 0 ? (
            <span>Resend code in {cooldown}s</span>
          ) : (
            <button type="button" className="link-btn" onClick={handleResend} disabled={resending}>
              {resending ? 'Resending...' : 'Resend code'}
            </button>
          )}
        </p>
        <p className="auth-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyOtp;
