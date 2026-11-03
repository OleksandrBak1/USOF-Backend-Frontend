import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import styles from './Auth.module.css';

export default function ConfirmEmail() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      try {
        const response = await apiClient.get(`/auth/verify-email/${token}`);
        if (isMounted) {
          setSuccess(true);
          setMessage(response.data.message || 'Email successfully verified!');
        }
      } catch (err) {
        if (isMounted) {
          setSuccess(false);
          setMessage(err.message || 'Invalid or expired verification token.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      verify();
    } else {
      setLoading(false);
      setMessage('Verification token is missing.');
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Email Verification</h1>
        <p className={styles.subtitle}>
          {loading
            ? 'Verifying account activation token...'
            : success
            ? 'Your account has been successfully verified!'
            : 'Activation error'}
        </p>

        {!loading && (
          <div
            className={styles.serverAlert}
            style={{
              backgroundColor: success ? 'var(--color-success-light)' : 'var(--color-danger-light)',
              color: success ? 'var(--color-success)' : 'var(--color-danger)',
              borderColor: success ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {message}
          </div>
        )}

        <div className={styles.footerLinks} style={{ marginTop: '2rem' }}>
          <Link to="/login" className={styles.submitBtn} style={{ textAlign: 'center', textDecoration: 'none' }}>
            Proceed to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

