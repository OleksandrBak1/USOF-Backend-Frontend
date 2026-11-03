import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import apiClient from '../../api/client';
import { showNotification } from '../../redux/slices/notificationSlice';
import styles from './Auth.module.css';

export default function PasswordReset() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setServerError('Please enter your email address');
      return;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      setServerError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setServerError('');
      const response = await apiClient.post('/auth/password-reset', { email: email.trim().toLowerCase() });
      setSuccessMessage(response.data.message || 'Password reset instructions have been sent to your email.');
      dispatch(showNotification({ message: 'Password reset email sent!', type: 'success' }));
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setServerError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setServerError('');
      const response = await apiClient.post(`/auth/password-reset/${token}`, { password: newPassword });
      dispatch(
        showNotification({
          message: response.data.message || 'Password updated successfully! You can now log in.',
          type: 'success',
        })
      );
      navigate('/login');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>
          {token ? 'Set New Password' : 'Reset Password'}
        </h1>
        <p className={styles.subtitle}>
          {token
            ? 'Enter a new secure password for your account'
            : 'Enter your email and we will send you a link to reset your password'}
        </p>

        {serverError && <div className={styles.serverAlert}>{serverError}</div>}
        {successMessage && <div className={styles.serverAlert} style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>{successMessage}</div>}

        {token ? (
          <form className={styles.form} onSubmit={handleConfirmSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="newPassword">
                New Password (min. 8 characters)
              </label>
              <input
                id="newPassword"
                type="password"
                className={styles.input}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRequestSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                Your Email Address
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className={styles.footerLinks}>
          <Link to="/login" className={styles.link}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

