import React from 'react';
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import Footer from './Footer/Footer';
import Notification from '../common/Notification/Notification';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.layoutWrapper}>
      <Header />
      <div className={styles.mainContainer}>
        <Sidebar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <Footer />
      <Notification />
    </div>
  );
}

