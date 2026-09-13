import { Link } from 'react-router-dom';

const priorityColors = {
  low: '#6B8F71',
  medium: '#C08A3E',
  high: '#B8543F',
  urgent: '#8B2E2E',
};

export default function TicketCard({ ticket, draggable, onDragStart }) {
  return (
    <div
      className="ticket-row"
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, ticket)}
    >
      <span
        className="priority-dot"
        style={{ backgroundColor: priorityColors[ticket.priority] || '#999' }}
        title={`Priority: ${ticket.priority}`}
      />
      <Link to={`/tickets/${ticket.id}`} className="ticket-row-title">
        {ticket.title}
      </Link>
      <span className="ticket-row-assignee">
        {ticket.assignee_name || '—'}
      </span>
    </div>
  );
}