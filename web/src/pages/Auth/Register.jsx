import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../../redux/slices/authSlice';
import { showNotification } from '../../redux/slices/notificationSlice';
import styles from './Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    login: '',
    email: '',
    full_name: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.login.trim()) {
      newErrors.login = 'Login is required (1-50 characters)';
    } else if (formData.login.trim().length > 50) {
      newErrors.login = 'Login cannot exceed 50 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password_confirmation !== formData.password) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      login: formData.login.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      full_name: formData.full_name.trim() || formData.login.trim(),
    };

    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      dispatch(
        showNotification({
          message: 'Registration successful! You can now sign in.',
          type: 'success',
        })
      );
      navigate('/login');
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join the USOF developer community</p>

        {error && <div className={styles.serverAlert}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login">
              Login *
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              className={`${styles.input} ${errors.login ? styles.inputError : ''}`}
              placeholder="developer123"
              value={formData.login}
              onChange={handleChange}
            />
            {errors.login && <span className={styles.errorText}>{errors.login}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="developer@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="full_name">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className={styles.input}
              placeholder="John Doe"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password (min. 8 characters) *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password_confirmation">
              Confirm Password *
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              className={`${styles.input} ${errors.password_confirmation ? styles.inputError : ''}`}
              placeholder="••••••••••••"
              value={formData.password_confirmation}
              onChange={handleChange}
            />
            {errors.password_confirmation && (
              <span className={styles.errorText}>{errors.password_confirmation}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <div>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

