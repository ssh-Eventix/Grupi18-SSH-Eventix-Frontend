import { FaBell, FaHistory } from "react-icons/fa";
import "./SuperAdmin.css";

export default function SuperAdminNotificationsPage() {
  return (
    <section className="superadmin-page">
      <header className="superadmin-hero">
        <div>
          <span className="superadmin-kicker">
            <FaBell /> Platform monitoring
          </span>

          <h1>Notifications & Audit Logs</h1>

          <p>
            Review important platform activity, audit logs, and system level
            actions performed by administrators.
          </p>
        </div>
      </header>

      <div className="superadmin-grid">
        <article className="superadmin-card metric-card span-3">
          <div>
            <span className="metric-label">Audit logs</span>
            <strong className="metric-value">0</strong>
            <span className="metric-note">System activity records</span>
          </div>

          <span className="metric-icon">
            <FaHistory />
          </span>
        </article>

        <article className="superadmin-card span-9">
          <div className="panel-title">
            <div>
              <h2>Recent activity</h2>
              <p>Latest system level events and administrator actions.</p>
            </div>
          </div>

          <div className="empty-state">
            <strong>No activity yet</strong>
            Audit logs and notifications will appear here.
          </div>
        </article>

        <article className="superadmin-card span-12">
          <div className="panel-title">
            <div>
              <h2>Audit log table</h2>
              <p>
                Detailed tracking of entity changes, actions, and platform
                events.
              </p>
            </div>
          </div>

          <div className="empty-state">
            <strong>Audit log table coming soon</strong>
            Entity actions, old values, and new values will appear here.
          </div>
        </article>
      </div>
    </section>
  );
}