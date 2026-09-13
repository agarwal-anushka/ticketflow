import { useState } from 'react';
import api from '../../services/api';

export default function CommentForm({ ticketId, onCommentAdded }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/tickets/${ticketId}/comments`, { message });
      setMessage('');
      onCommentAdded && onCommentAdded(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      {error && <p className="form-error">{error}</p>}
      <textarea
        placeholder="Add a comment..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit" disabled={submitting || !message.trim()}>
        {submitting ? 'Posting...' : 'Post comment'}
      </button>
    </form>
  );
}
