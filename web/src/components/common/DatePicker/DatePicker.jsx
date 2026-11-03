import React, { useState, useEffect, useRef } from 'react';
import styles from './DatePicker.module.css';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const pad = (n) => String(n).padStart(2, '0');

export default function DatePicker({
  id,
  value = '',
  onChange,
  placeholder = 'YYYY-MM-DD',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse view date from value or fallback to today
  const [viewDate, setViewDate] = useState(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [value]);

  // Click outside and ESC listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day) => {
    const formatted = `${year}-${pad(month + 1)}-${pad(day)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleToday = (e) => {
    e.preventDefault();
    const now = new Date();
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    onChange(formatted);
    setViewDate(now);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.preventDefault();
    onChange('');
    setIsOpen(false);
  };

  // Calendar days calculation (Monday as start of week)
  const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Trailing days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      dateString: `${year}-${pad(month + 1)}-${pad(d)}`,
    });
  }

  // Leading days of next month to complete the row
  const remaining = 7 - (calendarDays.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: false,
      });
    }
  }

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  })();

  return (
    <div
      className={`${styles.container} ${isOpen ? styles.containerOpen : ''}`}
      ref={containerRef}
    >
      <div className={styles.inputWrapper}>
        <input
          id={id}
          type="text"
          className={`${styles.input} ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={() => setIsOpen((prev) => !prev)}
        />
        <button
          type="button"
          className={styles.calendarIconBtn}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Open calendar"
          tabIndex={-1}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              &larr;
            </button>
            <span className={styles.monthLabel}>
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              &rarr;
            </button>
          </div>

          <div className={styles.weekdays}>
            {DAYS_OF_WEEK.map((w) => (
              <span key={w} className={styles.weekday}>
                {w}
              </span>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              if (!item.isCurrentMonth) {
                return (
                  <span key={`pad-${idx}`} className={styles.paddingDay}>
                    {item.day}
                  </span>
                );
              }

              const isSelected = value === item.dateString;
              const isToday = todayStr === item.dateString;

              return (
                <button
                  key={item.dateString}
                  type="button"
                  className={`${styles.dayBtn} ${
                    isSelected ? styles.selectedDay : ''
                  } ${isToday ? styles.today : ''}`}
                  onClick={() => handleSelectDay(item.day)}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.footerBtn} onClick={handleToday}>
              Today
            </button>
            {value && (
              <button type="button" className={styles.footerBtn} onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

