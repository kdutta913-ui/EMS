import React, { useState, useEffect, useCallback } from "react";
import "../Hrdash.css";
import { api } from "../../../utils/api";

const CATEGORY_LABELS = {
  documents: "Documents",
  it_setup:  "IT Setup",
  hr_setup:  "HR Setup",
  induction: "Induction",
  other:     "Other",
};

const STATUS_CYCLE = { pending: "inprogress", inprogress: "completed", completed: "pending" };

const progressPct = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  return Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100);
};

export default function Onboarding() {
  const [tab, setTab] = useState("joiners");

  // Recent Joiners
  const [recentEmps, setRecentEmps] = useState([]);

  // Checklists
  const [checklists,    setChecklists]    = useState([]);
  const [allEmployees,  setAllEmployees]  = useState([]);
  const [expanded,      setExpanded]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newEmpId,      setNewEmpId]      = useState("");
  const [addingTask,    setAddingTask]    = useState(null);
  const [newTaskTitle,  setNewTaskTitle]  = useState("");
  const [newTaskCat,    setNewTaskCat]    = useState("other");
  const [saving,        setSaving]        = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const [empData, clData] = await Promise.all([
        api.get("/employees?status=active&limit=100"),
        api.get("/onboarding"),
      ]);
      const emps = empData.employees || [];
      setAllEmployees(emps);
      setRecentEmps(emps.filter(e => e.dateOfJoining && new Date(e.dateOfJoining) >= thirtyAgo));
      setChecklists(clData.checklists || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const checkedIds = new Set(checklists.map(c => c.employeeId?._id || c.employeeId));
  const uncheckedEmps = allEmployees.filter(e => !checkedIds.has(e._id));

  const handleCreateChecklist = async () => {
    if (!newEmpId) return;
    setSaving(true);
    try {
      await api.post("/onboarding", { employeeId: newEmpId });
      setNewEmpId("");
      setShowAddForm(false);
      flash("Checklist created!");
      await loadAll();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleToggleTask = async (checklist, taskId, currentStatus) => {
    const nextStatus = STATUS_CYCLE[currentStatus];
    try {
      const data = await api.put(`/onboarding/${checklist._id}/task/${taskId}`, { status: nextStatus });
      setChecklists(prev => prev.map(c => c._id === checklist._id ? data.checklist : c));
    } catch (err) { alert(err.message); }
  };

  const handleAddTask = async (checklist) => {
    if (!newTaskTitle.trim()) return;
    setSaving(true);
    try {
      const data = await api.post(`/onboarding/${checklist._id}/task`, { title: newTaskTitle.trim(), category: newTaskCat });
      setChecklists(prev => prev.map(c => c._id === checklist._id ? data.checklist : c));
      setAddingTask(null);
      setNewTaskTitle("");
      setNewTaskCat("other");
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteTask = async (checklist, taskId) => {
    try {
      await api.delete(`/onboarding/${checklist._id}/task/${taskId}`);
      setChecklists(prev => prev.map(c => c._id === checklist._id
        ? { ...c, tasks: c.tasks.filter(t => t._id !== taskId) }
        : c
      ));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <>
      {successMsg && (
        <div style={{ background: "var(--success-light)", color: "var(--success)", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface-2)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[["joiners", "Recent Joiners"], ["checklists", "Onboarding Checklists"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              background: tab === key ? "var(--surface)" : "transparent",
              color: tab === key ? "var(--accent)" : "var(--text-secondary)",
              boxShadow: tab === key ? "var(--shadow)" : "none",
              transition: "all 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Recent Joiners ── */}
      {tab === "joiners" && (
        <div className="hr-card">
          <div className="hr-card-header">
            <span className="hr-card-title">Recent Joiners (Last 30 Days)</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{recentEmps.length} employee{recentEmps.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="hr-card-body">
            {recentEmps.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 600 }}>No new joiners in the last 30 days</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>New employees registered within the past 30 days will appear here.</div>
              </div>
            ) : (
              recentEmps.map(e => (
                <div className="hr-boarding-item" key={e._id}>
                  <div className="hr-boarding-info">
                    <div className="hr-boarding-name">{e.name}</div>
                    <div className="hr-boarding-meta">
                      {e.role || e.designation || "—"} · {e.department} · Joined {new Date(e.dateOfJoining).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className={`hr-tag ${e.status}`}>
                    {e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: Onboarding Checklists ── */}
      {tab === "checklists" && (
        <>
          <div className="hr-card" style={{ marginBottom: 20 }}>
            <div className="hr-card-header">
              <span className="hr-card-title">Onboarding Checklists ({checklists.length})</span>
              <button className="hr-card-action" onClick={() => { setShowAddForm(!showAddForm); setNewEmpId(""); }}>
                {showAddForm ? "Cancel" : "+ Assign Checklist"}
              </button>
            </div>

            {showAddForm && (
              <div className="hr-card-body" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Select Employee</label>
                    <select value={newEmpId} onChange={e => setNewEmpId(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "var(--surface)" }}>
                      <option value="">— choose employee —</option>
                      {uncheckedEmps.map(e => (
                        <option key={e._id} value={e._id}>{e.name} ({e.department})</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleCreateChecklist} disabled={!newEmpId || saving}
                    style={{ padding: "9px 20px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14, opacity: (!newEmpId || saving) ? 0.6 : 1 }}>
                    {saving ? "Creating…" : "Create Checklist"}
                  </button>
                </div>
                {uncheckedEmps.length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>All active employees already have a checklist assigned.</p>
                )}
              </div>
            )}

            {/* Summary table */}
            <div className="hr-card-body" style={{ padding: "0 20px 20px" }}>
              {checklists.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No checklists yet</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Click "+ Assign Checklist" to create one for a new joiner.</div>
                </div>
              ) : (
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Dept</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklists.map(cl => {
                      const emp = cl.employeeId || {};
                      const pct = progressPct(cl.tasks);
                      return (
                        <React.Fragment key={cl._id}>
                          <tr>
                            <td>
                              <div className="hr-emp-name">{emp.name || "—"}</div>
                              <div className="hr-emp-id">{emp.employeeCode}</div>
                            </td>
                            <td style={{ fontSize: 14, color: "var(--text-secondary)" }}>{emp.department || "—"}</td>
                            <td style={{ minWidth: 160 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: pct === 100 ? "var(--success)" : "var(--accent)", transition: "width 0.3s" }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36, color: "var(--text-primary)" }}>{pct}%</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                {cl.tasks.filter(t => t.status === "completed").length}/{cl.tasks.length} tasks done
                              </div>
                            </td>
                            <td><span className={`hr-tag ${cl.overallStatus}`}>{cl.overallStatus}</span></td>
                            <td style={{ textAlign: "right" }}>
                              <button onClick={() => setExpanded(expanded === cl._id ? null : cl._id)}
                                style={{ padding: "6px 14px", borderRadius: 8, background: "var(--accent-light)", color: "var(--accent)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                                {expanded === cl._id ? "Hide" : "View Tasks"}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded task list */}
                          {expanded === cl._id && (
                            <tr>
                              <td colSpan={5} style={{ background: "var(--bg)", padding: 0 }}>
                                <div style={{ padding: "16px 24px" }}>
                                  {cl.tasks.map(task => (
                                    <div key={task._id} style={{
                                      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                                      borderBottom: "1px solid var(--border)",
                                    }}>
                                      {/* Status toggle */}
                                      <button onClick={() => handleToggleTask(cl, task._id, task.status)}
                                        style={{
                                          width: 24, height: 24, borderRadius: 6, border: "2px solid",
                                          borderColor: task.status === "completed" ? "var(--success)" : task.status === "inprogress" ? "var(--accent)" : "var(--border)",
                                          background: task.status === "completed" ? "var(--success)" : task.status === "inprogress" ? "var(--accent-light)" : "transparent",
                                          cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                        {task.status === "completed" && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                                        {task.status === "inprogress" && <span style={{ color: "var(--accent)", fontSize: 10, fontWeight: 700 }}>▶</span>}
                                      </button>
                                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: task.status === "completed" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                                        {task.title}
                                      </span>
                                      <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12, background: "var(--surface-2)", color: "var(--text-muted)" }}>
                                        {CATEGORY_LABELS[task.category] || task.category}
                                      </span>
                                      <span className={`hr-tag ${task.status}`} style={{ fontSize: 12, padding: "3px 10px" }}>{task.status}</span>
                                      <button onClick={() => handleDeleteTask(cl, task._id)}
                                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.6 }}
                                        title="Remove task">×</button>
                                    </div>
                                  ))}

                                  {/* Add task inline */}
                                  {addingTask === cl._id ? (
                                    <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                                      <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                                        placeholder="Task title…"
                                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14 }}
                                        onKeyDown={e => e.key === "Enter" && handleAddTask(cl)} />
                                      <select value={newTaskCat} onChange={e => setNewTaskCat(e.target.value)}
                                        style={{ padding: "8px 10px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13 }}>
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                      </select>
                                      <button onClick={() => handleAddTask(cl)} disabled={saving}
                                        style={{ padding: "8px 16px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                                        Add
                                      </button>
                                      <button onClick={() => { setAddingTask(null); setNewTaskTitle(""); }}
                                        style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface-2)", border: "none", cursor: "pointer", fontSize: 13 }}>
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAddingTask(cl._id); setNewTaskTitle(""); setNewTaskCat("other"); }}
                                      style={{ marginTop: 12, padding: "7px 16px", borderRadius: 8, background: "var(--surface-2)", border: "1.5px dashed var(--border)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                      + Add Task
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
