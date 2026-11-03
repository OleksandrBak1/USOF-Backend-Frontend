import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import { setFilters } from '../../redux/slices/postsSlice';
import styles from './Categories.module.css';

export default function Categories() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: categories, status, error } = useSelector((state) => state.categories);
  const { role } = useSelector((state) => state.auth);
  const isAdmin = role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const filteredCategories = categories.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectCategory = (categoryId) => {
    dispatch(setFilters({ categoryId, page: 1 }));
    navigate('/');
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>
            Select a category to filter questions in the feed or explore topics discussed in the USOF community.
          </p>
        </div>

        {isAdmin && (
          <Link to="/admin" className={styles.adminManageBtn}>
            Manage Categories in Admin Panel
          </Link>
        )}
      </div>

      {/* Search Input */}
      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search categories by name or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className={styles.countBadge}>
          Found: {filteredCategories.length}
        </span>
      </div>

      {/* Content */}
      {status === 'loading' && categories.length === 0 ? (
        <div className={styles.loading}>Loading categories...</div>
      ) : error ? (
        <div className={styles.error}>Loading error: {error}</div>
      ) : filteredCategories.length === 0 ? (
        <div className={styles.empty}>
          <p>No categories found matching "{searchTerm}".</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCategories.map((cat) => (
            <div key={cat.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.categoryBadge}>#{cat.id}</span>
                <h2 className={styles.cardTitle}>{cat.title}</h2>
              </div>

              <p className={styles.cardDescription}>
                {cat.description || 'No description provided for this category yet.'}
              </p>

              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.viewPostsBtn}
                  onClick={() => handleSelectCategory(cat.id)}
                >
                  View Questions →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

