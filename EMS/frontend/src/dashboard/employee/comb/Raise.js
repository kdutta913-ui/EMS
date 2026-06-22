import React, { useState, useEffect } from "react";
import "../comb/EmpPages.css";
import { api } from "../../../utils/api";

const RaiseTicket = () => {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("list");
  const [form,       setForm]       = useState({ category: "IT", subject: "", description: "", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  const fetchTickets = () => {
    api.get("/tickets/my").then(data => setTickets(data.tickets || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.subject || !form.description) { setError("Subject and description are required."); return; }
    setSubmitting(true);
    try {
      await api.post("/tickets", form);
      setSuccess(true);
      setForm({ category: "IT", subject: "", description: "", priority: "medium" });
      fetchTickets();
      setTimeout(() => { setSuccess(false); setView("list"); }, 2000);
    } catch (err) { setError(err.message || "Failed to submit ticket."); }
    finally { setSubmitting(false); }
  };

  const statusColor = { open: "var(--accent)", "in-progress": "var(--warning)", resolved: "var(--success)", closed: "var(--text-muted)" };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Support Tickets</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Raise and track your support requests</div>
        </div>
        <button className="ca-btn-approve" onClick={() => setView(view === "new" ? "list" : "new")}>
          {view === "new" ? "← Back to Tickets" : "+ Raise New Ticket"}
        </button>
      </div>

      {view === "new" && (
        <div className="shared-card">
          <div className="shared-card-header"><span className="shared-card-title">New Support Ticket</span></div>
          <div className="shared-card-body">
            {success ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--success)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>Ticket submitted successfully!</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div style={{ color: "red", fontSize: 13, marginBottom: 12 }}>{error}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="at-label">Category</label>
                    <select className="at-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="IT">IT</option><option value="HR">HR</option>
                      <option value="Finance">Finance</option><option value="Admin">Admin</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="at-label">Priority</label>
                    <select className="at-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option><option value="medium">Medium</option>
                      <option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="at-label">Subject *</label>
                  <input className="at-input" placeholder="Brief subject of your issue" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="at-label">Description *</label>
                  <textarea className="at-textarea" rows={4} placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <button type="submit" className="shared-btn primary" style={{ width: "100%", justifyContent: "center", padding: 13 }} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="shared-card">
          <div className="shared-card-header"><span className="shared-card-title">My Tickets ({tickets.length})</span></div>
          {loading ? <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
            : tickets.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎟️</div>
                <div style={{ fontWeight: 600 }}>No tickets yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Click "Raise New Ticket" to get started</div>
              </div>
            ) : (
              tickets.map(t => (
                <div key={t._id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {t.ticketNumber} · {t.category} · {new Date(t.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: `${statusColor[t.status]}20`, color: statusColor[t.status] }}>
                      {t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.priority}</span>
                  </div>
                </div>
              ))
            )}
        </div>
      )}
    </div>
  );
};

export default RaiseTicket;
