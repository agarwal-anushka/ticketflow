import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import TicketCard from './TicketCard';

const COLUMNS = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export default function KanbanBoard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedTicket, setDraggedTicket] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tickets');
      setTickets(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  function handleDragStart(e, ticket) {
    setDraggedTicket(ticket);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleDrop(e, newStatus) {
    e.preventDefault();
    if (!draggedTicket || draggedTicket.status === newStatus) return;

    const ticketId = draggedTicket.id;
    const previousStatus = draggedTicket.status;

    // Optimistic update: reflect the change immediately in the UI
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    setDraggedTicket(null);

    try {
      await api.put(`/tickets/${ticketId}`, { field: 'status', value: newStatus });
    } catch (err) {
      // Roll back on failure
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: previousStatus } : t))
      );
      setError('Could not update ticket status. Change reverted.');
    }
  }

  if (loading) return <p>Loading tickets...</p>;

  return (
    <div>
      {error && <p className="form-error">{error}</p>}
      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <h3>{col.label}</h3>
            {tickets
              .filter((t) => t.status === col.key)
              .map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  draggable
                  onDragStart={handleDragStart}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
