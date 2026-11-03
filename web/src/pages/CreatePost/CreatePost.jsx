import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createPost, updatePost, fetchPostById, deletePost } from '../../redux/slices/postsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import { showNotification } from '../../redux/slices/notificationSlice';
import apiClient from '../../api/client';
import { renderMarkdown } from '../../utils/markdown';
import styles from './CreatePost.module.css';

export default function CreatePost() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const textareaRef = useRef(null);

  const { items: categories } = useSelector((state) => state.categories);
  const { currentPost } = useSelector((state) => state.posts);
  const { user } = useSelector((state) => state.auth);

  const isAuthor = Boolean(
    currentPost && user && (currentPost.author_id === user.id || currentPost.author_login === user.login)
  );
  const isAdmin = Boolean(user && user.role === 'admin');
  const isAdminModerating = Boolean(isEditing && isAdmin && !isAuthor);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [pictureFile, setPictureFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
    if (isEditing) {
      dispatch(fetchPostById(id));
    }
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && currentPost && currentPost.id === Number(id)) {
      setTitle(currentPost.title || '');
      setContent(currentPost.content || '');
      if (currentPost.categories) {
        setSelectedCategories(currentPost.categories.map((c) => (c.id !== undefined ? c.id : c)));
      }
    }
  }, [isEditing, currentPost, id]);

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  /**
   * Helper to insert markdown tags around selection or at cursor
   */
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const cursorPosition = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 10);
  };

  /**
   * Handle Tab key for developer-friendly indentation
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPictureFile(null);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.picture;
        return copy;
      });
      return;
    }

    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      setPictureFile(null);
      e.target.value = '';
      setErrors((prev) => ({ ...prev, picture: 'Only image files (PNG, JPG, JPEG, WEBP) are allowed' }));
      dispatch(showNotification({ message: 'Only image files (PNG, JPG, JPEG, WEBP) are allowed', type: 'error' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPictureFile(null);
      e.target.value = '';
      setErrors((prev) => ({ ...prev, picture: 'Image size cannot exceed 5 MB' }));
      dispatch(showNotification({ message: 'Image size cannot exceed 5 MB', type: 'error' }));
      return;
    }

    setPictureFile(file);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.picture;
      return copy;
    });
  };

  const validate = () => {
    const newErrors = {};

    if (isAdminModerating) {
      if (selectedCategories.length === 0) {
        newErrors.categories = 'Please select at least one category';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!title.trim()) {
      newErrors.title = 'Please enter a question title';
    } else if (title.trim().length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    if (!content.trim()) {
      newErrors.content = 'Please describe the problem or question in the content body';
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }

    if (pictureFile) {
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimes.includes(pictureFile.type)) {
        newErrors.picture = 'Only image files (PNG, JPG, JPEG, WEBP) are allowed';
      } else if (pictureFile.size > 5 * 1024 * 1024) {
        newErrors.picture = 'Image size cannot exceed 5 MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      let targetPostId = id;

      if (isEditing) {
        const updateData = isAdminModerating
          ? { categories: selectedCategories }
          : {
              title: title.trim(),
              content: content.trim(),
              categories: selectedCategories,
            };

        await dispatch(
          updatePost({
            postId: id,
            data: updateData,
          })
        ).unwrap();
        dispatch(
          showNotification({
            message: isAdminModerating
              ? 'Categories updated successfully!'
              : 'Question updated successfully!',
            type: 'success',
          })
        );
      } else {
        const newPost = await dispatch(
          createPost({
            title: title.trim(),
            content: content.trim(),
            categories: selectedCategories,
          })
        ).unwrap();
        targetPostId = newPost.id;
      }

      // If a picture was selected, upload it
      if (pictureFile && targetPostId) {
        try {
          const formData = new FormData();
          formData.append('picture', pictureFile);
          await apiClient.patch(`/posts/${targetPostId}/picture`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr) {
          if (!isEditing && targetPostId) {
            try {
              await dispatch(deletePost(targetPostId)).unwrap();
            } catch (_) {}
          }
          throw new Error(uploadErr.response?.data?.message || uploadErr.message || 'Error uploading illustration');
        }
      }

      if (!isEditing) {
        dispatch(showNotification({ message: 'Question posted successfully!', type: 'success' }));
      }

      navigate(`/posts/${targetPostId}`);
    } catch (err) {
      dispatch(showNotification({ message: err.message || 'Error saving question', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>
        {isEditing ? 'Edit Question' : 'Ask a New Question'}
      </h1>

      <form className={styles.postForm} onSubmit={handleSubmit}>
        {isAdminModerating && (
          <div className={styles.adminBanner}>
            <strong>Admin Moderation Mode:</strong> As per USOF rules, post title and content cannot be modified even by administrators. You can update the categories below, or toggle question status (active/inactive) on the question page.
          </div>
        )}

        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="postTitle">
            Question Title *
          </label>
          <span className={styles.hint}>
            {isAdminModerating
              ? 'Only the author can change the question title.'
              : 'Be specific and imagine you are asking a question to another developer.'}
          </span>
          <input
            id="postTitle"
            type="text"
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="e.g. How to optimize JOIN queries in MySQL without external ORMs?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={isAdminModerating}
          />
          {errors.title && <span className={styles.errorText}>{errors.title}</span>}
        </div>

        {/* Content (Native Markdown & Code Editor) */}
        <div className={styles.formGroup}>
          <div className={styles.editorLabelRow}>
            <label className={styles.label}>Detailed Description & Code Snippets *</label>
            <div className={styles.tabToggleGroup}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'write' ? styles.activeTabBtn : ''}`}
                onClick={() => setActiveTab('write')}
              >
                Write
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.activeTabBtn : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
            </div>
          </div>
          <span className={styles.hint}>
            Describe the problem context, what you have tried, and attach code snippets using the code button.
          </span>

          <div className={styles.editorContainer}>
            {/* Toolbar */}
            {!isAdminModerating && activeTab === 'write' && (
              <div className={styles.toolbar}>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('**', '**', 'bold text')}
                  title="Bold (Ctrl+B)"
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('*', '*', 'italic text')}
                  title="Italic (Ctrl+I)"
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('### ', '\n', 'Heading')}
                  title="Heading 3"
                >
                  H
                </button>
                <span className={styles.toolDivider} />
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('`', '`', 'code')}
                  title="Inline code"
                >
                  &lt;&gt;
                </button>
                <button
                  type="button"
                  className={`${styles.toolBtn} ${styles.codeBlockBtn}`}
                  onClick={() => insertFormatting('```javascript\n', '\n```\n', '// Your code here')}
                  title="Code Block"
                >
                  {'{ }'} Code Block
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('> ', '\n', 'Quote text')}
                  title="Blockquote"
                >
                  “ ”
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('- ', '\n', 'List item')}
                  title="Bullet list"
                >
                  • List
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting('[', '](https://example.com)', 'link text')}
                  title="Insert Link"
                >
                  Link
                </button>
              </div>
            )}

            {/* Editor Area */}
            {activeTab === 'write' ? (
              <textarea
                ref={textareaRef}
                className={styles.markdownTextarea}
                placeholder="Describe your technical problem, include expected behavior, steps to reproduce, and paste your code snippets..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={14}
                readOnly={isAdminModerating}
              />
            ) : (
              <div className={styles.previewContainer}>
                {content.trim() ? (
                  <div
                    className={styles.previewContent}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                  />
                ) : (
                  <div className={styles.previewEmpty}>
                    Nothing to preview yet. Switch back to Write to describe your problem.
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.content && <span className={styles.errorText}>{errors.content}</span>}
        </div>

        {/* Categories */}
        <div className={styles.formGroup}>
          <div className={styles.categoryHeaderRow}>
            <label className={styles.label}>Categories *</label>
            <span className={styles.selectedCount}>
              Selected: {selectedCategories.length}
            </span>
          </div>
          <span className={styles.hint}>
            Select one or more categories that match your question (you can pick multiple).
          </span>
          <div className={styles.categoriesGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`${styles.categoryChip} ${isSelected ? styles.categorySelected : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  {isSelected ? `✓ ${cat.title}` : cat.title}
                </button>
              );
            })}
          </div>
          {errors.categories && <span className={styles.errorText}>{errors.categories}</span>}
        </div>

        {/* Picture Upload */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="pictureInput">
            Illustration or Diagram (optional)
          </label>
          <span className={styles.hint}>Supported formats: PNG, JPEG, WEBP (up to 5 MB).</span>
          <input
            id="pictureInput"
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className={`${styles.fileInput} ${errors.picture ? styles.inputError : ''}`}
            onChange={handleFileChange}
          />
          {errors.picture && <span className={styles.errorText}>{errors.picture}</span>}
        </div>

        {/* Submit Buttons */}
        <div className={styles.actionsRow}>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Saving...' : isAdminModerating ? 'Update Categories' : isEditing ? 'Update Question' : 'Post Question'}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(isEditing ? `/posts/${id}` : '/')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
