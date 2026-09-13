import { useState } from 'react';
import KanbanBoard from '../components/tickets/KanbanBoard';
import TicketList from '../components/tickets/TicketList';
import NewTicketForm from '../components/tickets/NewTicketForm';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState('kanban');

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="view-toggle">
          <button
            className={view === 'kanban' ? 'active' : ''}
            onClick={() => setView('kanban')}
          >
            Board
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>
      <NewTicketForm onCreated={() => setRefreshKey((k) => k + 1)} />
      {view === 'kanban' ? (
        <KanbanBoard key={refreshKey} />
      ) : (
        <TicketList key={refreshKey} />
      )}
    </div>
  );
}
