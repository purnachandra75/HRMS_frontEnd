import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyOtp, resendOtp } from '../services/authService';
import AuthCard from '../components/auth/AuthCard';
import { AuthField, AuthError, AuthSuccess, AuthSubmitButton, AuthLinkRow } from '../components/auth/AuthFormElements';

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

  // location.state only survives client-side navigation - a page reload (or the browser
  // restoring this URL directly) loses it, so fall back to what Login.js also stashed in
  // sessionStorage rather than bouncing the user straight back to /login in that case.
  let { userId, email } = location.state || {};
  if (!userId) {
    try {
      const stored = JSON.parse(sessionStorage.getItem('pendingOtp') || 'null');
      if (stored?.userId) {
        userId = stored.userId;
        email = stored.email;
      }
    } catch {
      // ignore malformed sessionStorage value
    }
  }

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
        sessionStorage.removeItem('pendingOtp');
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
    <AuthCard
      title="Verify OTP"
      subtitle={
        <>
          Enter the verification code sent to{' '}
          {email ? <strong className="text-foreground">{email}</strong> : 'your registered email'}.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          label="OTP Code"
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
        <AuthError>{error}</AuthError>
        <AuthSuccess>{info}</AuthSuccess>
        <AuthSubmitButton disabled={loading || otp.length === 0}>
          {loading ? 'Verifying...' : 'Verify'}
        </AuthSubmitButton>
      </form>
      <AuthLinkRow>
        {cooldown > 0 ? (
          <span>Resend code in {cooldown}s</span>
        ) : (
          <button
            type="button"
            className="text-primary hover:underline disabled:opacity-60"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Resending...' : 'Resend code'}
          </button>
        )}
      </AuthLinkRow>
      <AuthLinkRow>
        <Link to="/login" className="text-primary hover:underline">
          Back to Login
        </Link>
      </AuthLinkRow>
    </AuthCard>
  );
}

export default VerifyOtp;
