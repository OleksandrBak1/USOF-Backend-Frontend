import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiClient from '../../api/client';
import PostCard from '../../components/common/PostCard/PostCard';
import styles from './Favorites.module.css';

export default function Favorites() {
  const { token, user } = useSelector((state) => state.auth);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .get('/posts/favorites', { params: { limit: 50 } })
      .then((res) => {
        if (isMounted) {
          setFavorites(res.data.data || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load favorite posts.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Guest state: centered prompt with Log In and Sign Up buttons
  if (!token || !user) {
    return (
      <div className={styles.guestContainer}>
        <div className={styles.guestCard}>
          <div className={styles.starIcon}>★</div>
          <h1 className={styles.guestTitle}>Favorite Questions</h1>
          <p className={styles.guestSubtitle}>
            You need to log in or sign up first to view and manage your bookmarked questions.
          </p>

          <div className={styles.buttonGroup}>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/register" className={styles.registerBtn}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Favorite Questions</h1>
          <p className={styles.subtitle}>
            Questions and solutions you have bookmarked for quick reference.
          </p>
        </div>
        <span className={styles.countBadge}>
          Saved: {favorites.length}
        </span>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading saved questions...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : favorites.length === 0 ? (
        <div className={styles.empty}>
          <p>You have no saved questions in Favorites yet.</p>
          <Link to="/" className={styles.browseBtn}>
            Browse Questions Feed
          </Link>
        </div>
      ) : (
        <div className={styles.postsList}>
          {favorites.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

