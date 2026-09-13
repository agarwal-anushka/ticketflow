import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">TicketFlow</div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Tickets
        </NavLink>
        {(user.role === 'admin' || user.role === 'agent') && (
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>
            Analytics
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.name}</span>
          <span className="sidebar-user-role">{user.role}</span>
        </div>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </aside>
  );
}