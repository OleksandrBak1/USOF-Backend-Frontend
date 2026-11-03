import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span>&lt;</span>USOF<span>/&gt;</span>
            </div>
            <p className={styles.tagline}>
              Developer community platform for sharing technical expertise and solving engineering challenges.
            </p>
          </div>

          <div className={styles.linksGroup}>
            <div className={styles.groupTitle}>EDUCATIONAL PROJECT</div>
            <ul>
              <li>Innovation Campus NTU "KhPI"</li>
              <li>Track: Full Stack Challenge</li>
              <li>Challenge Based Learning (CBL)</li>
            </ul>
          </div>

          <div className={styles.linksGroup}>
            <div className={styles.groupTitle}>TECHNOLOGIES</div>
            <ul>
              <li>Node.js / Express 5</li>
              <li>MySQL 8 (Raw SQL)</li>
              <li>React 18 / Redux Toolkit</li>
              <li>Pure CSS3 / CSS Modules</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p>© {new Date().getFullYear()} USOF. All rights reserved. Created in accordance with course requirements.</p>
        </div>
      </div>
    </footer>
  );
}

