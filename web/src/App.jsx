import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './redux/slices/authSlice';
import Layout from './components/layout/Layout';
import Feed from './pages/Feed/Feed';
import PostDetails from './pages/PostDetails/PostDetails';
import CreatePost from './pages/CreatePost/CreatePost';
import Profile from './pages/Profile/Profile';
import Favorites from './pages/Favorites/Favorites';
import Categories from './pages/Categories/Categories';
import Users from './pages/Users/Users';
import Admin from './pages/Admin/Admin';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PasswordReset from './pages/Auth/PasswordReset';
import ConfirmEmail from './pages/Auth/ConfirmEmail';
import ProtectedRoute from './components/common/Route/ProtectedRoute';
import AdminRoute from './components/common/Route/AdminRoute';

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user?.id) {
      dispatch(fetchCurrentUser(user.id));
    }
  }, [dispatch, token, user?.id]);

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Feed />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/users" element={<Users />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/password-reset/:token" element={<PasswordReset />} />
        <Route path="/api/auth/password-reset/:token" element={<PasswordReset />} />
        <Route path="/auth/verify-email/:token" element={<ConfirmEmail />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
        <Route path="/posts/:id" element={<PostDetails />} />
        <Route path="/users/:id" element={<Profile />} />

        {/* Protected User Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/create"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id/edit"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        {/* Fallback 404 */}
        <Route
          path="*"
          element={
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <h2>404 — Page Not Found</h2>
              <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                The requested page does not exist or has been moved.
              </p>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}
