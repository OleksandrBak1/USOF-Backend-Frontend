import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, setPage, setLimit, setSort, setFilters } from '../../redux/slices/postsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import PostCard from '../../components/common/PostCard/PostCard';
import DatePicker from '../../components/common/DatePicker/DatePicker';
import styles from './Feed.module.css';

export default function Feed() {
  const dispatch = useDispatch();
  const { items, pagination, sort, order, filters, status, error } = useSelector(
    (state) => state.posts
  );
  const { items: categories } = useSelector((state) => state.categories);
  const { role } = useSelector((state) => state.auth);

  // Local state for filter inputs
  const initialCategories = filters.categoryIds || (filters.categoryId ? [filters.categoryId] : []);
  const [localCategories, setLocalCategories] = useState(initialCategories);
  const [localStatus, setLocalStatus] = useState(filters.status || 'active');
  const [localDateFrom, setLocalDateFrom] = useState(filters.dateFrom || '');
  const [localDateTo, setLocalDateTo] = useState(filters.dateTo || '');

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Sync external filters (e.g. from Categories page navigation)
  useEffect(() => {
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      setLocalCategories(filters.categoryIds);
    } else if (filters.categoryId) {
      setLocalCategories([filters.categoryId]);
    } else if (!filters.categoryId && (!filters.categoryIds || filters.categoryIds.length === 0)) {
      setLocalCategories([]);
    }
  }, [filters.categoryId, filters.categoryIds]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Main data fetching
  const loadPosts = useCallback(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      order_by: sort === 'publish_date' ? 'date' : sort,
      order: order,
    };

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      params.category_id = filters.categoryIds.join(',');
    } else if (filters.categoryId) {
      params.category_id = filters.categoryId;
    }

    if (filters.status) params.status = filters.status;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    dispatch(fetchPosts(params));
  }, [dispatch, pagination.page, pagination.limit, sort, order, filters]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSortChange = (newSort, newOrder = 'desc') => {
    dispatch(setSort({ sort: newSort, order: newOrder }));
  };

  const handleSortFieldClick = (field) => {
    if (sort === field) {
      handleSortChange(field, order === 'desc' ? 'asc' : 'desc');
    } else {
      handleSortChange(field, 'desc');
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCategoryDropdownOpen(false);
    dispatch(
      setFilters({
        categoryIds: localCategories,
        categoryId: localCategories.length === 1 ? localCategories[0] : null,
        status: localStatus,
        dateFrom: localDateFrom || null,
        dateTo: localDateTo || null,
      })
    );
  };

  const handleResetFilters = () => {
    setLocalCategories([]);
    setLocalStatus('active');
    setLocalDateFrom('');
    setLocalDateTo('');
    setCategoryDropdownOpen(false);
    dispatch(
      setFilters({
        categoryIds: [],
        categoryId: null,
        status: 'active',
        dateFrom: null,
        dateTo: null,
        search: '',
      })
    );
  };

  const toggleLocalCategory = (catId) => {
    setLocalCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const getSelectedCategoryLabel = () => {
    if (!localCategories || localCategories.length === 0) return 'All Categories';
    const selectedObjs = categories.filter((c) => localCategories.includes(c.id));
    if (selectedObjs.length === 0) return 'All Categories';
    if (selectedObjs.length === 1) return selectedObjs[0].title;
    if (selectedObjs.length === 2) return `${selectedObjs[0].title}, ${selectedObjs[1].title}`;
    return `${selectedObjs[0].title}, ${selectedObjs[1].title} (+${selectedObjs.length - 2})`;
  };

  const filteredPosts = filters.search
    ? items.filter((p) =>
        p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.content.toLowerCase().includes(filters.search.toLowerCase())
      )
    : items;

  return (
    <div className={styles.feedWrapper}>
      {/* Feed Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>All Questions & Posts</h1>
          <p className={styles.pageSubtitle}>
            Found {pagination.total} {pagination.total === 1 ? 'question' : 'questions'}
            <span className={styles.sortSummaryBadge}>
              {sort === 'likes' ? 'Rating' : 'Date'} · {order === 'desc' ? 'Descending ↓' : 'Ascending ↑'}
            </span>
          </p>
        </div>

        {/* Sort Controls (Click to toggle Ascending / Descending) */}
        <div className={styles.sortWrapper}>
          <span className={styles.sortLabel}>Sort:</span>
          <div className={styles.sortGroup}>
            <button
              type="button"
              className={`${styles.sortBtn} ${sort === 'publish_date' ? styles.activeSort : ''}`}
              onClick={() => handleSortFieldClick('publish_date')}
              title={`Sort by Date: currently ${order === 'desc' ? 'Newest first (Descending ↓)' : 'Oldest first (Ascending ↑)'}. Click to switch direction.`}
            >
              Date {sort === 'publish_date' ? (order === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button
              type="button"
              className={`${styles.sortBtn} ${sort === 'likes' ? styles.activeSort : ''}`}
              onClick={() => handleSortFieldClick('likes')}
              title={`Sort by Rating: currently ${order === 'desc' ? 'Highest first (Descending ↓)' : 'Lowest first (Ascending ↑)'}. Click to switch direction.`}
            >
              Rating {sort === 'likes' ? (order === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form className={styles.filterBar} onSubmit={handleApplyFilters}>
        {/* Multi-Category Dropdown */}
        <div
          className={`${styles.filterField} ${styles.filterFieldCategories} ${categoryDropdownOpen ? styles.filterFieldActive : ''}`}
          ref={categoryDropdownRef}
        >
          <label className={styles.filterLabel}>
            Categories {localCategories.length > 0 && `(${localCategories.length})`}
          </label>
          <div className={styles.categoryDropdownWrapper}>
            <button
              type="button"
              className={`${styles.categoryDropdownTrigger} ${categoryDropdownOpen ? styles.dropdownOpen : ''}`}
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            >
              <span className={styles.dropdownLabelText}>
                {getSelectedCategoryLabel()}
              </span>
              <span className={styles.dropdownChevron}>▾</span>
            </button>

            {categoryDropdownOpen && (
              <div className={styles.categoryDropdownMenu}>
                <div className={styles.dropdownActions}>
                  <button
                    type="button"
                    className={styles.clearCategoriesBtn}
                    onClick={() => setLocalCategories([])}
                  >
                    Clear
                  </button>
                </div>
                <div className={styles.categoryOptionsList}>
                  {categories.map((c) => {
                    const checked = localCategories.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`${styles.categoryOptionItem} ${checked ? styles.categoryOptionChecked : ''}`}
                      >
                        <input
                          type="checkbox"
                          className={styles.categoryCheckbox}
                          checked={checked}
                          onChange={() => toggleLocalCategory(c.id)}
                        />
                        <span className={styles.categoryOptionTitle}>{c.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {role === 'admin' && (
          <div className={styles.filterField}>
            <label className={styles.filterLabel} htmlFor="statusFilter">
              Status
            </label>
            <select
              id="statusFilter"
              className={styles.select}
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}

        <div className={`${styles.filterField} ${styles.filterFieldDate}`}>
          <label className={styles.filterLabel} htmlFor="dateFrom">
            From Date
          </label>
          <DatePicker
            id="dateFrom"
            value={localDateFrom}
            onChange={setLocalDateFrom}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className={`${styles.filterField} ${styles.filterFieldDate}`}>
          <label className={styles.filterLabel} htmlFor="dateTo">
            To Date
          </label>
          <DatePicker
            id="dateTo"
            value={localDateTo}
            onChange={setLocalDateTo}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className={styles.filterActions}>
          <button type="submit" className={styles.applyBtn}>
            Apply Filter
          </button>
          <button type="button" className={styles.resetBtn} onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </form>

      {/* Active Search Banner */}
      {filters.search && (
        <div className={styles.searchBanner}>
          <span>Search results for: <strong>"{filters.search}"</strong></span>
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={() => dispatch(setFilters({ search: '' }))}
          >
            × Clear Search
          </button>
        </div>
      )}

      {/* Content Stream */}
      {status === 'loading' && items.length === 0 ? (
        <div className={styles.loadingPlaceholder}>Loading questions...</div>
      ) : error ? (
        <div className={styles.errorBox}>Loading error: {error}</div>
      ) : filteredPosts.length === 0 ? (
        <div className={styles.emptyBox}>
          <h3>No questions found</h3>
          <p>Try adjusting your search filters or ask your own question.</p>
        </div>
      ) : (
        <div className={styles.postsList}>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Page navigation">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${pagination.page === p ? styles.activePage : ''}`}
              onClick={() => dispatch(setPage(p))}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
