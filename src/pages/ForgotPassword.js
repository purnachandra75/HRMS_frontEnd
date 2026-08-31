import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import AuthCard from '../components/auth/AuthCard';
import { AuthField, AuthError, AuthSuccess, AuthSubmitButton, AuthLinkRow } from '../components/auth/AuthFormElements';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      if (response.success) {
        setSubmitted(true);
        setMessage(response.message || 'If that email is registered, a password reset link has been sent.');
      } else {
        setError(response.message || 'Failed to request password reset');
      }
    } catch (err) {
      setError('An error occurred while requesting a password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Forgot Password">
      {submitted ? (
        <AuthSuccess>{message}</AuthSuccess>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter your account email and we'll send you a link to reset your password.
          </p>
          <AuthField
            label="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
          <AuthError>{error}</AuthError>
          <AuthSubmitButton disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</AuthSubmitButton>
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

export default ForgotPassword;
