export default function CommentThread({ comments }) {
  if (!comments || comments.length === 0) {
    return <p className="no-comments">No comments yet.</p>;
  }

  return (
    <div className="comment-thread">
      {comments.map((c) => (
        <div key={c.id} className="comment">
          <div className="comment-header">
            <strong>{c.user_name}</strong>
            <span className="comment-time">
              {new Date(c.created_at).toLocaleString()}
            </span>
          </div>
          <p>{c.message}</p>
        </div>
      ))}
    </div>
  );
}
