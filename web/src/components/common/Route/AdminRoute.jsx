import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { showNotification } from '../../../redux/slices/notificationSlice';

export default function AdminRoute({ children }) {
  const dispatch = useDispatch();
  const { role, token } = useSelector((state) => state.auth);

  if (!token || role !== 'admin') {
    dispatch(
      showNotification({
        message: 'Access restricted. This section is reserved for administrators only.',
        type: 'error',
      })
    );
    return <Navigate to="/" replace />;
  }

  return children;
}

