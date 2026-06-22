import React, { useState, useEffect, useCallback } from "react";
import "../Hrdash.css";
import { api } from "../../../utils/api";

const INTERVIEW_STATUS = ["pending", "scheduled", "completed"];
const SETTLEMENT_STATUS = ["pending", "processing", "completed"];
const OB_STATUS = ["initiated", "inprogress", "completed"];

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `4px solid ${color}`, borderRadius: "var(--radius)", padding: "20px 24px", boxShadow: "var(--shadow)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

export default function Offboarding() {
  const [offboardings,  setOffboardings]  = useState([]);
  const [employees,     setEmployees]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedId,    setSelectedId]    = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");

  const [form, setForm] = useState({ employeeId: "", exitDate: "", reason: "" });

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [obData, empData] = await Promise.all([
        api.get("/offboarding"),
        api.get("/employees?limit=100"),
      ]);
      setOffboardings(obData.offboardings || []);
      setEmployees(empData.employees || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) { alert("Select an employee"); return; }
    setSaving(true);
    try {
      await api.post("/offboarding", { employeeId: form.employeeId, exitDate: form.exitDate || undefined, reason: form.reason });
      setForm({ employeeId: "", exitDate: "", reason: "" });
      setShowForm(false);
      flash("Offboarding initiated!");
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const updateOb = async (id, updates) => {
    try {
      const data = await api.put(`/offboarding/${id}`, updates);
      setOffboardings(prev => prev.map(o => o._id === id ? data.offboarding : o));
      if (selectedId === id) setSelectedId(id);
    } catch (err) { alert(err.message); }
  };

  const toggleAsset = (ob, idx) => {
    const assets = ob.assets.map((a, i) =>
      i === idx ? { ...a, status: a.status === "pending" ? "returned" : "pending" } : a
    );
    updateOb(ob._id, { assets });
  };

  const toggleAccess = (ob, key) => {
    updateOb(ob._id, { accessRevocation: { ...ob.accessRevocation, [key]: !ob.accessRevocation[key] } });
  };

  const selected = offboardings.find(o => o._id === selectedId);

  const stats = {
    total:      offboardings.length,
    inprogress: offboardings.filter(o => o.status !== "completed").length,
    interview:  offboardings.filter(o => o.exitInterviewStatus !== "completed").length,
    assets:     offboardings.filter(o => o.assets?.some(a => a.status === "pending")).length,
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
        <StatCard label="Total Offboardings" value={stats.total}      color="var(--accent)"   />
        <StatCard label="In Progress"         value={stats.inprogress} color="var(--warning)"  />
        <StatCard label="Pending Interviews"  value={stats.interview}  color="var(--danger)"   />
        <StatCard label="Pending Asset Returns" value={stats.assets}   color="#8b5cf6"         />
      </div>

      {/* List + Form */}
      <div className="hr-card" style={{ marginBottom: 20 }}>
        <div className="hr-card-header">
          <span className="hr-card-title">Offboarding Records ({offboardings.length})</span>
          <button className="hr-card-action" onClick={() => { setShowForm(!showForm); setForm({ employeeId: "", exitDate: "", reason: "" }); }}>
            {showForm ? "Cancel" : "Initiate Offboarding"}
          </button>
        </div>

        {showForm && (
          <div className="hr-card-body" style={{ borderBottom: "1px solid var(--border)" }}>
            <form onSubmit={handleInitiate}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Employee *</label>
                  <select style={inputStyle} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                    <option value="">— select employee —</option>
                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Last Working Day</label>
                  <input style={inputStyle} type="date" value={form.exitDate} onChange={e => setForm({ ...form, exitDate: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Reason / Remarks</label>
                  <input style={inputStyle} type="text" placeholder="Resignation, contract end…" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={saving} style={btnStyle}>
                {saving ? "Initiating…" : "Initiate Offboarding"}
              </button>
            </form>
          </div>
        )}

        <div className="hr-card-body" style={{ padding: "0 20px 20px" }}>
          {offboardings.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚪</div>
              <div style={{ fontWeight: 600 }}>No offboarding records yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Click "Initiate Offboarding" to start a new exit process.</div>
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Exit Date</th>
                  <th>Exit Interview</th>
                  <th>Assets</th>
                  <th>Settlement</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offboardings.map(ob => {
                  const emp = ob.employeeId || {};
                  const returnedCount = ob.assets?.filter(a => a.status === "returned").length || 0;
                  return (
                    <tr key={ob._id}>
                      <td>
                        <div className="hr-emp-name">{emp.name || "—"}</div>
                        <div className="hr-emp-id">{emp.department}</div>
                      </td>
                      <td style={{ fontSize: 14 }}>{ob.exitDate ? new Date(ob.exitDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td><span className={`hr-tag ${ob.exitInterviewStatus}`}>{ob.exitInterviewStatus}</span></td>
                      <td style={{ fontSize: 14 }}>{returnedCount}/{ob.assets?.length || 0} returned</td>
                      <td><span className={`hr-tag ${ob.finalSettlement?.status || "pending"}`}>{ob.finalSettlement?.status || "pending"}</span></td>
                      <td><span className={`hr-tag ${ob.status}`}>{ob.status}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => setSelectedId(selectedId === ob._id ? null : ob._id)}
                          style={{ padding: "6px 14px", borderRadius: 8, background: "var(--accent-light)", color: "var(--accent)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                          {selectedId === ob._id ? "Close" : "Manage"}
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

      {/* Detail panel */}
      {selected && (
        <div className="hr-card">
          <div className="hr-card-header">
            <span className="hr-card-title">Managing: {selected.employeeId?.name || "Employee"}</span>
            <button className="hr-card-action" onClick={() => setSelectedId(null)}>Close</button>
          </div>
          <div className="hr-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Exit Interview */}
              <Section title="Exit Interview">
                <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  {INTERVIEW_STATUS.map(s => (
                    <button key={s} onClick={() => updateOb(selected._id, { exitInterviewStatus: s })}
                      style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        borderColor: selected.exitInterviewStatus === s ? "var(--accent)" : "var(--border)",
                        background: selected.exitInterviewStatus === s ? "var(--accent)" : "transparent",
                        color: selected.exitInterviewStatus === s ? "#fff" : "var(--text-secondary)",
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>Interview Date</label>
                  <input type="date" style={{ ...inputStyle, width: "auto" }}
                    value={selected.exitInterviewDate ? selected.exitInterviewDate.slice(0, 10) : ""}
                    onChange={e => updateOb(selected._id, { exitInterviewDate: e.target.value || null })} />
                </div>
              </Section>

              {/* Asset Return */}
              <Section title="Asset Return">
                {selected.assets?.map((asset, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <input type="checkbox" checked={asset.status === "returned"}
                      onChange={() => toggleAsset(selected, i)}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--success)" }} />
                    <span style={{ flex: 1, fontSize: 14 }}>{asset.name}</span>
                    <span className={`hr-tag ${asset.status === "returned" ? "completed" : "pending"}`} style={{ fontSize: 12 }}>
                      {asset.status}
                    </span>
                  </div>
                ))}
                {(!selected.assets || selected.assets.length === 0) && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No assets tracked.</p>
                )}
              </Section>

              {/* Access Revocation */}
              <Section title="Access Revocation">
                {["email", "vpn", "building", "systems"].map(key => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <input type="checkbox" checked={!!selected.accessRevocation?.[key]}
                      onChange={() => toggleAccess(selected, key)}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--success)" }} />
                    <span style={{ flex: 1, fontSize: 14, textTransform: "capitalize" }}>{key} Access</span>
                    <span className={`hr-tag ${selected.accessRevocation?.[key] ? "completed" : "pending"}`} style={{ fontSize: 12 }}>
                      {selected.accessRevocation?.[key] ? "Revoked" : "Pending"}
                    </span>
                  </div>
                ))}
              </Section>

              {/* Final Settlement */}
              <Section title="Final Settlement">
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {SETTLEMENT_STATUS.map(s => (
                    <button key={s} onClick={() => updateOb(selected._id, { finalSettlement: { ...selected.finalSettlement, status: s } })}
                      style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        borderColor: selected.finalSettlement?.status === s ? "var(--accent)" : "var(--border)",
                        background: selected.finalSettlement?.status === s ? "var(--accent)" : "transparent",
                        color: selected.finalSettlement?.status === s ? "#fff" : "var(--text-secondary)",
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>Settlement Amount (₹)</label>
                  <input type="number" style={{ ...inputStyle, width: "100%" }}
                    value={selected.finalSettlement?.amount || ""}
                    onChange={e => updateOb(selected._id, { finalSettlement: { ...selected.finalSettlement, amount: Number(e.target.value) } })} />
                </div>
              </Section>

            </div>

            {/* Overall status + notes */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>Overall Status</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {OB_STATUS.map(s => (
                    <button key={s} onClick={() => updateOb(selected._id, { status: s })}
                      style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        borderColor: selected.status === s ? "var(--accent)" : "var(--border)",
                        background: selected.status === s ? "var(--accent)" : "transparent",
                        color: selected.status === s ? "#fff" : "var(--text-secondary)",
                      }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 2, minWidth: 260 }}>
                <label style={labelStyle}>Notes</label>
                <textarea rows={2} style={{ ...inputStyle, resize: "vertical", width: "100%" }}
                  placeholder="Add any notes…"
                  value={selected.notes || ""}
                  onChange={e => updateOb(selected._id, { notes: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 };
const inputStyle  = { padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--surface)", fontFamily: "Inter, sans-serif", width: "100%" };
const btnStyle    = { padding: "9px 22px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 };
