import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideNotification } from '../../../redux/slices/notificationSlice';
import styles from './Notification.module.css';

export default function Notification() {
  const dispatch = useDispatch();
  const { message, type, visible } = useSelector((state) => state.notification);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dispatch(hideNotification());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible || !message) return null;

  const displayMessage =
    typeof message === 'string'
      ? message
      : message?.message || String(message || '');

  return (
    <div className={`${styles.toast} ${styles[type] || styles.info}`}>
      <div className={styles.content}>
        <span className={styles.typeBadge}>
          {type === 'error' ? 'ERROR' : type === 'success' ? 'SUCCESS' : 'INFO'}
        </span>
        <span className={styles.messageText}>{displayMessage}</span>
      </div>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => dispatch(hideNotification())}
      >
        ×
      </button>
    </div>
  );
}

