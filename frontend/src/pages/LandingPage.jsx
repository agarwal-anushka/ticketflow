import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">TicketFlow</span>
        <div className="landing-nav-links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="landing-nav-cta">Get started</Link>
        </div>
      </header>

      <section className="landing-hero">
        <h1>Support tickets,<br />handled without the chaos.</h1>
        <p>
          A lightweight ticketing system with a live Kanban board, automatic
          agent assignment, and audit-logged history — built for small teams
          who need clarity, not complexity.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register" className="btn-primary">Get started free</Link>
          <Link to="/login" className="btn-secondary">Log in</Link>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature">
          <span className="landing-feature-index">01</span>
          <h3>Kanban board</h3>
          <p>Drag tickets between Open, In Progress, Resolved, and Closed. Updates save instantly.</p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-index">02</span>
          <h3>Smart assignment</h3>
          <p>One click routes a ticket to whichever agent currently has the lightest load.</p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-index">03</span>
          <h3>Full audit trail</h3>
          <p>Every status change and assignment is logged — who did what, and when.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>TicketFlow — a support ticketing demo</span>
      </footer>
    </div>
  );
}