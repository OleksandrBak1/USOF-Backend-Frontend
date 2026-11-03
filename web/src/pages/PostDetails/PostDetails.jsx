import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../../api/client';
import {
  fetchPostById,
  votePost,
  deletePost,
  updatePost,
  toggleFavorite,
  toggleSubscription,
} from '../../redux/slices/postsSlice';
import { fetchPostComments, createComment } from '../../redux/slices/commentsSlice';
import { showNotification } from '../../redux/slices/notificationSlice';
import CommentItem from '../../components/common/CommentItem/CommentItem';
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal';
import { getAvatarUrl } from '../../utils/avatar';
import { getMediaUrl } from '../../utils/media';
import { renderMarkdown } from '../../utils/markdown';
import styles from './PostDetails.module.css';

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentPost, status: postStatus, error: postError } = useSelector((state) => state.posts);
  const { items: comments, status: commentsStatus } = useSelector((state) => state.comments);
  const { user, token, role } = useSelector((state) => state.auth);

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userReaction, setUserReaction] = useState(null); // 'like' | 'dislike' | null
  const [commentSortBy, setCommentSortBy] = useState('likes'); // 'likes' | 'date'
  const [commentSortOrder, setCommentSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPostById(id));
    dispatch(fetchPostComments(id));

    if (token && id) {
      // Check current user reaction on this post
      apiClient
        .get(`/posts/${id}/like`)
        .then((res) => {
          const found = (res.data || []).find((l) => l.author_id === user?.id);
          setUserReaction(found ? found.type : null);
        })
        .catch(() => {});

      // Check favorites
      apiClient
        .get('/posts/favorites')
        .then((res) => {
          const isFav = (res.data || []).some((p) => p.id === Number(id));
          setIsFavorite(isFav);
        })
        .catch(() => {});

      // Check subscription
      apiClient
        .get(`/posts/${id}/subscribers`)
        .then((res) => {
          const isSub = (res.data || []).some((sub) => (sub.user_id || sub.id) === user?.id);
          setIsSubscribed(isSub);
        })
        .catch(() => {});
    }
  }, [dispatch, id, token, user?.id]);

  const isAuthor = user && currentPost && user.id === currentPost.author_id;
  const isAdmin = role === 'admin';

  const handleVote = async (type) => {
    if (!token) {
      dispatch(showNotification({ message: 'Please log in to vote', type: 'error' }));
      return;
    }

    try {
      if (userReaction === type) {
        // Toggle off: cancel current reaction on repeated click
        await dispatch(votePost({ postId: id, type: 'remove' })).unwrap();
        setUserReaction(null);
        dispatch(showNotification({ message: 'Vote removed', type: 'info' }));
      } else {
        // New reaction or switch between like/dislike
        await dispatch(votePost({ postId: id, type })).unwrap();
        setUserReaction(type);
        dispatch(
          showNotification({
            message: type === 'like' ? 'You upvoted this question!' : 'You downvoted this question',
            type: 'success',
          })
        );
      }
    } catch (err) {
      dispatch(showNotification({ message: err || 'Error saving reaction', type: 'error' }));
    }
  };

  const handleConfirmDeletePost = async () => {
    setIsDeleteModalOpen(false);
    const result = await dispatch(deletePost(id));
    if (deletePost.fulfilled.match(result)) {
      dispatch(showNotification({ message: 'Question deleted successfully', type: 'info' }));
      navigate('/');
    }
  };

  const handleTogglePostStatus = async () => {
    if (!isAdmin || !currentPost) return;
    const newStatus = currentPost.status === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(updatePost({ postId: id, data: { status: newStatus } })).unwrap();
      dispatch(
        showNotification({
          message: `Question status changed to "${newStatus}"!`,
          type: 'success',
        })
      );
    } catch (err) {
      dispatch(showNotification({ message: (err && err.message) || String(err), type: 'error' }));
    }
  };

  const handleToggleFavorite = async () => {
    if (!token) {
      dispatch(showNotification({ message: 'Please log in to save to favorites', type: 'error' }));
      return;
    }
    const result = await dispatch(toggleFavorite({ postId: id, isFavorite }));
    if (toggleFavorite.fulfilled.match(result)) {
      setIsFavorite(result.payload.isFavorite);
      dispatch(
        showNotification({
          message: result.payload.isFavorite ? 'Added to favorites!' : 'Removed from favorites',
          type: 'success',
        })
      );
    }
  };

  const handleToggleSubscription = async () => {
    if (!token) {
      dispatch(showNotification({ message: 'Please log in to subscribe to updates', type: 'error' }));
      return;
    }
    const result = await dispatch(toggleSubscription({ postId: id, isSubscribed }));
    if (toggleSubscription.fulfilled.match(result)) {
      setIsSubscribed(result.payload.isSubscribed);
      dispatch(
        showNotification({
          message: result.payload.isSubscribed
            ? 'Subscribed! You will receive email notifications about new answers.'
            : 'Unsubscribed from updates',
          type: 'success',
        })
      );
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      dispatch(
        showNotification({
          message: 'Question link copied to clipboard!',
          type: 'success',
        })
      );
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      await dispatch(createComment({ postId: id, content: newComment.trim() }));
      setNewComment('');
      dispatch(showNotification({ message: 'Your answer has been published!', type: 'success' }));
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (postStatus === 'loading' && !currentPost) {
    return <div className={styles.loadingContainer}>Loading question...</div>;
  }

  if (postError || !currentPost) {
    return (
      <div className={styles.errorContainer}>
        <h2>Question not found</h2>
        <p>{postError || 'The question may have been deleted or you do not have permission to view it.'}</p>
        <Link to="/" className={styles.backLink}>← Back to main feed</Link>
      </div>
    );
  }

  const rating = currentPost.rating !== undefined
    ? currentPost.rating
    : (currentPost.likes_count || 0) - (currentPost.dislikes_count || 0);

  const formattedDate = currentPost.publish_date
    ? new Date(currentPost.publish_date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const avatarUrl = getAvatarUrl(currentPost.author_avatar, currentPost.author_login);

  const sortedComments = [...comments].sort((a, b) => {
    if (a.is_solution && !b.is_solution) return -1;
    if (!a.is_solution && b.is_solution) return 1;

    if (commentSortBy === 'likes') {
      const scoreA = (a.likes_count || 0) - (a.dislikes_count || 0);
      const scoreB = (b.likes_count || 0) - (b.dislikes_count || 0);
      if (commentSortOrder === 'desc') {
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.publish_date) - new Date(a.publish_date);
      } else {
        if (scoreA !== scoreB) return scoreA - scoreB;
        return new Date(a.publish_date) - new Date(b.publish_date);
      }
    } else {
      if (commentSortOrder === 'desc') {
        return new Date(b.publish_date) - new Date(a.publish_date);
      } else {
        return new Date(a.publish_date) - new Date(b.publish_date);
      }
    }
  });

  const rootComments = sortedComments.filter((c) => !c.parent_comment_id);

  return (
    <div className={styles.detailsContainer}>
      {/* Top Header */}
      <div className={styles.postHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.postTitle}>{currentPost.title}</h1>
          {(isAuthor || isAdmin) && (
            <div className={styles.authorActions}>
              <Link to={`/posts/${id}/edit`} className={styles.editBtn}>
                Edit
              </Link>
              {isAdmin && (
                <button
                  type="button"
                  className={currentPost.status === 'active' ? styles.deactivateBtn : styles.activateBtn}
                  onClick={handleTogglePostStatus}
                  title={
                    currentPost.status === 'active'
                      ? 'Deactivate question (hide from public feed)'
                      : 'Activate question'
                  }
                >
                  {currentPost.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              )}
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className={styles.metaRow}>
          <div className={styles.authorInfo}>
            <img
              src={avatarUrl}
              alt={currentPost.author_login}
              className={styles.avatar}
              onError={(e) => {
                e.target.src = getAvatarUrl(null, currentPost.author_login);
              }}
            />
            <Link to={`/users/${currentPost.author_id}`} className={styles.authorName}>
              {currentPost.author_login || 'Anonymous'}
            </Link>
            <span className={styles.ratingBadge}>
              rating: {currentPost.author_rating || 0}
            </span>
          </div>
          <span className={styles.dateText}>Published: {formattedDate}</span>
          {currentPost.status === 'inactive' && (
            <span className={styles.inactiveBadge}>Inactive</span>
          )}
        </div>
      </div>

      {/* Main Grid: Votes + Content */}
      <div className={styles.mainGrid}>
        {/* Voting Bar */}
        <div className={styles.voteBar}>
          <button
            type="button"
            className={`${styles.voteBtn} ${userReaction === 'like' ? styles.voteActiveUp : ''}`}
            onClick={() => handleVote('like')}
            title={userReaction === 'like' ? 'Remove upvote' : 'Helpful question (Upvote)'}
          >
            ▲
          </button>
          <span className={`${styles.ratingNumber} ${rating > 0 ? styles.scorePositive : rating < 0 ? styles.scoreNegative : ''}`}>
            {rating}
          </span>
          <button
            type="button"
            className={`${styles.voteBtn} ${userReaction === 'dislike' ? styles.voteActiveDown : ''}`}
            onClick={() => handleVote('dislike')}
            title={userReaction === 'dislike' ? 'Remove downvote' : 'Not helpful (Downvote)'}
          >
            ▼
          </button>

          {/* Creative features */}
          <button
            type="button"
            className={`${styles.sideIconBtn} ${isFavorite ? styles.favorited : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            ★
          </button>

          <button
            type="button"
            className={`${styles.sideIconBtn} ${isSubscribed ? styles.subscribed : ''}`}
            onClick={handleToggleSubscription}
            title={isSubscribed ? 'Unsubscribe from email updates' : 'Subscribe to email updates'}
          >
            ✉
          </button>

          <button
            type="button"
            className={styles.sideIconBtn}
            onClick={handleShare}
            title="Share link"
          >
            ↗
          </button>
        </div>

        {/* Post Text & Attachments */}
        <div className={styles.bodyColumn}>
          {/* Safe HTML / Markdown rendering */}
          <div
            className={styles.htmlContent}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(currentPost.content) }}
          />

          {currentPost.picture && (
            <div className={styles.imageWrapper}>
              <img
                src={getMediaUrl(currentPost.picture)}
                alt={currentPost.title || 'Question illustration'}
                className={styles.fullImage}
              />
            </div>
          )}

          {/* Tags */}
          <div className={styles.tagsRow}>
            {currentPost.categories && currentPost.categories.length > 0 ? (
              currentPost.categories.map((cat) => (
                <span key={cat.id || cat} className={styles.tagBadge}>
                  {cat.title || cat.name || `Category #${cat.id || cat}`}
                </span>
              ))
            ) : null}
          </div>
        </div>
      </div>

      {/* Comments & Discussion Section */}
      <section className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <h2 className={styles.commentsCount}>
            Answers & Comments ({comments.length})
          </h2>
          <div className={styles.commentSortGroup}>
            <span className={styles.commentSortLabel}>Sort:</span>
            <button
              type="button"
              className={`${styles.commentSortBtn} ${commentSortBy === 'date' ? styles.commentSortActive : ''}`}
              onClick={() => {
                if (commentSortBy === 'date') {
                  setCommentSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                } else {
                  setCommentSortBy('date');
                  setCommentSortOrder('desc');
                }
              }}
              title={`Sort by Date: currently ${commentSortOrder === 'desc' ? 'Newest first (Descending)' : 'Oldest first (Ascending)'}. Click to switch direction.`}
            >
              Date {commentSortBy === 'date' ? (commentSortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
            <button
              type="button"
              className={`${styles.commentSortBtn} ${commentSortBy === 'likes' ? styles.commentSortActive : ''}`}
              onClick={() => {
                if (commentSortBy === 'likes') {
                  setCommentSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setCommentSortBy('likes');
                  setCommentSortOrder('asc');
                }
              }}
              title={`Sort by Rating: currently ${commentSortOrder === 'desc' ? 'Highest likes first (Descending)' : 'Lowest likes first (Ascending)'}. Click to switch direction.`}
            >
              Rating {commentSortBy === 'likes' ? (commentSortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          </div>
        </div>

        {/* Create Root Comment Form */}
        {token ? (
          <form className={styles.addCommentForm} onSubmit={handleCommentSubmit}>
            <label className={styles.commentLabel} htmlFor="newCommentArea">
              Your Answer
            </label>
            <textarea
              id="newCommentArea"
              className={styles.commentTextarea}
              placeholder="Describe technical solution or provide code explanation..."
              rows="4"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              className={styles.submitCommentBtn}
              disabled={isSubmittingComment || !newComment.trim()}
            >
              {isSubmittingComment ? 'Posting...' : 'Post Answer'}
            </button>
          </form>
        ) : (
          <div className={styles.authPrompt}>
            To leave an answer or comment, please{' '}
            <Link to="/login" className={styles.promptLink}>log in</Link> or{' '}
            <Link to="/register" className={styles.promptLink}>sign up</Link>.
          </div>
        )}

        {/* Comments Tree */}
        <div className={styles.commentsList}>
          {commentsStatus === 'loading' && comments.length === 0 ? (
            <div className={styles.loadingComments}>Loading answers...</div>
          ) : rootComments.length === 0 ? (
            <div className={styles.emptyComments}>
              No answers yet for this question. Be the first to help fellow developers!
            </div>
          ) : (
            rootComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={id}
                postAuthorId={currentPost.author_id}
                allComments={comments}
                depth={0}
              />
            ))
          )}
        </div>
      </section>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Question"
        message={`Are you sure you want to delete "${currentPost.title}"? This action cannot be undone.`}
        confirmText="Delete Question"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
