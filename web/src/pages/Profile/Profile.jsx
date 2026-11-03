 import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import apiClient from '../../api/client';
import { updateUserProfile, uploadUserAvatar, fetchCurrentUser } from '../../redux/slices/authSlice';
import { showNotification } from '../../redux/slices/notificationSlice';
import PostCard from '../../components/common/PostCard/PostCard';
import { getAvatarUrl } from '../../utils/avatar';
import styles from './Profile.module.css';

export default function Profile({ initialTab = 'posts' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { user: currentUser, token, role } = useSelector((state) => state.auth);

  // If no :id in URL, view own profile
  const targetUserId = id ? Number(id) : currentUser?.id;
  const isOwner = currentUser && targetUserId === currentUser.id;
  const isAdmin = role === 'admin';
  const canEdit = isOwner || isAdmin;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: 'posts' | 'favorites' | 'edit' | 'password'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // User posts
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Fetch target user profile
  useEffect(() => {
    if (!targetUserId) {
      if (!token) {
        navigate('/login');
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/users/${targetUserId}`)
      .then((res) => {
        if (isMounted) {
          setProfileData(res.data);
          setEditFullName(res.data.full_name || '');
          setEditEmail(res.data.email || '');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load user profile data.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUserId, token, navigate]);

  // Fetch posts by this author
  useEffect(() => {
    if (!targetUserId) return;

    let isMounted = true;
    setPostsLoading(true);

    apiClient
      .get('/posts', {
        params: {
          author_id: targetUserId,
          limit: 30,
          order_by: 'date',
          order: 'desc',
        },
      })
      .then((res) => {
        if (isMounted) {
          setPosts(res.data.data || []);
        }
      })
      .catch(() => {
        if (isMounted) setPosts([]);
      })
      .finally(() => {
        if (isMounted) setPostsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

  // Fetch favorites if owner viewing own profile
  useEffect(() => {
    if (!isOwner || !token) return;

    let isMounted = true;
    setFavoritesLoading(true);

    apiClient
      .get('/posts/favorites', { params: { limit: 30 } })
      .then((res) => {
        if (isMounted) {
          setFavorites(res.data.data || []);
        }
      })
      .catch(() => {
        if (isMounted) setFavorites([]);
      })
      .finally(() => {
        if (isMounted) setFavoritesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOwner, token]);

  // Handle Avatar File Upload
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      dispatch(
        showNotification({
          message: 'Allowed image formats: PNG, JPG, JPEG, WEBP only.',
          type: 'error',
        })
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      dispatch(
        showNotification({
          message: 'Image file size must not exceed 5 MB.',
          type: 'error',
        })
      );
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploadingAvatar(true);
      const updatedUser = await dispatch(uploadUserAvatar(formData)).unwrap();
      const newPic = updatedUser.profile_picture || updatedUser.avatar_url;
      setProfileData((prev) => ({
        ...prev,
        profile_picture: newPic,
      }));
      if (currentUser?.id) {
        dispatch(fetchCurrentUser(currentUser.id));
      }
      dispatch(
        showNotification({
          message: 'Avatar updated successfully!',
          type: 'success',
        })
      );
    } catch (err) {
      dispatch(
        showNotification({
          message: (err && err.message) || String(err) || 'Failed to update avatar',
          type: 'error',
        })
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Edit Profile Information
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      dispatch(showNotification({ message: 'Please enter your full name', type: 'error' }));
      return;
    }

    try {
      setIsSavingProfile(true);
      const changes = {
        full_name: editFullName.trim(),
      };
      if (editEmail.trim() && editEmail.trim() !== profileData.email) {
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editEmail.trim())) {
          dispatch(showNotification({ message: 'Please enter a valid email address', type: 'error' }));
          return;
        }
        changes.email = editEmail.trim();
      }

      const updated = await dispatch(
        updateUserProfile({ userId: targetUserId, data: changes })
      ).unwrap();

      setProfileData((prev) => ({
        ...prev,
        ...updated,
      }));

      dispatch(
        showNotification({
          message: 'Profile details saved successfully!',
          type: 'success',
        })
      );
    } catch (err) {
      dispatch(
        showNotification({
          message: err || 'Error updating profile',
          type: 'error',
        })
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      dispatch(
        showNotification({
          message: 'Please enter your current password',
          type: 'error',
        })
      );
      return;
    }
    if (newPassword.length < 6) {
      dispatch(
        showNotification({
          message: 'New password must be at least 6 characters long',
          type: 'error',
        })
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(
        showNotification({
          message: 'New password and confirmation do not match',
          type: 'error',
        })
      );
      return;
    }
    if (newPassword === currentPassword) {
      dispatch(
        showNotification({
          message: 'New password must be different from current password',
          type: 'error',
        })
      );
      return;
    }

    try {
      setIsSavingPassword(true);
      await apiClient.patch(`/users/${targetUserId}`, {
        old_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      dispatch(
        showNotification({
          message: 'Password updated successfully!',
          type: 'success',
        })
      );
      setActiveTab('posts');
    } catch (err) {
      dispatch(
        showNotification({
          message: err.message || 'Failed to update password',
          type: 'error',
        })
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading user profile...</div>;
  }

  if (error || !profileData) {
    return (
      <div className={styles.errorContainer}>
        <h2>User not found</h2>
        <p>{error || 'This account does not exist or has been deleted.'}</p>
        <Link to="/" className={styles.backLink}>← Back to main feed</Link>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(profileData.profile_picture, profileData.login);
  const rating = profileData.rating !== undefined ? profileData.rating : 0;

  return (
    <div className={styles.profileContainer}>
      {/* Profile Card Header */}
      <div className={styles.profileCard}>
        <div className={styles.avatarWrapper}>
          <img
            src={avatarUrl}
            alt={profileData.login}
            className={styles.avatar}
            onError={(e) => {
              e.target.src = getAvatarUrl(null, profileData.login);
            }}
          />
          {isOwner && (
            <>
              <button
                type="button"
                className={styles.changeAvatarBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Change profile picture"
              >
                {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleAvatarFileSelect}
              />
            </>
          )}
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.fullName}>{profileData.full_name || profileData.login}</h1>
            <span
              className={`${styles.roleBadge} ${
                profileData.role === 'admin' ? styles.adminBadge : styles.userBadge
              }`}
            >
              {profileData.role === 'admin' ? 'ADMINISTRATOR' : 'DEVELOPER'}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.usernameTag}>@{profileData.login}</span>
            <span
              className={`${styles.ratingBadge} ${
                rating > 0 ? styles.scorePositive : rating < 0 ? styles.scoreNegative : ''
              }`}
            >
              Rating: {rating > 0 ? `+${rating}` : rating}
            </span>
          </div>

          {/* Email for owner or admin */}
          {profileData.email && (
            <div className={styles.contactRow}>
              <span className={styles.emailLabel}>Email:</span>
              <span className={styles.emailValue}>{profileData.email}</span>
              {profileData.email_verified ? (
                <span className={styles.verifiedBadge} title="Email verified">
                  ✓ Verified
                </span>
              ) : (
                <span className={styles.unverifiedBadge} title="Email pending verification">
                  Pending verification
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          {isOwner ? 'My Questions' : 'Questions'} ({posts.length})
        </button>

        {isOwner && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites ({favorites.length})
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'edit' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit Profile
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'password' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Security & Password
          </button>
        )}
      </div>

      {/* Tab 1: Posts */}
      {activeTab === 'posts' && (
        <div className={styles.tabContent}>
          {postsLoading ? (
            <div className={styles.loadingTab}>Loading questions...</div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyNotice}>
              <p>
                {isOwner
                  ? 'You have not posted any questions yet.'
                  : 'This user has not posted any questions yet.'}
              </p>
              {isOwner && (
                <Link to="/posts/create" className={styles.createBtn}>
                  + Ask your first question
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.postsList}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorites (Owner only) */}
      {activeTab === 'favorites' && isOwner && (
        <div className={styles.tabContent}>
          {favoritesLoading ? (
            <div className={styles.loadingTab}>Loading saved questions...</div>
          ) : favorites.length === 0 ? (
            <div className={styles.emptyNotice}>
              <p>You have no saved questions in Favorites yet.</p>
              <Link to="/" className={styles.createBtn}>
                Browse questions feed
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
      )}

      {/* Tab 3: Edit Profile */}
      {activeTab === 'edit' && canEdit && (
        <div className={styles.tabContent}>
          <form className={styles.formCard} onSubmit={handleProfileUpdate}>
            <h2 className={styles.formTitle}>Personal Information</h2>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profileFullName">
                Full Name
              </label>
              <input
                id="profileFullName"
                type="text"
                className={styles.input}
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profileEmail">
                Email Address
              </label>
              <input
                id="profileEmail"
                type="email"
                className={styles.input}
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="developer@example.com"
                required
              />
              <span className={styles.formHint}>
                Note: changing your email address will require re-verification via an activation link.
              </span>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'password' && canEdit && (
        <div className={styles.tabContent}>
          <form className={styles.formCard} onSubmit={handlePasswordUpdate}>
            <h2 className={styles.formTitle}>Change Account Password</h2>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="currentPasswordField">
                Current Password
              </label>
              <input
                id="currentPasswordField"
                type="password"
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="newPasswordField">
                New Password (minimum 6 characters)
              </label>
              <input
                id="newPasswordField"
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirmPasswordField">
                Confirm New Password
              </label>
              <input
                id="confirmPasswordField"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSavingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
