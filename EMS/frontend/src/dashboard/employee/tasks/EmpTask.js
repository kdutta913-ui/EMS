import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, Circle, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { api } from "../../../utils/api";

const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
const PRIORITY_BG    = { high: "#fef2f2",  medium: "#fffbeb",  low: "#ecfdf5" };

const STATUS_TABS = [
  { key: "all",        label: "All"         },
  { key: "pending",    label: "Pending"     },
  { key: "inprogress", label: "In Progress" },
  { key: "done",       label: "Done"        },
];

const statusLabel = (s) => {
  if (s === "inprogress") return "In Progress";
  if (s === "done")       return "Done";
  return "Pending";
};

const statusTagClass = (s) => {
  if (s === "done")       return "emp-tag approved";
  if (s === "inprogress") return "emp-tag half";
  return "emp-tag pending";
};

const EmpTask = () => {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [updating, setUpdating] = useState({});
  const [expanded, setExpanded] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.get("/tasks");
      setTasks(data.tasks || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
    } catch (err) { alert(err.message); }
    finally { setUpdating(u => ({ ...u, [id]: false })); }
  };

  const counts = {
    all:        tasks.length,
    pending:    tasks.filter(t => t.status === "pending").length,
    inprogress: tasks.filter(t => t.status === "inprogress").length,
    done:       tasks.filter(t => t.status === "done").length,
  };

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading tasks...</div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>My Tasks</div>
        <div style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 4 }}>Tasks assigned to you by your team lead</div>
      </div>

      {/* Stat cards */}
      <div className="emp-stats-grid" style={{ marginBottom: 28 }}>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Total Tasks</span>
            <div className="emp-stat-icon blue"><AlertCircle size={17} /></div>
          </div>
          <div className="emp-stat-value">{counts.all}</div>
          <div className="emp-stat-meta">Assigned to you</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Pending</span>
            <div className="emp-stat-icon amber"><Circle size={17} /></div>
          </div>
          <div className="emp-stat-value">{counts.pending}</div>
          <div className="emp-stat-meta">Not started yet</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">In Progress</span>
            <div className="emp-stat-icon blue"><Clock size={17} /></div>
          </div>
          <div className="emp-stat-value">{counts.inprogress}</div>
          <div className="emp-stat-meta">Currently working</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Completed</span>
            <div className="emp-stat-icon green"><CheckCircle size={17} /></div>
          </div>
          <div className="emp-stat-value">{counts.done}</div>
          <div className="emp-stat-meta">Finished tasks</div>
        </div>
      </div>

      {/* Task list card */}
      <div className="emp-card">
        <div className="emp-card-header">
          <span className="emp-card-title">Task List</span>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 4, borderRadius: 8 }}>
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: filter === tab.key ? "var(--surface)" : "transparent", color: filter === tab.key ? "var(--accent)" : "var(--text-muted)", boxShadow: filter === tab.key ? "var(--shadow)" : "none", transition: "all 0.15s" }}>
                {tab.label}
                {tab.key !== "all" && counts[tab.key] > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>({counts[tab.key]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="emp-card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <ClipboardList size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                {filter === "done" ? "No completed tasks yet." : filter === "all" ? "No tasks assigned yet." : `No ${statusLabel(filter).toLowerCase()} tasks.`}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Tasks assigned by your team lead will appear here.</div>
            </div>
          ) : (
            filtered.map((task, i) => {
              const isExpanded = expanded === task._id;
              const isOverdue  = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
              const isLast     = i === filtered.length - 1;

              return (
                <div key={task._id}>
                  {/* Task row */}
                  <div onClick={() => setExpanded(isExpanded ? null : task._id)}
                    style={{ display: "flex", alignItems: "center", padding: "16px 24px", cursor: "pointer", borderBottom: isLast && !isExpanded ? "none" : "1px solid var(--border)", gap: 14, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                    {/* Priority stripe */}
                    <div style={{ width: 4, height: 42, borderRadius: 4, background: PRIORITY_COLOR[task.priority] || "#cbd5e1", flexShrink: 0 }} />

                    {/* Task info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: task.status === "done" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.status === "done" ? "line-through" : "none", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 14 }}>
                        <span>By {task.assignedBy?.name || "—"}</span>
                        {task.dueDate && (
                          <span style={{ color: isOverdue ? "var(--danger)" : "var(--text-muted)", fontWeight: isOverdue ? 600 : 400 }}>
                            {isOverdue ? "Overdue · " : "Due "}
                            {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority badge */}
                    <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 600, background: PRIORITY_BG[task.priority] || "var(--surface-2)", color: PRIORITY_COLOR[task.priority] || "var(--text-muted)", flexShrink: 0 }}>
                      {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || "—"}
                    </span>

                    {/* Status badge */}
                    <span className={statusTagClass(task.status)} style={{ flexShrink: 0 }}>
                      {statusLabel(task.status)}
                    </span>

                    {/* Expand chevron */}
                    <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ padding: "16px 24px 20px 50px", background: "var(--surface-2)", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                      {task.description && (
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.65 }}>{task.description}</p>
                      )}

                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Update Status</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                          { key: "pending",    label: "Pending",     color: "#64748b" },
                          { key: "inprogress", label: "In Progress", color: "#f59e0b" },
                          { key: "done",       label: "Mark Done",   color: "#10b981" },
                        ].map(s => {
                          const isActive = task.status === s.key;
                          return (
                            <button key={s.key} disabled={updating[task._id] || isActive}
                              onClick={(e) => updateStatus(task._id, s.key, e)}
                              style={{ padding: "7px 18px", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, cursor: isActive ? "default" : "pointer", border: `1.5px solid ${isActive ? s.color : "var(--border)"}`, background: isActive ? `${s.color}18` : "var(--surface)", color: isActive ? s.color : "var(--text-secondary)", transition: "all 0.15s" }}>
                              {updating[task._id] ? "..." : s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EmpTask;
