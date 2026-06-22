import React, { useState, useEffect, useCallback } from "react";
import "../Finance.css";
import { CreditCard, Clock, CheckCircle, Plus, X, Loader } from "lucide-react";
import { api } from "../../../utils/api";

const fmt     = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const CAT_LABELS = {
  travel: "Travel", medical: "Medical", internet: "Internet",
  mobile: "Mobile", equipment: "Equipment", other: "Other",
};

const PAYMENT_LABELS = {
  bank_transfer: "Bank Transfer",
  cash:          "Cash",
  cheque:        "Cheque",
};

const EMPTY_FORM = { title: "", category: "travel", amount: "", employeeId: "", notes: "" };

export default function Reimbursements() {
  const [reimbursements, setReimbursements] = useState([]);
  const [employees,      setEmployees]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState("all");

  const [showAdd,       setShowAdd]       = useState(false);
  const [disburseTarget, setDisburseTarget] = useState(null);
  const [paymentMethod,  setPaymentMethod]  = useState("bank_transfer");
  const [disburseNote,   setDisburseNote]   = useState("");
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [submitting,     setSubmitting]     = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.get("/reimbursements");
      setReimbursements(data.reimbursements || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    api.get("/employees").then(d => setEmployees(d.employees || [])).catch(() => {});
  }, [fetchData]);

  const byStatus  = (s) => reimbursements.filter(r => r.status === s);
  const totalAmt  = (s) => byStatus(s).reduce((a, r) => a + (r.amount || 0), 0);
  const displayed = filter === "all" ? reimbursements : reimbursements.filter(r => r.status === filter);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/reimbursements", { ...form, amount: Number(form.amount) });
      fetchData();
      setShowAdd(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburse = async () => {
    if (!disburseTarget) return;
    setSubmitting(true);
    try {
      await api.patch(`/reimbursements/${disburseTarget._id}/disburse`, {
        paymentMethod,
        notes: disburseNote,
      });
      fetchData();
      setDisburseTarget(null);
      setPaymentMethod("bank_transfer");
      setDisburseNote("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this reimbursement?")) return;
    try {
      await api.delete(`/reimbursements/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const closeAdd      = () => { setShowAdd(false); setForm(EMPTY_FORM); };
  const closeDisburse = () => { setDisburseTarget(null); setPaymentMethod("bank_transfer"); setDisburseNote(""); };

  return (
    <>
      {/* Stats */}
      <div className="fin-stats-grid">
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total</span>
            <div className="fin-stat-icon blue"><CreditCard size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{reimbursements.length}</div>
          <div className="fin-stat-meta">{fmt(reimbursements.reduce((a, r) => a + (r.amount || 0), 0))} total</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Pending Disbursement</span>
            <div className="fin-stat-icon amber"><Clock size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("pending").length}</div>
          <div className="fin-stat-meta">{fmt(totalAmt("pending"))} to disburse</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Disbursed</span>
            <div className="fin-stat-icon green"><CheckCircle size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("disbursed").length}</div>
          <div className="fin-stat-meta">{fmt(totalAmt("disbursed"))} paid out</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Rejected</span>
            <div className="fin-stat-icon red"><X size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("rejected").length}</div>
          <div className="fin-stat-meta">{fmt(totalAmt("rejected"))} rejected</div>
        </div>
      </div>

      {/* Table card */}
      <div className="fin-card">
        <div className="fin-card-header">
          <div className="fin-tabs">
            {["all", "pending", "disbursed", "rejected"].map(s => (
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
            <Plus size={14} style={{ display: "inline", verticalAlign: "middle" }} /> New Reimbursement
          </button>
        </div>

        <div className="fin-card-body" style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : displayed.length === 0 ? (
            <div className="fin-empty">
              <div className="fin-empty-icon">💸</div>
              <div className="fin-empty-title">No reimbursements found</div>
              <div className="fin-empty-sub">
                Reimbursements are auto-created when expense claims are approved, or add one manually.
              </div>
            </div>
          ) : (
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Title / Source</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="fin-emp-name">{r.employeeId?.name || "—"}</div>
                      <div className="fin-emp-dept">{r.employeeId?.department || ""}</div>
                    </td>
                    <td>
                      <div className="fin-emp-name">{r.title}</div>
                      <div className="fin-emp-dept">
                        {r.claimId ? "From expense claim" : "Manual entry"}
                      </div>
                    </td>
                    <td><span className="fin-chip">{CAT_LABELS[r.category] || r.category || "—"}</span></td>
                    <td><span className="fin-amount">{fmt(r.amount)}</span></td>
                    <td>
                      <div>
                        <span className={`fin-tag ${r.status}`}>
                          {r.status === "disbursed" ? "Disbursed" : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                        {r.status === "disbursed" && r.disbursedAt && (
                          <div className="fin-emp-dept" style={{ marginTop: 3 }}>
                            {fmtDate(r.disbursedAt)} · {PAYMENT_LABELS[r.paymentMethod] || r.paymentMethod}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.status === "pending" && (
                          <button
                            className="fin-action-btn fin-action-disburse"
                            onClick={() => setDisburseTarget(r)}
                          >
                            Disburse
                          </button>
                        )}
                        <button
                          className="fin-action-btn fin-action-delete"
                          onClick={() => handleDelete(r._id)}
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

      {/* ── Add Reimbursement Modal ── */}
      {showAdd && (
        <div className="fin-modal-overlay" onClick={closeAdd}>
          <div className="fin-modal" onClick={e => e.stopPropagation()}>
            <div className="fin-modal-hdr">
              <div>
                <h2 className="fin-modal-title">New Reimbursement</h2>
                <p className="fin-modal-sub">Create a manual reimbursement record</p>
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
                    placeholder="e.g. Travel reimbursement - March"
                  />
                </div>

                <div className="fin-form-row cols-2" style={{ marginBottom: 14 }}>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Category</label>
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

                <div className="fin-form-group">
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

                <div className="fin-form-group">
                  <label className="fin-form-label">Notes</label>
                  <textarea
                    className="fin-form-textarea"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="fin-modal-ftr">
                <button type="button" className="fin-btn fin-btn-outline" onClick={closeAdd}>
                  Cancel
                </button>
                <button type="submit" className="fin-btn fin-btn-primary" disabled={submitting}>
                  {submitting && <Loader size={14} className="fin-spin" />}
                  {submitting ? "Creating..." : "Create Reimbursement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Disburse Modal ── */}
      {disburseTarget && (
        <div className="fin-modal-overlay" onClick={closeDisburse}>
          <div className="fin-modal sm" onClick={e => e.stopPropagation()}>
            <div className="fin-modal-hdr">
              <div>
                <h2 className="fin-modal-title">Disburse Payment</h2>
                <p className="fin-modal-sub">{disburseTarget.title}</p>
              </div>
              <button className="fin-modal-close" onClick={closeDisburse}><X size={16} /></button>
            </div>

            <div className="fin-modal-body">
              <div className="fin-detail-grid">
                <div className="fin-detail-item">
                  <div className="fin-detail-label">Employee</div>
                  <div className="fin-detail-value">{disburseTarget.employeeId?.name || "—"}</div>
                </div>
                <div className="fin-detail-item">
                  <div className="fin-detail-label">Amount</div>
                  <div className="fin-detail-value" style={{ color: "var(--success)" }}>
                    {fmt(disburseTarget.amount)}
                  </div>
                </div>
              </div>

              <div className="fin-form-group">
                <label className="fin-form-label">Payment Method</label>
                <select
                  className="fin-form-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="fin-form-group">
                <label className="fin-form-label">Notes <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
                <textarea
                  className="fin-form-textarea"
                  rows={3}
                  value={disburseNote}
                  onChange={e => setDisburseNote(e.target.value)}
                  placeholder="Transaction reference or additional details..."
                />
              </div>
            </div>

            <div className="fin-modal-ftr">
              <button className="fin-btn fin-btn-outline" onClick={closeDisburse} disabled={submitting}>
                Cancel
              </button>
              <button className="fin-btn fin-btn-success" onClick={handleDisburse} disabled={submitting}>
                {submitting && <Loader size={14} className="fin-spin" />}
                {submitting ? "Processing..." : "Confirm Disbursement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
