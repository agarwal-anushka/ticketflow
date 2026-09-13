import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="auth-split">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <span className="auth-brand-name">TicketFlow</span>
          <h2>Welcome back.</h2>
          <p>Pick up where you left off — your tickets, your board, your team.</p>
        </div>
      </div>
      <div className="auth-form-panel">
        <LoginForm />
      </div>
    </div>
  );
}