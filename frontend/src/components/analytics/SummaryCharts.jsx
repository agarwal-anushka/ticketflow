import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';

export default function SummaryCharts() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/analytics/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Failed to load analytics'));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!summary) return <p>Loading analytics...</p>;

  const statusData = summary.byStatus.map((s) => ({ name: s.status, count: s.count }));
  const priorityData = summary.byPriority.map((p) => ({ name: p.priority, count: p.count }));

  return (
    <div className="analytics">
      <p>
        Average resolution time:{' '}
        <strong>{Number(summary.avgResolutionHours).toFixed(1)} hours</strong>
      </p>

      <h3>Tickets by status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={statusData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#4f8ef7" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Tickets by priority</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={priorityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#fb8c00" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
