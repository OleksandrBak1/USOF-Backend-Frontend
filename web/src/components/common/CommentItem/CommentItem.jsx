import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../../../api/client';
import {
  createComment,
  voteComment,
  markSolutionComment,
  updateCommentStatus,
  deleteComment,
} from '../../../redux/slices/commentsSlice';
import { showNotification } from '../../../redux/slices/notificationSlice';
import { getAvatarUrl } from '../../../utils/avatar';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import styles from './CommentItem.module.css';

export default function CommentItem({
  comment,
  postId,
  postAuthorId,
  allComments,
  depth = 0,
}) {
  const dispatch = useDispatch();
  const { user, token, role } = useSelector((state) => state.auth);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isPostAuthor = user && user.id === postAuthorId;
  const isCommentAuthor = user && user.id === comment.author_id;
  const isAdmin = role === 'admin';

  // Find nested replies to this comment
  const replies = allComments.filter((c) => c.parent_comment_id === comment.id);

  useEffect(() => {
    if (token && comment.id) {
      apiClient
        .get(`/comments/${comment.id}/like`)
        .then((res) => {
          const found = (res.data || []).find((l) => l.author_id === user?.id);
          setUserReaction(found ? found.type : null);
        })
        .catch(() => {});
    }
  }, [comment.id, token, user?.id]);

  const handleVote = async (type) => {
    if (!token) {
      dispatch(showNotification({ message: 'Please log in to vote', type: 'error' }));
      return;
    }

    try {
      if (userReaction === type) {
        await dispatch(voteComment({ commentId: comment.id, type: 'remove' })).unwrap();
        setUserReaction(null);
        dispatch(showNotification({ message: 'Vote removed', type: 'info' }));
      } else {
        await dispatch(voteComment({ commentId: comment.id, type })).unwrap();
        setUserReaction(type);
        dispatch(
          showNotification({
            message: type === 'like' ? 'You upvoted this answer' : 'You downvoted this answer',
            type: 'success',
          })
        );
      }
    } catch (err) {
      dispatch(showNotification({ message: err || 'Error processing vote', type: 'error' }));
    }
  };

  const handleToggleSolution = async () => {
    if (!isPostAuthor && !isAdmin) return;
    const result = await dispatch(markSolutionComment(comment.id));
    if (markSolutionComment.fulfilled.match(result)) {
      dispatch(showNotification({ message: 'Solution status updated', type: 'success' }));
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = comment.status === 'active' ? 'inactive' : 'active';
    await dispatch(updateCommentStatus({ commentId: comment.id, status: newStatus }));
    dispatch(showNotification({ message: `Status updated to: ${newStatus}`, type: 'info' }));
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    await dispatch(deleteComment(comment.id));
    dispatch(showNotification({ message: 'Comment deleted', type: 'info' }));
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      await dispatch(
        createComment({
          postId,
          content: replyText.trim(),
          parent_comment_id: comment.id,
        })
      );
      setReplyText('');
      setReplyOpen(false);
      dispatch(showNotification({ message: 'Reply posted successfully', type: 'success' }));
    } catch (err) {
      dispatch(showNotification({ message: err.message, type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = comment.publish_date
    ? new Date(comment.publish_date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const avatarUrl = getAvatarUrl(comment.author_avatar, comment.author_login);

  return (
    <div className={`${styles.commentContainer} ${depth > 0 ? styles.nestedReply : ''}`}>
      <div className={`${styles.commentCard} ${comment.is_solution ? styles.solutionCard : ''} ${comment.status === 'inactive' ? styles.inactiveCard : ''}`}>
        {/* Solution Indicator */}
        {Boolean(comment.is_solution) && (
          <div className={styles.acceptedBanner}>
            ✓ Accepted Answer
          </div>
        )}

        <div className={styles.commentBody}>
          {/* Voting Box */}
          <div className={styles.voteBox}>
            <button
              type="button"
              className={`${styles.voteBtn} ${userReaction === 'like' ? styles.activeUp : ''}`}
              onClick={() => handleVote('like')}
              title={userReaction === 'like' ? 'Remove upvote' : 'Upvote answer'}
            >
              ▲
            </button>
            <span className={`${styles.ratingScore} ${(comment.rating || 0) > 0 ? styles.scorePositive : (comment.rating || 0) < 0 ? styles.scoreNegative : ''}`}>
              {comment.rating || 0}
            </span>
            <button
              type="button"
              className={`${styles.voteBtn} ${userReaction === 'dislike' ? styles.activeDown : ''}`}
              onClick={() => handleVote('dislike')}
              title={userReaction === 'dislike' ? 'Remove downvote' : 'Downvote answer'}
            >
              ▼
            </button>
          </div>

          {/* Text and Actions */}
          <div className={styles.contentArea}>
            <div className={styles.authorHeader}>
              <img
                src={avatarUrl}
                alt={comment.author_login}
                className={styles.authorAvatar}
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, comment.author_login);
                }}
              />
              <span className={styles.authorName}>{comment.author_login || 'Anonymous'}</span>
              <span className={styles.date}>{formattedDate}</span>
              {comment.status === 'inactive' && (
                <span className={styles.inactiveTag}>Inactive</span>
              )}
            </div>

            <div className={styles.commentText}>{comment.content}</div>

            {/* Controls */}
            <div className={styles.controlsRow}>
              {token && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setReplyOpen(!replyOpen)}
                >
                  {replyOpen ? 'Cancel' : 'Reply'}
                </button>
              )}

              {(isPostAuthor || isAdmin) && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${comment.is_solution ? styles.solutionActiveBtn : ''}`}
                  onClick={handleToggleSolution}
                >
                  {comment.is_solution ? 'Unmark solution' : 'Mark as accepted answer'}
                </button>
              )}

              {(isCommentAuthor || isAdmin) && (
                <>
                  <button type="button" className={styles.actionBtn} onClick={handleToggleStatus}>
                    {comment.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete}>
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Inline Reply Form */}
            {replyOpen && (
              <form className={styles.replyForm} onSubmit={handleReplySubmit}>
                <textarea
                  className={styles.replyTextarea}
                  placeholder={`Reply to @${comment.author_login}...`}
                  rows="2"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  type="submit"
                  className={styles.replySubmitBtn}
                  disabled={submitting || !replyText.trim()}
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Recursive rendering of nested comments */}
      {replies.length > 0 && (
        <div className={styles.repliesBranch}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              allComments={allComments}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}

