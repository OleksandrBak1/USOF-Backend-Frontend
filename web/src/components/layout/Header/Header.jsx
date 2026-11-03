import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../../redux/slices/authSlice';
import { setFilters } from '../../../redux/slices/postsSlice';
import { getAvatarUrl } from '../../../utils/avatar';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token, role } = useSelector((state) => state.auth);
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchInput.trim() }));
    navigate('/');
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const avatarUrl = getAvatarUrl(user?.profile_picture, user?.login);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoPrefix}>&lt;</span>
          USOF
          <span className={styles.logoSuffix}>/&gt;</span>
        </Link>

        {/* Global Search Bar */}
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search questions by keywords..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        {/* User Navigation / Auth Status */}
        <div className={styles.userSection}>
          {token && user ? (
            <div className={styles.profileWrapper}>
              <span className={`${styles.roleBadge} ${role === 'admin' ? styles.adminBadge : styles.userBadge}`}>
                {role === 'admin' ? 'ADMIN' : 'USER'}
              </span>

              <Link to="/profile" className={styles.userProfileLink} title="My Profile">
                <img
                  src={avatarUrl}
                  alt={user.login || 'User avatar'}
                  className={styles.avatarImage}
                  onError={(e) => {
                    e.target.src = getAvatarUrl(null, user.login);
                  }}
                />
                <span className={styles.userName}>{user.login || user.full_name}</span>
              </Link>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
                title="Log out of account"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className={styles.guestWrapper}>
              <span className={`${styles.roleBadge} ${styles.guestBadge}`}>GUEST</span>
              <div className={styles.defaultAvatar} title="Guest">?</div>
              <Link to="/login" className={styles.loginBtn}>
                Log In
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
