import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../redux/slices/authSlice';
import { showNotification } from '../../redux/slices/notificationSlice';
import styles from './Auth.module.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.login.trim()) {
      newErrors.login = 'Login is required (1-50 characters)';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
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

    const result = await dispatch(
      loginUser({
        login: formData.login.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      dispatch(
        showNotification({
          message: `Welcome back, ${result.payload.user.login}! Logged in successfully.`,
          type: 'success',
        })
      );
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Sign in to USOF</h1>
        <p className={styles.subtitle}>Log in to your developer account</p>

        {error && <div className={styles.serverAlert}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login">
              Login
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              className={`${styles.input} ${errors.login ? styles.inputError : ''}`}
              placeholder="usof_seed_user_1"
              value={formData.login}
              onChange={handleChange}
            />
            {errors.login && <span className={styles.errorText}>{errors.login}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="user@example.test"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <div>
            Forgot your password?{' '}
            <Link to="/password-reset" className={styles.link}>
              Reset
            </Link>
          </div>
          <div>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

