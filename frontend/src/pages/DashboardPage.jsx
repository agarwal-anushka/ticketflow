import { useState } from 'react';
import KanbanBoard from '../components/tickets/KanbanBoard';
import NewTicketForm from '../components/tickets/NewTicketForm';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <NewTicketForm onCreated={() => setRefreshKey((k) => k + 1)} />
      <KanbanBoard key={refreshKey} />
    </div>
  );
}
