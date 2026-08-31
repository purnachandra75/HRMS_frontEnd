import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import AuthCard from '../components/auth/AuthCard';
import { AuthField, AuthError, AuthSubmitButton, AuthLinkRow } from '../components/auth/AuthFormElements';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      if (response.success && response.otpRequired) {
        // Also stashed in sessionStorage: react-router's location.state only lives in memory,
        // so a page reload right after this navigate (or the browser restoring the /verify-otp
        // URL directly) would otherwise lose which login this OTP belongs to and bounce the
        // user straight back to /login.
        sessionStorage.setItem('pendingOtp', JSON.stringify({ userId: response.userId, email: response.email }));
        navigate('/verify-otp', { state: { userId: response.userId, email: response.email } });
      } else if (response.success) {
        onLogin(response.userId, response.role, response.name, response.token);
        navigate(response.role === 'admin' ? '/admin' : '/employee');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Login">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
        <AuthField
          label="Password"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />
        <AuthError>{error}</AuthError>
        <AuthSubmitButton disabled={loading}>{loading ? 'Logging in...' : 'Login'}</AuthSubmitButton>
      </form>
      <AuthLinkRow>
        <Link to="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </AuthLinkRow>
    </AuthCard>
  );
}

export default Login;
