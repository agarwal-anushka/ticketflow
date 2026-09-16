-- Demo seed data for TicketFlow.
-- Run after schema.sql to populate demo accounts + realistic tickets
-- so a reviewer can log in and immediately see the app's actual features
-- (auto-assignment, audit log, analytics, drag-and-drop board) without
-- having to register accounts and manually promote roles via SQL.
--
-- Usage:
--   mysql -h <host> -P <port> -u <user> -p<password> ticketflow < backend/sql/seed.sql
--
-- All demo accounts share the password: Demo1234!
-- (bcrypt hash below is real and verified — these are working logins)

USE ticketflow;

INSERT INTO users (name, email, password_hash, role) VALUES
('Demo Admin', 'admin@demo.ticketflow.app', '$2b$10$LYBcgEVNyw3Ycm6Or4AR.eCaSI3Qa53DVWiT6KMV8rSLsYw4/xdMe', 'admin'),
('Priya Agent', 'priya@demo.ticketflow.app', '$2b$10$LYBcgEVNyw3Ycm6Or4AR.eCaSI3Qa53DVWiT6KMV8rSLsYw4/xdMe', 'agent'),
('Rahul Agent', 'rahul@demo.ticketflow.app', '$2b$10$LYBcgEVNyw3Ycm6Or4AR.eCaSI3Qa53DVWiT6KMV8rSLsYw4/xdMe', 'agent'),
('Demo Customer', 'customer@demo.ticketflow.app', '$2b$10$LYBcgEVNyw3Ycm6Or4AR.eCaSI3Qa53DVWiT6KMV8rSLsYw4/xdMe', 'customer');

-- Grab the ids we just inserted (works on a fresh run of this script)
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@demo.ticketflow.app');
SET @priya_id = (SELECT id FROM users WHERE email = 'priya@demo.ticketflow.app');
SET @rahul_id = (SELECT id FROM users WHERE email = 'rahul@demo.ticketflow.app');
SET @customer_id = (SELECT id FROM users WHERE email = 'customer@demo.ticketflow.app');

INSERT INTO tickets (title, description, status, priority, assignee_id, created_by) VALUES
('Cannot reset password', 'Clicking "forgot password" never sends the reset email. Tried three times over the last hour.', 'open', 'high', NULL, @customer_id),
('Export button does nothing', 'The CSV export button on the reports page is unresponsive — no download starts and no error appears in the console.', 'open', 'medium', NULL, @customer_id),
('Feature request: dark mode', 'Would love a dark theme option, especially for late-night usage.', 'open', 'low', NULL, @customer_id),
('Invoice shows wrong tax amount', 'Invoice #4471 shows 18% tax but our region should be charged 12%. Please correct and reissue.', 'in_progress', 'urgent', @priya_id, @customer_id),
('Slow page load on dashboard', 'Dashboard has been taking 8-10 seconds to load since yesterday\'s update.', 'in_progress', 'high', @rahul_id, @customer_id),
('Typo in welcome email', 'The onboarding email says "Wellcome" instead of "Welcome".', 'resolved', 'low', @priya_id, @customer_id),
('API key regeneration not working', 'Regenerating an API key in settings shows a success toast but the old key still works and the new one is not returned.', 'closed', 'medium', @rahul_id, @customer_id);

INSERT INTO comments (ticket_id, user_id, message)
SELECT id, @priya_id, 'Looking into this now — can you confirm which browser and OS you\'re using?'
FROM tickets WHERE title = 'Invoice shows wrong tax amount';

INSERT INTO comments (ticket_id, user_id, message)
SELECT id, @customer_id, 'Chrome on Windows 11, but I also tried Firefox with the same result.'
FROM tickets WHERE title = 'Invoice shows wrong tax amount';

INSERT INTO comments (ticket_id, user_id, message)
SELECT id, @rahul_id, 'Fixed — was a caching issue on the tax rate lookup for your region. Reissued the corrected invoice.'
FROM tickets WHERE title = 'Typo in welcome email';

INSERT INTO audit_logs (ticket_id, changed_by, field_changed, old_value, new_value)
SELECT id, @admin_id, 'assignee_id', NULL, @priya_id
FROM tickets WHERE title = 'Invoice shows wrong tax amount';

INSERT INTO audit_logs (ticket_id, changed_by, field_changed, old_value, new_value)
SELECT id, @admin_id, 'assignee_id', NULL, @rahul_id
FROM tickets WHERE title = 'Slow page load on dashboard';

INSERT INTO audit_logs (ticket_id, changed_by, field_changed, old_value, new_value)
SELECT id, @priya_id, 'status', 'open', 'resolved'
FROM tickets WHERE title = 'Typo in welcome email';
