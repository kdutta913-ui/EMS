import React, { useState, useEffect, useCallback } from "react";
import "../Hrdash.css";
import { api } from "../../../utils/api";

const CATEGORIES = [
  { key: "all",        label: "All"           },
  { key: "pf_esi",     label: "PF & ESI"      },
  { key: "labour_law", label: "Labour Law"     },
  { key: "policy",     label: "Policy"         },
  { key: "contract",   label: "Contract"       },
  { key: "tax",        label: "Tax"            },
  { key: "other",      label: "Other"          },
];

const PRIORITY_COLOR = { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" };
const STATUS_NEXT    = { pending: "inprogress", inprogress: "completed", completed: "pending", overdue: "inprogress" };

const EMPTY_FORM = { title: "", category: "other", description: "", dueDate: "", priority: "medium", assignedTo: "" };

export default function Compliance() {
  const [items,      setItems]      = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [catFilter,  setCatFilter]  = useState("all");
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ciData, empData] = await Promise.all([
        api.get("/compliance"),
        api.get("/employees?limit=100"),
      ]);
      setItems(ciData.items || []);
      setEmployees(empData.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.dueDate)     delete payload.dueDate;
      if (!payload.assignedTo)  delete payload.assignedTo;
      await api.post("/compliance", payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      flash("Compliance item added!");
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleStatusCycle = async (item) => {
    try {
      const next = STATUS_NEXT[item.status];
      const data = await api.put(`/compliance/${item._id}`, { status: next });
      setItems(prev => prev.map(i => i._id === item._id ? data.item : i));
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this compliance item?")) return;
    try {
      await api.delete(`/compliance/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      flash("Item deleted.");
    } catch (err) { alert(err.message); }
  };

  const filtered = catFilter === "all" ? items : items.filter(i => i.category === catFilter);

  const stats = {
    total:     items.length,
    pending:   items.filter(i => i.status === "pending").length,
    overdue:   items.filter(i => i.status === "overdue").length,
    completed: items.filter(i => i.status === "completed").length,
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;

  return (
    <>
      {successMsg && (
        <div style={{ background: "var(--success-light)", color: "var(--success)", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          ["Total Items",   stats.total,     "var(--accent)"   ],
          ["Pending",       stats.pending,   "var(--warning)"  ],
          ["Overdue",       stats.overdue,   "var(--danger)"   ],
          ["Completed",     stats.completed, "var(--success)"  ],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `4px solid ${color}`, borderRadius: "var(--radius)", padding: "18px 22px", boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Category filter + Add button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", borderRadius: 10, padding: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map(({ key, label }) => (
            <button key={key} onClick={() => setCatFilter(key)}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: catFilter === key ? "var(--surface)" : "transparent",
                color:      catFilter === key ? "var(--accent)"  : "var(--text-secondary)",
                boxShadow:  catFilter === key ? "var(--shadow)"  : "none",
              }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
          style={{ padding: "9px 20px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          {showForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="hr-card" style={{ marginBottom: 20 }}>
          <div className="hr-card-header"><span className="hr-card-title">New Compliance Item</span></div>
          <div className="hr-card-body">
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Title *</label>
                  <input style={inputStyle} type="text" placeholder="e.g., PF Filing for June 2025" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c.key !== "all").map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select style={inputStyle} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Assigned To</label>
                  <select style={inputStyle} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="">— unassigned —</option>
                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} placeholder="Describe the compliance requirement…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={saving} style={btnPrimary}>
                {saving ? "Saving…" : "Add Compliance Item"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="hr-card">
        <div className="hr-card-header">
          <span className="hr-card-title">{catFilter === "all" ? "All Items" : CATEGORIES.find(c => c.key === catFilter)?.label} ({filtered.length})</span>
        </div>
        <div className="hr-card-body" style={{ padding: "0 20px 20px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📜</div>
              <div style={{ fontWeight: 600 }}>No compliance items found</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Click "+ Add Item" to create your first compliance task.</div>
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const isOverdue = item.status === "overdue";
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="hr-emp-name">{item.title}</div>
                        {item.description && <div className="hr-emp-id" style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>}
                      </td>
                      <td>
                        <span style={{ padding: "3px 10px", borderRadius: 12, background: "var(--surface-2)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                          {CATEGORIES.find(c => c.key === item.category)?.label || item.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 13, color: PRIORITY_COLOR[item.priority] }}>
                          {item.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 14, color: isOverdue ? "var(--danger)" : "var(--text-primary)", fontWeight: isOverdue ? 700 : 400 }}>
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td style={{ fontSize: 14 }}>{item.assignedTo?.name || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}</td>
                      <td>
                        <button onClick={() => handleStatusCycle(item)}
                          className={`hr-tag ${item.status}`}
                          style={{ border: "none", cursor: "pointer", fontFamily: "inherit" }}
                          title="Click to advance status">
                          {item.status}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => handleDelete(item._id)}
                          style={{ padding: "6px 12px", borderRadius: 8, background: "var(--danger-light)", color: "var(--danger)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 };
const inputStyle  = { padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--surface)", fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box" };
const btnPrimary  = { padding: "9px 22px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 };
