import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { user, token, role } = useSelector((state) => state.auth);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {token && (
          <div className={styles.actionWrapper}>
            <NavLink to="/posts/create" className={styles.createPostBtn}>
              + Ask Question
            </NavLink>
          </div>
        )}

        <div className={styles.sectionTitle}>NAVIGATION</div>
        <ul className={styles.navList}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Questions Feed
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Categories
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Favorites
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Top Users
            </NavLink>
          </li>
        </ul>

        {role === 'admin' && (
          <div className={styles.adminSection}>
            <div className={styles.sectionTitle}>ADMINISTRATION</div>
            <ul className={styles.navList}>
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.active} ${styles.adminLink}` : `${styles.navLink} ${styles.adminLink}`
                  }
                >
                  Admin Panel
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}

