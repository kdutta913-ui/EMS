import React, { useState, useEffect, useCallback } from "react";
import "../Finance.css";
import { FileText, Clock, CheckSquare, XSquare, Plus, X, Loader } from "lucide-react";
import { api } from "../../../utils/api";

const fmt     = (n) => n    ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";
const fmtDate = (d) => d    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const CAT_LABELS = {
  travel: "Travel", equipment: "Equipment", software: "Software",
  conference: "Conference", entertainment: "Entertainment", medical: "Medical", other: "Other",
};

const EMPTY_FORM = { title: "", category: "travel", amount: "", date: "", description: "", employeeId: "" };

export default function ExpenseClaims() {
  const [claims,    setClaims]    = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");

  const [showAdd,      setShowAdd]      = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewNote,   setReviewNote]   = useState("");
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [submitting,   setSubmitting]   = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      const data = await api.get("/expenses");
      setClaims(data.claims || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
    api.get("/employees").then(d => setEmployees(d.employees || [])).catch(() => {});
  }, [fetchClaims]);

  const byStatus    = (s) => claims.filter(c => c.status === s);
  const totalAmt    = (s) => byStatus(s).reduce((a, c) => a + (c.amount || 0), 0);
  const displayed   = filter === "all" ? claims : claims.filter(c => c.status === filter);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      fetchClaims();
      setShowAdd(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (status) => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`/expenses/${reviewTarget._id}/review`, { status, reviewNote });
      fetchClaims();
      setReviewTarget(null);
      setReviewNote("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this claim?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchClaims();
    } catch (err) {
      alert(err.message);
    }
  };

  const closeAdd    = () => { setShowAdd(false); setForm(EMPTY_FORM); };
  const closeReview = () => { setReviewTarget(null); setReviewNote(""); };

  return (
    <>
      {/* Stats */}
      <div className="fin-stats-grid">
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Claims</span>
            <div className="fin-stat-icon blue"><FileText size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{claims.length}</div>
          <div className="fin-stat-meta">{fmt(claims.reduce((a, c) => a + (c.amount || 0), 0))} total value</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Pending Review</span>
            <div className="fin-stat-icon amber"><Clock size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("pending").length}</div>
          <div className="fin-stat-meta">{fmt(totalAmt("pending"))} awaiting</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Approved</span>
            <div className="fin-stat-icon green"><CheckSquare size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("approved").length}</div>
          <div className="fin-stat-meta">{fmt(totalAmt("approved"))} approved</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Rejected</span>
            <div className="fin-stat-icon red"><XSquare size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("rejected").length}</div>
          <div className="fin-stat-meta">{fmt(totalAmt("rejected"))} rejected</div>
        </div>
      </div>

      {/* Table card */}
      <div className="fin-card">
        <div className="fin-card-header">
          <div className="fin-tabs">
            {["all", "pending", "approved", "rejected"].map(s => (
              <button
                key={s}
                className={`fin-tab${filter === s ? " active" : ""}`}
                onClick={() => setFilter(s)}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== "all" && byStatus(s).length > 0 && (
                  <span className="fin-tab-badge">{byStatus(s).length}</span>
                )}
              </button>
            ))}
          </div>
          <button className="fin-card-action" onClick={() => setShowAdd(true)}>
            <Plus size={14} style={{ display: "inline", verticalAlign: "middle" }} /> New Claim
          </button>
        </div>

        <div className="fin-card-body" style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : displayed.length === 0 ? (
            <div className="fin-empty">
              <div className="fin-empty-icon">🧾</div>
              <div className="fin-empty-title">No claims found</div>
              <div className="fin-empty-sub">Click "+ New Claim" to log the first expense claim.</div>
            </div>
          ) : (
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Employee / Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div className="fin-emp-name">{c.employeeId?.name || "—"}</div>
                      <div className="fin-emp-dept">{c.title}</div>
                    </td>
                    <td><span className="fin-chip">{CAT_LABELS[c.category] || c.category}</span></td>
                    <td><span className="fin-amount">{fmt(c.amount)}</span></td>
                    <td style={{ fontSize: 13 }}>{fmtDate(c.date)}</td>
                    <td>
                      <span className={`fin-tag ${c.status}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {c.status === "pending" && (
                          <button
                            className="fin-action-btn fin-action-approve"
                            onClick={() => setReviewTarget(c)}
                          >
                            Review
                          </button>
                        )}
                        <button
                          className="fin-action-btn fin-action-delete"
                          onClick={() => handleDelete(c._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Claim Modal ── */}
      {showAdd && (
        <div className="fin-modal-overlay" onClick={closeAdd}>
          <div className="fin-modal" onClick={e => e.stopPropagation()}>
            <div className="fin-modal-hdr">
              <div>
                <h2 className="fin-modal-title">New Expense Claim</h2>
                <p className="fin-modal-sub">Log an expense for review</p>
              </div>
              <button className="fin-modal-close" onClick={closeAdd}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="fin-modal-body">
                <div className="fin-form-group">
                  <label className="fin-form-label">Title *</label>
                  <input
                    className="fin-form-input"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Flight to client meeting"
                  />
                </div>

                <div className="fin-form-row cols-2" style={{ marginBottom: 14 }}>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Category *</label>
                    <select
                      className="fin-form-select"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {Object.entries(CAT_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Amount (₹) *</label>
                    <input
                      className="fin-form-input"
                      type="number"
                      min="1"
                      required
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="fin-form-row cols-2" style={{ marginBottom: 14 }}>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Expense Date *</label>
                    <input
                      className="fin-form-input"
                      type="date"
                      required
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Employee</label>
                    <select
                      className="fin-form-select"
                      value={form.employeeId}
                      onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                    >
                      <option value="">— Select Employee —</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}{emp.department ? ` (${emp.department})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="fin-form-group">
                  <label className="fin-form-label">Description</label>
                  <textarea
                    className="fin-form-textarea"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Additional details about this expense..."
                  />
                </div>
              </div>

              <div className="fin-modal-ftr">
                <button type="button" className="fin-btn fin-btn-outline" onClick={closeAdd}>
                  Cancel
                </button>
                <button type="submit" className="fin-btn fin-btn-primary" disabled={submitting}>
                  {submitting && <Loader size={14} className="fin-spin" />}
                  {submitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewTarget && (
        <div className="fin-modal-overlay" onClick={closeReview}>
          <div className="fin-modal sm" onClick={e => e.stopPropagation()}>
            <div className="fin-modal-hdr">
              <div>
                <h2 className="fin-modal-title">Review Claim</h2>
                <p className="fin-modal-sub">{reviewTarget.title}</p>
              </div>
              <button className="fin-modal-close" onClick={closeReview}><X size={16} /></button>
            </div>

            <div className="fin-modal-body">
              <div className="fin-detail-grid">
                <div className="fin-detail-item">
                  <div className="fin-detail-label">Employee</div>
                  <div className="fin-detail-value">{reviewTarget.employeeId?.name || "—"}</div>
                </div>
                <div className="fin-detail-item">
                  <div className="fin-detail-label">Amount</div>
                  <div className="fin-detail-value" style={{ color: "var(--accent)" }}>{fmt(reviewTarget.amount)}</div>
                </div>
                <div className="fin-detail-item">
                  <div className="fin-detail-label">Category</div>
                  <div className="fin-detail-value">{CAT_LABELS[reviewTarget.category] || reviewTarget.category}</div>
                </div>
                <div className="fin-detail-item">
                  <div className="fin-detail-label">Expense Date</div>
                  <div className="fin-detail-value">{fmtDate(reviewTarget.date)}</div>
                </div>
              </div>

              {reviewTarget.description && (
                <div className="fin-form-group">
                  <label className="fin-form-label">Description</label>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    {reviewTarget.description}
                  </p>
                </div>
              )}

              <div className="fin-form-group" style={{ marginTop: 14 }}>
                <label className="fin-form-label">
                  Review Note <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <textarea
                  className="fin-form-textarea"
                  rows={3}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Leave a note for the employee..."
                />
              </div>
            </div>

            <div className="fin-modal-ftr">
              <button className="fin-btn fin-btn-outline" onClick={closeReview} disabled={submitting}>
                Cancel
              </button>
              <button
                className="fin-btn fin-btn-danger"
                disabled={submitting}
                onClick={() => handleReview("rejected")}
              >
                {submitting && <Loader size={14} className="fin-spin" />}
                Reject
              </button>
              <button
                className="fin-btn fin-btn-success"
                disabled={submitting}
                onClick={() => handleReview("approved")}
              >
                {submitting && <Loader size={14} className="fin-spin" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
