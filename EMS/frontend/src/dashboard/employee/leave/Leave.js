import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import "./Leave.css";
import { api } from "../../../utils/api";

const LEAVE_COLORS = {
  "Earned Leave":  "var(--accent)",
  "Sick Leave":    "var(--success)",
  "Casual Leave":  "var(--warning)",
  "Work From Home":"var(--text-muted)",
};

const Leave = () => {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingBal, setLoadingBal] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [form, setForm] = useState({ type: "", from: "", to: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/leaves/balance")
      .then(data => setBalance(data.balance))
      .catch(err => console.error(err.message))
      .finally(() => setLoadingBal(false));

    api.get("/leaves/my")
      .then(data => setHistory(data.leaves || []))
      .catch(err => console.error(err.message))
      .finally(() => setLoadingHist(false));
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!form.type || !form.from || !form.to || !form.reason) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leaves/request", { type: form.type, fromDate: form.from, toDate: form.to, reason: form.reason });
      setSubmitted(true);
      setForm({ type: "", from: "", to: "", reason: "" });
      const data = await api.get("/leaves/my");
      setHistory(data.leaves || []);
      const balData = await api.get("/leaves/balance");
      setBalance(balData.balance);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const balanceCards = balance ? [
    { type: "Earned Leave",  total: balance.earnedLeave?.total, used: balance.earnedLeave?.used },
    { type: "Sick Leave",    total: balance.sickLeave?.total,   used: balance.sickLeave?.used   },
    { type: "Casual Leave",  total: balance.casualLeave?.total, used: balance.casualLeave?.used },
  ] : [];

  return (
    <div className="lv-page">
      <div className="lv-page-header">
        <div>
          <div className="lv-page-title">Leave</div>
          <div className="lv-page-sub">Manage your leave applications and balance</div>
        </div>
      </div>

      {/* Balance Cards */}
      {loadingBal ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>Loading balance...</p>
      ) : (
        <div className="lv-balance-grid">
          {balanceCards.map((l, i) => {
            const remaining = (l.total || 0) - (l.used || 0);
            const pct = l.total ? Math.round((l.used / l.total) * 100) : 0;
            return (
              <div className="lv-balance-card" key={i}>
                <div className="lv-balance-label">{l.type}</div>
                <div className="lv-balance-count">{remaining}</div>
                <div className="lv-balance-meta">{l.used} used of {l.total} days</div>
                <div className="lv-balance-bar">
                  <div className="lv-balance-fill" style={{ width: `${pct}%`, background: LEAVE_COLORS[l.type] }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="lv-grid-2">
        {/* Apply Form */}
        <div className="lv-card">
          <div className="lv-card-header">
            <span className="lv-card-title">Apply for Leave</span>
          </div>
          <div className="lv-card-body">
            {submitted ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--success)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Leave request submitted!</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>Your manager will review shortly.</div>
              </div>
            ) : (
              <>
                {error && <div style={{ color: "red", fontSize: 13, marginBottom: 12 }}>{error}</div>}
                <div className="lv-form-group">
                  <label className="lv-label">Leave Type</label>
                  <select className="lv-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="">Select leave type</option>
                    <option>Earned Leave</option>
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Work From Home</option>
                  </select>
                </div>
                <div className="lv-form-group">
                  <label className="lv-label">Duration</label>
                  <div className="lv-date-row">
                    <div>
                      <label className="lv-label" style={{ fontSize: 13, fontWeight: 500 }}>From</label>
                      <input type="date" className="lv-input" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} />
                    </div>
                    <div>
                      <label className="lv-label" style={{ fontSize: 13, fontWeight: 500 }}>To</label>
                      <input type="date" className="lv-input" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="lv-form-group">
                  <label className="lv-label">Reason</label>
                  <textarea className="lv-textarea" placeholder="Briefly describe the reason..."
                    value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                </div>
                <button className="lv-submit-btn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Leave Request"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Leave History */}
        <div className="lv-card">
          <div className="lv-card-header">
            <span className="lv-card-title">Leave History</span>
          </div>
          <div className="lv-card-body">
            {loadingHist ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
            ) : history.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No leave history.</p>
            ) : (
              history.slice(0, 8).map((l, i) => (
                <div className="lv-history-item" key={i}>
                  <Calendar size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lv-history-type">{l.type}</div>
                    <div className="lv-history-meta">
                      {new Date(l.fromDate).toLocaleDateString("en-IN")} → {new Date(l.toDate).toLocaleDateString("en-IN")} · {l.reason}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="lv-history-days">{l.totalDays}</div>
                    <div className="lv-history-days-label">day{l.totalDays > 1 ? "s" : ""}</div>
                  </div>
                  <span className={`lv-tag ${l.status}`}>
                    {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leave;
