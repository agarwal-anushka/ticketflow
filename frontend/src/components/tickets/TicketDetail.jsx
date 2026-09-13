import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CommentThread from '../comments/CommentThread';
import CommentForm from '../comments/CommentForm';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  async function handleStatusChange(newStatus) {
    try {
      await api.put(`/tickets/${id}`, { field: 'status', value: newStatus });
      fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleAutoAssign() {
    try {
      await api.post(`/tickets/${id}/auto-assign`);
      fetchTicket();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to auto-assign');
    }
  }

  if (loading) return <p>Loading ticket...</p>;
  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!ticket) return <p>Ticket not found.</p>;

  const canManage = user.role === 'admin' || user.role === 'agent';

  return (
    <div className="ticket-detail">
      <h2>{ticket.title}</h2>
      <p className="ticket-meta">
        Status: <strong>{ticket.status}</strong> · Priority: <strong>{ticket.priority}</strong> ·{' '}
        {ticket.assignee_name ? `Assigned to ${ticket.assignee_name}` : 'Unassigned'}
      </p>
      <p>{ticket.description}</p>

      {actionError && <p className="form-error">{actionError}</p>}

      {canManage && (
        <div className="ticket-actions">
          <select value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={handleAutoAssign}>Auto-assign to least-busy agent</button>
        </div>
      )}

      <h3>Comments</h3>
      <CommentThread comments={ticket.comments} />
      <CommentForm ticketId={id} onCommentAdded={fetchTicket} />

      {canManage && ticket.auditLogs && ticket.auditLogs.length > 0 && (
        <details className="audit-log">
          <summary>Audit log ({ticket.auditLogs.length})</summary>
          <ul>
            {ticket.auditLogs.map((log) => (
              <li key={log.id}>
                {log.changed_by_name || 'System'} changed {log.field_changed} from{' '}
                {log.old_value || '—'} to {log.new_value} on{' '}
                {new Date(log.changed_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
