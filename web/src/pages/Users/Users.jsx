import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiClient from '../../api/client';
import { getAvatarUrl } from '../../utils/avatar';
import styles from './Users.module.css';

const TIMEFRAMES = [
  { key: 'all', label: 'All Time' },
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
];

export default function Users() {
  const { user: currentUser, role, token } = useSelector((state) => state.auth);
  const isAdmin = role === 'admin';

  const [timeframe, setTimeframe] = useState('all');
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadTopUsers() {
      try {
        let dateFrom = null;
        const now = Date.now();

        if (timeframe === 'day') {
          dateFrom = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (timeframe === 'week') {
          dateFrom = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (timeframe === 'month') {
          dateFrom = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (timeframe === 'year') {
          dateFrom = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }

        if (isAdmin && token && timeframe === 'all') {
          const response = await apiClient.get('/users');
          if (isMounted) {
            const rawUsers = response.data || [];
            const sorted = [...rawUsers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            setUsersList(sorted.slice(0, 50));
          }
        } else {
          // Fetch questions to aggregate top contributors
          const params = { limit: 50, order_by: 'likes', order: 'desc' };
          if (dateFrom) {
            params.date_from = dateFrom;
          }

          const response = await apiClient.get('/posts', { params });
          const posts = response.data.data || [];
          const authorsMap = new Map();

          posts.forEach((p) => {
            if (!p.author_id) return;
            if (!authorsMap.has(p.author_id)) {
              authorsMap.set(p.author_id, {
                id: p.author_id,
                login: p.author_login,
                full_name: p.author_full_name,
                profile_picture: p.author_avatar,
                rating: p.author_rating !== undefined ? p.author_rating : 0,
                periodScore: (p.likes_count || 0) - (p.dislikes_count || 0),
                postsCount: 1,
                role: 'user',
              });
            } else {
              const existing = authorsMap.get(p.author_id);
              existing.periodScore += (p.likes_count || 0) - (p.dislikes_count || 0);
              existing.postsCount += 1;
            }
          });

          // Include current user if all time and logged in
          if (timeframe === 'all' && currentUser && !authorsMap.has(currentUser.id)) {
            authorsMap.set(currentUser.id, {
              id: currentUser.id,
              login: currentUser.login,
              full_name: currentUser.full_name,
              profile_picture: currentUser.profile_picture,
              rating: currentUser.rating || 0,
              periodScore: 0,
              postsCount: 0,
              role: currentUser.role || 'user',
            });
          }

          const aggregated = Array.from(authorsMap.values());
          const sorted = aggregated.sort((a, b) => {
            if (timeframe === 'all') {
              return (b.rating || 0) - (a.rating || 0);
            }
            return (b.periodScore || 0) - (a.periodScore || 0) || (b.rating || 0) - (a.rating || 0);
          });

          if (isMounted) {
            setUsersList(sorted.slice(0, 50));
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load top users list.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTopUsers();

    return () => {
      isMounted = false;
    };
  }, [timeframe, isAdmin, token, currentUser]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        (u.login && u.login.toLowerCase().includes(q)) ||
        (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  }, [usersList, search]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Top Users</h1>
          <p className={styles.subtitle}>
            Top 50 developers and contributors ranked by reputation and community activity.
          </p>
        </div>

        {isAdmin && (
          <Link to="/admin" className={styles.adminLink}>
            Manage Users in Admin Panel
          </Link>
        )}
      </div>

      {/* Timeframe Filter Tabs */}
      <div className={styles.timeTabs}>
        {TIMEFRAMES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.timeTabBtn} ${timeframe === t.key ? styles.activeTimeTab : ''}`}
            onClick={() => setTimeframe(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Filter top users by login or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.countBadge}>
          Top Developers: {filteredUsers.length} of {Math.min(50, usersList.length)}
        </span>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className={styles.loading}>Loading top developers...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {search
              ? `No top developers found matching "${search}".`
              : 'No active contributors recorded for this time period.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredUsers.map((u, index) => {
            const avatarUrl = getAvatarUrl(u.profile_picture, u.login);
            const userRating = u.rating !== undefined ? u.rating : 0;
            const rank = index + 1;

            const rankClass =
              rank === 1
                ? styles.rankGold
                : rank === 2
                ? styles.rankSilver
                : rank === 3
                ? styles.rankBronze
                : '';

            return (
              <div key={u.id} className={styles.userCard}>
                <span className={`${styles.rankBadge} ${rankClass}`}>
                  #{rank}
                </span>

                <img
                  src={avatarUrl}
                  alt={u.login}
                  className={styles.avatar}
                  onError={(e) => {
                    e.target.src = getAvatarUrl(null, u.login);
                  }}
                />

                <div className={styles.cardInfo}>
                  <Link to={`/users/${u.id}`} className={styles.userLogin}>
                    @{u.login}
                  </Link>
                  <span className={styles.userFullName}>
                    {u.full_name || u.login}
                  </span>

                  <div className={styles.badgesRow}>
                    <span
                      className={`${styles.ratingBadge} ${
                        userRating > 0
                          ? styles.scorePositive
                          : userRating < 0
                          ? styles.scoreNegative
                          : ''
                      }`}
                    >
                      Rating: {userRating > 0 ? `+${userRating}` : userRating}
                    </span>

                    {u.role === 'admin' && (
                      <span className={styles.adminBadge}>ADMIN</span>
                    )}
                  </div>
                </div>

                <Link to={`/users/${u.id}`} className={styles.profileBtn}>
                  View Profile
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
