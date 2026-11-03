import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAvatarUrl } from '../../../utils/avatar';
import { getMediaUrl } from '../../../utils/media';
import { renderMarkdown } from '../../../utils/markdown';
import styles from './PostCard.module.css';

export default function PostCard({ post }) {
  const { user: currentUser } = useSelector((state) => state.auth);
  if (!post) return null;

  const isOwnQuestion = Boolean(
    currentUser && (currentUser.id === post.author_id || currentUser.login === post.author_login)
  );

  const rating = post.rating !== undefined
    ? post.rating
    : (post.likes_count || 0) - (post.dislikes_count || 0);

  const formattedDate = post.publish_date
    ? new Date(post.publish_date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const avatarUrl = getAvatarUrl(post.author_avatar, post.author_login);

  return (
    <article
      className={`${styles.card} ${post.status === 'inactive' ? styles.inactiveCard : ''} ${
        isOwnQuestion ? styles.ownCard : ''
      }`}
    >
      {/* Side: Rating & Answers Column */}
      <div className={styles.statsColumn}>
        <div className={`${styles.ratingBadge} ${rating > 0 ? styles.positiveRating : rating < 0 ? styles.negativeRating : styles.neutralRating}`}>
          <span className={styles.ratingNumber}>{rating > 0 ? `+${rating}` : rating}</span>
          <span className={styles.ratingLabel}>rating</span>
        </div>

        <div
          className={`${styles.answersBadge} ${
            post.has_solution
              ? styles.answersSolved
              : (post.comments_count || 0) > 0
              ? styles.answersPresent
              : styles.answersEmpty
          }`}
          title={
            post.has_solution
              ? `Solved: ${post.comments_count || 0} total answers with accepted solution`
              : `${post.comments_count || 0} answers`
          }
        >
          <span className={styles.answersNumber}>
            {post.has_solution ? `✓ ${post.comments_count || 0}` : (post.comments_count || 0)}
          </span>
          <span className={styles.answersLabel}>
            {post.has_solution ? 'solved' : (post.comments_count === 1 ? 'answer' : 'answers')}
          </span>
        </div>

        {post.status === 'inactive' && (
          <span className={styles.statusInactiveBadge}>Inactive</span>
        )}
      </div>

      {/* Main Body */}
      <div className={styles.contentColumn}>
        <div className={styles.titleHeaderRow}>
          <h2 className={styles.title}>
            <Link to={`/posts/${post.id}`} className={styles.titleLink}>
              {post.title}
            </Link>
          </h2>
          {isOwnQuestion && (
            <span className={styles.yourQuestionBadge} title="You asked this question">
              ★ Your Question
            </span>
          )}
        </div>

        <div
          className={styles.previewText}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {post.picture && (
          <div className={styles.pictureThumbnailWrapper}>
            <Link
              to={`/posts/${post.id}`}
              className={styles.thumbnailLink}
              title="View full image in question"
            >
              <div className={styles.thumbnailFrame}>
                <img
                  src={getMediaUrl(post.picture)}
                  alt={post.title}
                  className={styles.pictureThumbnail}
                  onError={(e) => {
                    const wrap = e.target.closest(`.${styles.pictureThumbnailWrapper}`);
                    if (wrap) wrap.style.display = 'none';
                  }}
                />
                <span className={styles.thumbnailOverlay}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Attached Image
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Footer: Tags & Author Metadata */}
        <div className={styles.cardFooter}>
          <div className={styles.tagsGroup}>
            {post.categories && post.categories.length > 0 ? (
              post.categories.map((cat) => (
                <span key={cat.id || cat} className={styles.tagBadge}>
                  {cat.title || cat.name || `Category #${cat.id || cat}`}
                </span>
              ))
            ) : (
              <span className={styles.tagMuted}>No category</span>
            )}
          </div>

          <div className={styles.metaRight}>
            {post.has_solution && (
              <span className={styles.solvedPill} title="This question has an accepted solution">
                ✓ Accepted
              </span>
            )}
            <div className={styles.authorMeta}>
              <img
                src={avatarUrl}
                alt={post.author_login}
                className={styles.authorAvatar}
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, post.author_login);
                }}
              />
              <Link to={`/users/${post.author_id}`} className={styles.authorName}>
                {post.author_login || 'Anonymous'}
              </Link>
              <span className={styles.dateText}>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
