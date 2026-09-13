import RegisterForm from '../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="auth-split">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <span className="auth-brand-name">TicketFlow</span>
          <h2>Set up in under a minute.</h2>
          <p>No credit card, no setup wizard — just create an account and start tracking tickets.</p>
        </div>
      </div>
      <div className="auth-form-panel">
        <RegisterForm />
      </div>
    </div>
  );
}