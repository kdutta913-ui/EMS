import React, { useState, useEffect, useCallback } from "react";
import "../Finance.css";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, Plus, X, Loader } from "lucide-react";
import { api } from "../../../utils/api";

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "—";

const CAT_LABELS = {
  tax:         "Tax",
  pf_esi:      "PF / ESI",
  labour_law:  "Labour Law",
  policy:      "Policy",
  contract:    "Contract",
  other:       "Other",
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const EMPTY_FORM = {
  title: "", category: "tax", priority: "medium",
  dueDate: "", description: "", notes: "", assignedTo: "",
};

function dueSoon(d) {
  if (!d) return false;
  const diff = new Date(d) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isOverdue(d) {
  return d && new Date(d) < new Date();
}

export default function TaxCompliance() {
  const [items,     setItems]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");

  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.get("/compliance");
      setItems(data.items || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    api.get("/employees").then(d => setEmployees(d.employees || [])).catch(() => {});
  }, [fetchItems]);

  const byStatus  = (s) => items.filter(i => i.status === s);
  const displayed = filter === "all"
    ? [...items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    : items.filter(i => i.status === filter);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      title:      item.title      || "",
      category:   item.category   || "tax",
      priority:   item.priority   || "medium",
      dueDate:    item.dueDate    ? new Date(item.dueDate).toISOString().slice(0, 10) : "",
      description: item.description || "",
      notes:      item.notes      || "",
      assignedTo: item.assignedTo?._id || item.assignedTo || "",
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/compliance/${editTarget._id}`, form);
      } else {
        await api.post("/compliance", form);
      }
      fetchItems();
      closeForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/compliance/${id}`, { status });
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this compliance item?")) return;
    try {
      await api.delete(`/compliance/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const dueSoonCount = items.filter(i => dueSoon(i.dueDate) && i.status !== "completed").length;

  return (
    <>
      {/* Stats */}
      <div className="fin-stats-grid">
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Items</span>
            <div className="fin-stat-icon blue"><ShieldCheck size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{items.length}</div>
          <div className="fin-stat-meta">Compliance tasks tracked</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Overdue</span>
            <div className="fin-stat-icon red"><AlertTriangle size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("overdue").length}</div>
          <div className="fin-stat-meta">
            {byStatus("overdue").length > 0
              ? <span className="danger">Needs immediate attention</span>
              : "None overdue"}
          </div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Due This Week</span>
            <div className="fin-stat-icon amber"><Clock size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{dueSoonCount}</div>
          <div className="fin-stat-meta">
            {dueSoonCount > 0 ? <span className="warn">Upcoming deadlines</span> : "All clear"}
          </div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Completed</span>
            <div className="fin-stat-icon green"><CheckCircle size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{byStatus("completed").length}</div>
          <div className="fin-stat-meta">
            {items.length > 0
              ? `${Math.round((byStatus("completed").length / items.length) * 100)}% completion rate`
              : "No items yet"}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="fin-card">
        <div className="fin-card-header">
          <div className="fin-tabs">
            {[
              { key: "all",        label: "All" },
              { key: "pending",    label: "Pending" },
              { key: "inprogress", label: "In Progress" },
              { key: "overdue",    label: "Overdue" },
              { key: "completed",  label: "Completed" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`fin-tab${filter === key ? " active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
                {key !== "all" && byStatus(key).length > 0 && (
                  <span
                    className="fin-tab-badge"
                    style={key === "overdue" ? { background: "var(--danger)" } : {}}
                  >
                    {byStatus(key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button className="fin-card-action" onClick={openAdd}>
            <Plus size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Add Item
          </button>
        </div>

        <div className="fin-card-body" style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : displayed.length === 0 ? (
            <div className="fin-empty">
              <div className="fin-empty-icon">📊</div>
              <div className="fin-empty-title">No compliance items</div>
              <div className="fin-empty-sub">Click "+ Add Item" to track TDS, PF, GST and other deadlines.</div>
            </div>
          ) : (
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(item => {
                  const over = item.status !== "completed" && isOverdue(item.dueDate);
                  const soon = item.status !== "completed" && dueSoon(item.dueDate);
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="fin-emp-name">{item.title}</div>
                        {item.description && (
                          <div className="fin-emp-dept" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td><span className="fin-chip">{CAT_LABELS[item.category] || item.category}</span></td>
                      <td>
                        <span className={`fin-tag ${item.priority}`}>
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: over ? "var(--danger)" : soon ? "var(--warning)" : "var(--text-primary)",
                        }}>
                          {fmtDate(item.dueDate)}
                        </span>
                        {over && <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>OVERDUE</div>}
                        {soon && !over && <div style={{ fontSize: 11, color: "var(--warning)", fontWeight: 600 }}>Due soon</div>}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {item.assignedTo?.name || <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        <select
                          className="fin-form-select"
                          value={item.status}
                          style={{ padding: "4px 8px", fontSize: 13, borderRadius: 7 }}
                          onChange={e => handleStatusChange(item._id, e.target.value)}
                          disabled={item.status === "completed"}
                        >
                          <option value="pending">Pending</option>
                          <option value="inprogress">In Progress</option>
                          <option value="overdue">Overdue</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="fin-action-btn fin-action-edit"
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </button>
                          {item.status !== "completed" && (
                            <button
                              className="fin-action-btn fin-action-approve"
                              onClick={() => handleStatusChange(item._id, "completed")}
                            >
                              Done
                            </button>
                          )}
                          <button
                            className="fin-action-btn fin-action-delete"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fin-modal-overlay" onClick={closeForm}>
          <div className="fin-modal" onClick={e => e.stopPropagation()}>
            <div className="fin-modal-hdr">
              <div>
                <h2 className="fin-modal-title">
                  {editTarget ? "Edit Compliance Item" : "New Compliance Item"}
                </h2>
                <p className="fin-modal-sub">Track a tax or regulatory deadline</p>
              </div>
              <button className="fin-modal-close" onClick={closeForm}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="fin-modal-body">
                <div className="fin-form-group">
                  <label className="fin-form-label">Title *</label>
                  <input
                    className="fin-form-input"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Q2 TDS Filing"
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
                    <label className="fin-form-label">Priority *</label>
                    <select
                      className="fin-form-select"
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="fin-form-row cols-2" style={{ marginBottom: 14 }}>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Due Date</label>
                    <input
                      className="fin-form-input"
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="fin-form-group" style={{ marginBottom: 0 }}>
                    <label className="fin-form-label">Assigned To</label>
                    <select
                      className="fin-form-select"
                      value={form.assignedTo}
                      onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    >
                      <option value="">— Unassigned —</option>
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
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What needs to be done..."
                  />
                </div>

                <div className="fin-form-group">
                  <label className="fin-form-label">Notes</label>
                  <textarea
                    className="fin-form-textarea"
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes, reference numbers..."
                  />
                </div>
              </div>

              <div className="fin-modal-ftr">
                <button type="button" className="fin-btn fin-btn-outline" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="fin-btn fin-btn-primary" disabled={submitting}>
                  {submitting && <Loader size={14} className="fin-spin" />}
                  {submitting ? "Saving..." : editTarget ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
