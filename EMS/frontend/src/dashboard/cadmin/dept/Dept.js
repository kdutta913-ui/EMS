import React, { useState, useEffect } from "react";
import "../CAdmin.css";
import { Building2, Plus, Users, X, Settings } from "lucide-react";
import { api } from "../../../utils/api";

const DepartmentsTeams = () => {
  const [departments, setDepartments] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ name: "", description: "" });
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const [manageDept,  setManageDept]  = useState(null);
  const [assignForm,  setAssignForm]  = useState({ managerId: "", employeeIds: [] });
  const [assigning,   setAssigning]   = useState(false);
  const [assignError, setAssignError] = useState("");
  const [empSearch,   setEmpSearch]   = useState("");

  const fetchAll = async () => {
    try {
      const [deptData, empData] = await Promise.all([
        api.get("/departments"),
        api.get("/employees?limit=200"),
      ]);
      setDepartments(deptData.departments || []);
      setEmployees(empData.employees || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) { setError("Department name is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/departments", form);
      setForm({ name: "", description: "" });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openManage = (dept) => {
    setManageDept(dept);
    setAssignForm({
      managerId: dept.managerId?._id || "",
      employeeIds: (dept.assignedEmployees || []).map(e => e._id),
    });
    setAssignError("");
    setEmpSearch("");
  };

  const toggleEmployee = (empId) => {
    setAssignForm(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(empId)
        ? prev.employeeIds.filter(id => id !== empId)
        : [...prev.employeeIds, empId],
    }));
  };

  const handleAssign = async () => {
    setAssigning(true);
    setAssignError("");
    try {
      await api.put(`/departments/${manageDept._id}/assign`, assignForm);
      setManageDept(null);
      fetchAll();
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const activeEmployees = employees.filter(e => e.status === "active");

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <>
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Total Departments</span>
            <div className="ca-stat-icon blue"><Building2 size={17} /></div>
          </div>
          <div className="ca-stat-value">{departments.length}</div>
          <div className="ca-stat-meta">Active departments</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Total Employees</span>
            <div className="ca-stat-icon green"><Users size={17} /></div>
          </div>
          <div className="ca-stat-value">{employees.length}</div>
          <div className="ca-stat-meta">Across all departments</div>
        </div>
      </div>

      <div className="ca-card" style={{ marginBottom: 24 }}>
        <div className="ca-card-header">
          <span className="ca-card-title">Departments</span>
          <button className="ca-card-action" onClick={() => setShowForm(!showForm)}>
            <Plus size={13} /> New Department
          </button>
        </div>
        {showForm && (
          <div className="ca-card-body">
            {error && <div style={{ color: "red", fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input className="ca-input" placeholder="Department name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} style={{ flex: 1, minWidth: 180 }} />
              <input className="ca-input" placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} style={{ flex: 2, minWidth: 200 }} />
              <button type="submit" className="ca-btn-approve" disabled={submitting}>{submitting ? "Creating..." : "Create"}</button>
              <button type="button" className="ca-btn-reject" onClick={() => setShowForm(false)}>Cancel</button>
            </form>
          </div>
        )}
      </div>

      <div className="ca-grid-2">
        {departments.length === 0 ? (
          <div className="ca-card" style={{ gridColumn: "1/-1" }}>
            <div className="ca-card-body" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
              No departments yet. Create your first department above.
            </div>
          </div>
        ) : (
          departments.map((d, i) => {
            const assigned = d.assignedEmployees || [];
            return (
              <div className="ca-card" key={i}>
                <div className="ca-card-header">
                  <span className="ca-card-title">{d.name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="ca-tag active">{assigned.length} members</span>
                    <button className="ca-card-action" onClick={() => openManage(d)} style={{ margin: 0 }}>
                      <Settings size={12} /> Manage
                    </button>
                  </div>
                </div>
                <div className="ca-card-body">
                  {d.description && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>{d.description}</p>
                  )}
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                    Team Lead: <strong>{d.managerId?.name || "Not assigned"}</strong>
                    {d.managerId?.designation && (
                      <span style={{ color: "var(--text-muted)" }}> · {d.managerId.designation}</span>
                    )}
                  </div>
                  {assigned.slice(0, 4).map((emp, j) => (
                    <div key={j} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                      {emp.name} <span style={{ color: "var(--text-muted)" }}>· {emp.designation || emp.role || "—"}</span>
                    </div>
                  ))}
                  {assigned.length > 4 && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>+{assigned.length - 4} more</div>
                  )}
                  {assigned.length === 0 && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No employees assigned yet</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {manageDept && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            width: "100%", maxWidth: 500,
            maxHeight: "90vh",
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 64px rgba(15,23,42,0.2), 0 4px 16px rgba(15,23,42,0.08)",
            overflow: "hidden",
          }}>

            {/* Colored header band */}
            <div style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              padding: "20px 22px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Building2 size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
                    {manageDept.name}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                    Assign team lead &amp; members
                  </div>
                </div>
              </div>
              <button
                onClick={() => setManageDept(null)}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
                  color: "#fff", width: 30, height: 30, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1, background: "#ffffff" }}>
              {assignError && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16,
                }}>
                  {assignError}
                </div>
              )}

              {/* Team Lead section */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <div style={{
                    width: 4, height: 16, borderRadius: 2, background: "#3b82f6",
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Team Lead</span>
                </div>
                <select
                  className="ca-input"
                  value={assignForm.managerId}
                  onChange={e => setAssignForm(prev => ({ ...prev, managerId: e.target.value }))}
                  style={{
                    width: "100%", background: "#f8fafc",
                    border: "1px solid #e2e8f0", borderRadius: 8,
                    padding: "9px 12px", fontSize: 13, color: "#0f172a",
                    outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="">— No Team Lead —</option>
                  {activeEmployees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}{emp.designation ? ` · ${emp.designation}` : ""}
                    </option>
                  ))}
                </select>

                {/* Selected team lead preview */}
                {assignForm.managerId && (() => {
                  const lead = activeEmployees.find(e => e._id === assignForm.managerId);
                  return lead ? (
                    <div style={{
                      marginTop: 10, display: "flex", alignItems: "center", gap: 10,
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: 8, padding: "8px 12px",
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: "#3b82f6", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>{lead.name}</div>
                        {lead.designation && <div style={{ fontSize: 11, color: "#3b82f6" }}>{lead.designation}</div>}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Employees section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 4, height: 16, borderRadius: 2, background: "#10b981" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      Employees
                      <span style={{
                        marginLeft: 8, fontSize: 11, fontWeight: 600,
                        background: "#eff6ff", color: "#3b82f6",
                        padding: "2px 7px", borderRadius: 20,
                      }}>
                        {assignForm.employeeIds.length} selected
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignForm(prev => ({
                      ...prev,
                      employeeIds: prev.employeeIds.length === activeEmployees.length
                        ? [] : activeEmployees.map(e => e._id),
                    }))}
                    style={{
                      fontSize: 12, color: "#3b82f6", background: "none",
                      border: "none", cursor: "pointer", fontWeight: 500,
                    }}
                  >
                    {assignForm.employeeIds.length === activeEmployees.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Search */}
                <input
                  className="ca-input"
                  placeholder="Search employees..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  style={{
                    width: "100%", marginBottom: 8,
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 8, padding: "8px 12px", fontSize: 13,
                  }}
                />

                {/* List */}
                <div style={{
                  border: "1px solid #e2e8f0", borderRadius: 10,
                  maxHeight: 240, overflowY: "auto",
                  background: "#ffffff",
                }}>
                  {activeEmployees.filter(e =>
                    !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                    (e.designation || "").toLowerCase().includes(empSearch.toLowerCase())
                  ).length === 0 ? (
                    <div style={{ padding: 20, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                      No employees found
                    </div>
                  ) : (
                    activeEmployees
                      .filter(e =>
                        !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                        (e.designation || "").toLowerCase().includes(empSearch.toLowerCase())
                      )
                      .map((emp, i, arr) => {
                        const selected = assignForm.employeeIds.includes(emp._id);
                        const initials = emp.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                        const colors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#ec4899","#14b8a6"];
                        const color = colors[emp.name.charCodeAt(0) % colors.length];
                        return (
                          <label
                            key={emp._id}
                            style={{
                              display: "flex", alignItems: "center", gap: 11,
                              padding: "10px 14px",
                              borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none",
                              cursor: "pointer",
                              background: selected ? "#eff6ff" : "#ffffff",
                              transition: "background 0.1s",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleEmployee(emp._id)}
                              style={{ accentColor: "#3b82f6", width: 15, height: 15, flexShrink: 0 }}
                            />
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: selected ? "#3b82f6" : color,
                              color: "#fff", display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: 11, fontWeight: 700,
                              flexShrink: 0, transition: "background 0.15s",
                            }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "#1d4ed8" : "#0f172a" }}>
                                {emp.name}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                                {emp.designation || emp.role || emp.department || "—"}
                              </div>
                            </div>
                            {selected && (
                              <div style={{
                                width: 18, height: 18, borderRadius: "50%",
                                background: "#3b82f6", display: "flex",
                                alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </label>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "14px 22px",
              borderTop: "1px solid #e2e8f0",
              display: "flex", gap: 10, justifyContent: "flex-end",
              background: "#f8fafc",
            }}>
              <button
                className="ca-btn-reject"
                onClick={() => setManageDept(null)}
                style={{ minWidth: 88 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                style={{
                  minWidth: 120, padding: "8px 18px", borderRadius: 8,
                  background: assigning ? "#93c5fd" : "#3b82f6",
                  color: "#fff", border: "none", cursor: assigning ? "not-allowed" : "pointer",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {assigning ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DepartmentsTeams;
