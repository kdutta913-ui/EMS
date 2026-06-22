import React, { useState, useEffect, useCallback } from "react";
import "../Hrdash.css";
import { api } from "../../../utils/api";

const DOC_TYPES = [
  { key: "all",          label: "All",          icon: "📁" },
  { key: "contract",     label: "Contracts",     icon: "📝" },
  { key: "government_id",label: "Government IDs",icon: "🪪" },
  { key: "certificate",  label: "Certificates",  icon: "🏅" },
  { key: "tax",          label: "Tax Docs",      icon: "🧾" },
  { key: "hr_policy",    label: "HR Policies",   icon: "📋" },
  { key: "other",        label: "Other",         icon: "📄" },
];

const STATUS_COLOR = { valid: "var(--success)", expiring_soon: "var(--warning)", expired: "var(--danger)" };

const EMPTY_FORM = { name: "", type: "other", employeeId: "", url: "", description: "", expiryDate: "" };

export default function Documents() {
  const [documents,  setDocuments]  = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search,     setSearch]     = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [docData, empData] = await Promise.all([
        api.get("/hrdocuments"),
        api.get("/employees?limit=100"),
      ]);
      setDocuments(docData.documents || []);
      setEmployees(empData.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("Document name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.employeeId) delete payload.employeeId;
      if (!payload.expiryDate) delete payload.expiryDate;
      if (!payload.url)        delete payload.url;
      await api.post("/hrdocuments", payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      flash("Document added!");
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await api.delete(`/hrdocuments/${id}`);
      setDocuments(prev => prev.filter(d => d._id !== id));
      flash("Document deleted.");
    } catch (err) { alert(err.message); }
  };

  const filtered = documents
    .filter(d => typeFilter === "all" || d.type === typeFilter)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.employeeId?.name?.toLowerCase().includes(search.toLowerCase()));

  const stats = DOC_TYPES.filter(t => t.key !== "all").map(t => ({
    ...t,
    count: documents.filter(d => d.type === t.key).length,
  }));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;

  return (
    <>
      {successMsg && (
        <div style={{ background: "var(--success-light)", color: "var(--success)", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map(({ key, label, icon, count }) => (
          <div key={key} onClick={() => setTypeFilter(key)}
            style={{
              background: typeFilter === key ? "var(--accent)" : "var(--surface)",
              border: `1px solid ${typeFilter === key ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius)", padding: "16px 18px", cursor: "pointer",
              boxShadow: "var(--shadow)", transition: "all 0.15s",
              color: typeFilter === key ? "#fff" : "var(--text-primary)",
            }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>{count}</div>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by name or employee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--surface)" }}
        />
        <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", borderRadius: 10, padding: 4 }}>
          <button onClick={() => setTypeFilter("all")}
            style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: typeFilter === "all" ? "var(--surface)" : "transparent",
              color: typeFilter === "all" ? "var(--accent)" : "var(--text-secondary)",
            }}>All</button>
        </div>
        <button onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
          style={{ padding: "9px 20px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          {showForm ? "Cancel" : "+ Add Document"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="hr-card" style={{ marginBottom: 20 }}>
          <div className="hr-card-header"><span className="hr-card-title">Add Document</span></div>
          <div className="hr-card-body">
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Document Name *</label>
                  <input style={inputStyle} type="text" placeholder="e.g., Offer Letter – Amit Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {DOC_TYPES.filter(t => t.key !== "all").map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Employee (optional)</label>
                  <select style={inputStyle} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                    <option value="">— company-wide —</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.department})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Expiry Date (optional)</label>
                  <input style={inputStyle} type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Document URL / Path</label>
                  <input style={inputStyle} type="text" placeholder="https://drive.google.com/… or file path" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} placeholder="Brief description of this document…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={saving} style={btnPrimary}>
                {saving ? "Saving…" : "Add Document"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="hr-card">
        <div className="hr-card-header">
          <span className="hr-card-title">
            {typeFilter === "all" ? "All Documents" : DOC_TYPES.find(t => t.key === typeFilter)?.label} ({filtered.length})
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{documents.length} total</span>
        </div>
        <div className="hr-card-body" style={{ padding: "0 20px 20px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
              <div style={{ fontWeight: 600 }}>No documents found</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {search ? "Try a different search term." : 'Click “+ Add Document” to upload your first document.'}
              </div>
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Employee</th>
                  <th>Uploaded</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const typeInfo = DOC_TYPES.find(t => t.key === doc.type);
                  return (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{typeInfo?.icon || "📄"}</span>
                          <div>
                            <div className="hr-emp-name">
                              {doc.url ? (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>
                                  {doc.name}
                                </a>
                              ) : doc.name}
                            </div>
                            {doc.description && <div className="hr-emp-id" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: "3px 10px", borderRadius: 12, background: "var(--surface-2)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                          {typeInfo?.label || doc.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 14 }}>
                        {doc.employeeId ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{doc.employeeId.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{doc.employeeId.department}</div>
                          </>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Company-wide</span>
                        )}
                      </td>
                      <td style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                        {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ fontSize: 14 }}>
                        {doc.expiryDate
                          ? <span style={{ color: STATUS_COLOR[doc.status] || "inherit", fontWeight: doc.status !== "valid" ? 700 : 400 }}>
                              {new Date(doc.expiryDate).toLocaleDateString("en-IN")}
                            </span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        <span className={`hr-tag ${doc.status === "valid" ? "active" : doc.status === "expiring_soon" ? "pending" : "rejected"}`}
                          style={{ fontSize: 12 }}>
                          {doc.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              style={{ padding: "6px 12px", borderRadius: 8, background: "var(--accent-light)", color: "var(--accent)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                              Open
                            </a>
                          )}
                          <button onClick={() => handleDelete(doc._id)}
                            style={{ padding: "6px 12px", borderRadius: 8, background: "var(--danger-light)", color: "var(--danger)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
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
    </>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 };
const inputStyle  = { padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--surface)", fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box" };
const btnPrimary  = { padding: "9px 22px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 };
