import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../../api/client';
import { showNotification } from '../../redux/slices/notificationSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import { getAvatarUrl } from '../../utils/avatar';
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal';
import styles from './Admin.module.css';

export default function Admin() {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  // Tabs: 'users' | 'categories' | 'posts'
  const [activeTab, setActiveTab] = useState('users');

  // ================= USERS STATE =================
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    login: '',
    email: '',
    full_name: '',
    password: '',
    password_confirmation: '',
    role: 'user',
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  // ================= CATEGORIES STATE =================
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategory, setNewCategory] = useState({ title: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // ================= POSTS STATE =================
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postStatusFilter, setPostStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [postSearch, setPostSearch] = useState('');

  // ================= CONFIRM DIALOG STATE =================
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    isDanger: true,
    onConfirm: null,
  });

  const openConfirm = ({ title, message, confirmText = 'Delete', isDanger = true, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      isDanger,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // ---------------- LOAD USERS ----------------
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await apiClient.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setUsersLoading(false);
    }
  };

  // ---------------- LOAD CATEGORIES ----------------
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await apiClient.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ---------------- LOAD POSTS ----------------
  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      const params = { limit: 50, order_by: 'date', order: 'desc' };
      if (postStatusFilter !== 'all') {
        params.status = postStatusFilter;
      }
      const res = await apiClient.get('/posts', { params });
      setPosts(res.data.data || []);
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'posts') loadPosts();
  }, [activeTab, postStatusFilter]);

  // ================= USER HANDLERS =================
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUserData.password.length < 12) {
      dispatch(
        showNotification({
          message: 'Password for new user must be at least 12 characters long',
          type: 'error',
        })
      );
      return;
    }
    if (newUserData.password !== newUserData.password_confirmation) {
      dispatch(
        showNotification({ message: 'Password and confirmation do not match', type: 'error' })
      );
      return;
    }

    try {
      setSubmittingUser(true);
      await apiClient.post('/users', newUserData);
      dispatch(showNotification({ message: 'User created successfully!', type: 'success' }));
      setShowCreateUserModal(false);
      setNewUserData({
        login: '',
        email: '',
        full_name: '',
        password: '',
        password_confirmation: '',
        role: 'user',
      });
      loadUsers();
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSubmittingUser(true);
      await apiClient.patch(`/users/${editingUser.id}`, {
        full_name: editingUser.full_name?.trim() || '',
        role: editingUser.role,
      });
      dispatch(
        showNotification({
          message: `User @${editingUser.login} updated successfully!`,
          type: 'success',
        })
      );
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      dispatch(
        showNotification({
          message: 'You cannot delete your own administrator account',
          type: 'error',
        })
      );
      return;
    }

    openConfirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user @${user.login}? This action cannot be undone.`,
      confirmText: 'Delete User',
      isDanger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await apiClient.delete(`/users/${user.id}`);
          dispatch(showNotification({ message: 'User deleted', type: 'info' }));
          loadUsers();
        } catch (err) {
          dispatch(showNotification({ message: err.message, type: 'error' }));
        }
      },
    });
  };

  // ================= CATEGORY HANDLERS =================
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.title.trim()) return;

    try {
      setSubmittingCategory(true);
      await apiClient.post('/categories', {
        title: newCategory.title.trim(),
        description: newCategory.description.trim(),
      });
      dispatch(showNotification({ message: 'Category added successfully!', type: 'success' }));
      setNewCategory({ title: '', description: '' });
      dispatch(fetchCategories());
      loadCategories();
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.title.trim()) return;

    try {
      setSubmittingCategory(true);
      await apiClient.patch(`/categories/${editingCategory.id}`, {
        title: editingCategory.title.trim(),
        description: editingCategory.description?.trim() || '',
      });
      dispatch(showNotification({ message: 'Category updated successfully!', type: 'success' }));
      setEditingCategory(null);
      dispatch(fetchCategories());
      loadCategories();
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = (category) => {
    openConfirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${category.title}"? Associated post category links will be unlinked.`,
      confirmText: 'Delete Category',
      isDanger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await apiClient.delete(`/categories/${category.id}`);
          dispatch(showNotification({ message: 'Category deleted', type: 'info' }));
          dispatch(fetchCategories());
          loadCategories();
        } catch (err) {
          dispatch(showNotification({ message: err.message, type: 'error' }));
        }
      },
    });
  };

  // ================= POST HANDLERS =================
  const handleTogglePostStatus = async (post) => {
    const newStatus = post.status === 'active' ? 'inactive' : 'active';
    try {
      await apiClient.patch(`/posts/${post.id}`, { status: newStatus });
      dispatch(
        showNotification({
          message: `Post #${post.id} status changed to "${newStatus}"!`,
          type: 'success',
        })
      );
      loadPosts();
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    }
  };

  const handleDeletePost = (post) => {
    openConfirm({
      title: 'Delete Post',
      message: `Are you sure you want to delete post #${post.id} "${post.title}"? This action cannot be undone.`,
      confirmText: 'Delete Post',
      isDanger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await apiClient.delete(`/posts/${post.id}`);
          dispatch(showNotification({ message: 'Post deleted', type: 'info' }));
          loadPosts();
        } catch (err) {
          dispatch(showNotification({ message: err.message, type: 'error' }));
        }
      },
    });
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.login.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const filteredCategories = categories.filter((c) => {
    const q = categorySearch.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const filteredPosts = posts.filter((p) => {
    const q = postSearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.author_login && p.author_login.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Central management hub for users, categories structure, and content moderation.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts Moderation ({posts.length})
        </button>
      </div>

      {/* ================= TAB 1: USERS ================= */}
      {activeTab === 'users' && (
        <div className={styles.tabContent}>
          <div className={styles.actionsBar}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search users by login, name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setShowCreateUserModal(true)}
            >
              + Create User
            </button>
          </div>

          {usersLoading ? (
            <div className={styles.loading}>Loading users list...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Rating</th>
                    <th className={styles.hideOnMobile}>Email Status</th>
                    <th className={styles.actionsTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <div className={styles.userCell}>
                          <img
                            src={getAvatarUrl(u.profile_picture, u.login)}
                            alt={u.login}
                            className={styles.userAvatarSmall}
                          />
                          <div>
                            <Link to={`/users/${u.id}`} className={styles.tableLink}>
                              @{u.login}
                            </Link>
                            <div className={styles.userCellName}>{u.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.emailCell}>
                        <div>{u.email || '—'}</div>
                        <div className={styles.mobileEmailBadge}>
                          {u.email_verified ? (
                            <span className={styles.verifiedTag}>Verified</span>
                          ) : (
                            <span className={styles.unverifiedTag}>Unverified</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${
                            u.role === 'admin' ? styles.roleAdmin : styles.roleUser
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={styles.ratingNumber}>
                          {u.rating !== undefined ? u.rating : 0}
                        </span>
                      </td>
                      <td className={styles.hideOnMobile}>
                        {u.email_verified ? (
                          <span className={styles.verifiedTag}>Verified</span>
                        ) : (
                          <span className={styles.unverifiedTag}>Unverified</span>
                        )}
                      </td>
                      <td className={styles.actionsTd}>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={styles.editActionBtn}
                            onClick={() =>
                              setEditingUser({
                                id: u.id,
                                login: u.login,
                                full_name: u.full_name || '',
                                email: u.email || '',
                                role: u.role || 'user',
                              })
                            }
                            title="Edit user details and role"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.deleteActionBtn}
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUser?.id}
                            title="Delete user account"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Create User */}
          {showCreateUserModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h2>Create New User</h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setShowCreateUserModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label>Login *</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={newUserData.login}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, login: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className={styles.modalInput}
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={newUserData.full_name}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, full_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Role *</label>
                    <select
                      className={styles.modalSelect}
                      value={newUserData.role}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, role: e.target.value })
                      }
                    >
                      <option value="user">Standard Developer (user)</option>
                      <option value="admin">Administrator (admin)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Password (min. 12 characters per security policy) *</label>
                    <input
                      type="password"
                      className={styles.modalInput}
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      className={styles.modalInput}
                      value={newUserData.password_confirmation}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          password_confirmation: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setShowCreateUserModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={submittingUser}
                    >
                      {submittingUser ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Edit User */}
          {editingUser && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h2>Edit User @{editingUser.login}</h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setEditingUser(null)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label>Login</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={editingUser.login}
                      disabled
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      className={styles.modalInput}
                      value={editingUser.full_name}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, full_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <select
                      className={styles.modalSelect}
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                      disabled={editingUser.id === currentUser?.id}
                    >
                      <option value="user">Standard Developer (user)</option>
                      <option value="admin">Administrator (admin)</option>
                    </select>
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setEditingUser(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={submittingUser}
                    >
                      {submittingUser ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div className={styles.tabContent}>
          {/* Create Category Form */}
          <div className={styles.createCard}>
            <h2 className={styles.sectionHeading}>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form
              onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
              className={styles.categoryForm}
            >
              <div className={styles.formGroup}>
                <label>Category Title *</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  placeholder="e.g. React"
                  value={editingCategory ? editingCategory.title : newCategory.title}
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({ ...editingCategory, title: e.target.value })
                      : setNewCategory({ ...newCategory, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category Description</label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Brief description of the category topic..."
                  rows="2"
                  value={
                    editingCategory ? editingCategory.description : newCategory.description
                  }
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({ ...editingCategory, description: e.target.value })
                      : setNewCategory({ ...newCategory, description: e.target.value })
                  }
                />
              </div>

              <div className={styles.formButtonsRow}>
                {editingCategory && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setEditingCategory(null)}
                  >
                    Cancel Editing
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={submittingCategory}
                >
                  {submittingCategory
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update Category'
                    : '+ Add Category'}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.actionsBar}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Filter categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </div>

          {categoriesLoading ? (
            <div className={styles.loading}>Loading categories...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th className={styles.actionsTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((c) => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td className={styles.catTitleCell}>{c.title}</td>
                      <td className={styles.catDescCell}>{c.description || '—'}</td>
                      <td className={styles.actionsTd}>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setEditingCategory(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={styles.deleteActionBtn}
                            onClick={() => handleDeleteCategory(c)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: POSTS MODERATION ================= */}
      {activeTab === 'posts' && (
        <div className={styles.tabContent}>
          <div className={styles.postNoticeBanner}>
            <strong>Moderation Rule:</strong> Administrators can activate or deactivate any post or comment to safeguard the community or mark resolved problems, but post and comment content is not editable even for admins (author copyright integrity). Inactive content is hidden from regular users.
          </div>

          <div className={styles.actionsBar}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search posts by title or author..."
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
            />

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status:</label>
              <select
                className={styles.modalSelect}
                value={postStatusFilter}
                onChange={(e) => setPostStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only (hidden)</option>
              </select>
            </div>
          </div>

          {postsLoading ? (
            <div className={styles.loading}>Loading posts...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Question Title</th>
                    <th>Author</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th className={styles.actionsTh}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>
                        <Link to={`/posts/${p.id}`} className={styles.tableLink}>
                          {p.title}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/users/${p.author_id}`} className={styles.tableLink}>
                          @{p.author_login}
                        </Link>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(p.publish_date).toLocaleDateString('en-US')}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            p.status === 'active'
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <span className={styles.ratingNumber}>{p.rating || 0}</span>
                      </td>
                      <td className={styles.actionsTd}>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${
                              p.status === 'active' ? styles.warnBtn : styles.successBtn
                            }`}
                            onClick={() => handleTogglePostStatus(p)}
                          >
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className={styles.deleteActionBtn}
                            onClick={() => handleDeletePost(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}

