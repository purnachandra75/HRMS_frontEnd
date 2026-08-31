import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import AuthCard from '../components/auth/AuthCard';
import { AuthField, AuthError, AuthSuccess, AuthSubmitButton, AuthLinkRow } from '../components/auth/AuthFormElements';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset Password">
      {success ? (
        <AuthSuccess>Password reset successfully. Redirecting to login...</AuthSuccess>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!token && (
            <AuthError>
              This link is missing a reset token. Please use the link from your email, or request a new one.
            </AuthError>
          )}
          <AuthField
            label="New Password"
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
          <AuthField
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
          <AuthError>{error}</AuthError>
          <AuthSubmitButton disabled={loading || !token}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </AuthSubmitButton>
        </form>
      )}
      <AuthLinkRow>
        <Link to="/login" className="text-primary hover:underline">
          Back to Login
        </Link>
      </AuthLinkRow>
    </AuthCard>
  );
}

export default ResetPassword;
