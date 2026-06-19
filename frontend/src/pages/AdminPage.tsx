import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAdminStatus,
  getContactMessages,
  getEventSummary,
  type AdminStatus,
  type ContactMessage,
  type EventSummary,
} from "../api/admin";

import "./AdminPage.css";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function AdminPage() {
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [status, summary, messages] = await Promise.all([
          getAdminStatus(),
          getEventSummary(),
          getContactMessages(),
        ]);

        setAdminStatus(status);
        setEventSummary(summary);
        setContactMessages(messages);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === "Missing token" ||
            error.message === "Unauthorized"
          ) {
            setErrorMessage("Admin access requires login.");
            return;
          }

          if (error.message === "Forbidden") {
            setErrorMessage("Forbidden. This account does not have admin access.");
            return;
          }
        }

        setErrorMessage("Could not load admin data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminData();
  }, []);

  if (isLoading) {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <p>Loading admin data...</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="admin-page">
        <section className="admin-panel">
          <h2>Admin</h2>
          <p>{errorMessage}</p>
          <p>
            <Link to="/login">Log in</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <p className="admin-eyebrow">Operator view</p>

        <h2>Admin</h2>

        <p>
          Hidden admin page for quick parked-project visibility. Raw event-log
          inspection stays in Neon.
        </p>
      </section>

      <section className="admin-grid">
        <article className="admin-panel">
          <h3>Status</h3>

          <dl className="admin-facts">
            <div>
              <dt>Admin</dt>
              <dd>{adminStatus?.is_admin ? "true" : "false"}</dd>
            </div>

            <div>
              <dt>User ID</dt>
              <dd>{adminStatus?.user_id}</dd>
            </div>
          </dl>
        </article>

        <article className="admin-panel">
          <h3>Event log storage</h3>

          <dl className="admin-facts">
            <div>
              <dt>Total rows</dt>
              <dd>{eventSummary?.total_event_rows ?? 0}</dd>
            </div>

            <div>
              <dt>Storage used</dt>
              <dd>{eventSummary?.event_log_size_pretty ?? "Unknown"}</dd>
            </div>

            <div>
              <dt>Share of 0.5 GB reference</dt>
              <dd>{eventSummary?.approx_percent_of_0_5_gb ?? 0}%</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="admin-panel">
        <h3>Event counters</h3>

        {eventSummary && eventSummary.counts.length > 0 ? (
          <div className="admin-counter-list">
            {eventSummary.counts.map((item) => (
              <div className="admin-counter" key={item.event_type}>
                <span>{item.event_type}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>No events logged yet.</p>
        )}
      </section>

      <section className="admin-panel">
        <h3>Contact messages</h3>

        {contactMessages.length > 0 ? (
          <div className="admin-message-list">
            {contactMessages.map((message) => (
              <article className="admin-message" key={message.id}>
                <p className="admin-message-meta">
                  {message.name || "No name"} · {message.email || "No email"} ·{" "}
                  {formatDate(message.created_at)}
                </p>

                <p>{message.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>No contact messages yet.</p>
        )}
      </section>
    </main>
  );
}
