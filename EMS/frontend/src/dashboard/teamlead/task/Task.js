import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import "./Task.css";
import { api } from "../../../utils/api";

const avatarColors = ["#2563eb","#7c3aed","#db2777","#d97706","#16a34a","#0d9488"];

const TasksGoals = () => {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", dueDate: "", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await api.get("/tasks");
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    api.get("/employees?limit=50").then(d => setEmployees(d.employees || [])).catch(() => {});
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.assignedTo) return;
    setSubmitting(true);
    try {
      await api.post("/tasks", form);
      setShowForm(false);
      setForm({ title: "", description: "", assignedTo: "", dueDate: "", priority: "medium" });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pending    = tasks.filter(t => t.status === "pending");
  const inprogress = tasks.filter(t => t.status === "inprogress");
  const done       = tasks.filter(t => t.status === "done");

  const getInitials = (name) => name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "??";
  const getColor    = (name) => avatarColors[(name?.length || 0) % avatarColors.length];

  const TaskCard = ({ task }) => (
    <div className="tg-task-card" onClick={() => setSelected(task)}>
      <div className="tg-task-card-top">
        <span className="tg-task-title">{task.title}</span>
        <span className={`tg-tag ${task.priority}`}>{task.priority}</span>
      </div>
      <div className="tg-task-meta">
        <div className="tg-task-assignee">
          <div className="tg-assignee-chip" style={{ background: getColor(task.assignedTo?.name) }}>
            {getInitials(task.assignedTo?.name)}
          </div>
          <span>{task.assignedTo?.name?.split(" ")[0] || "—"}</span>
        </div>
        {task.dueDate && (
          <span className="tg-task-due">{new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="tg-page">
      <div className="tg-page-header">
        <div>
          <div className="tg-page-title">Tasks & Goals</div>
          <div className="tg-page-sub">Current sprint · {tasks.length} total tasks</div>
        </div>
        <div className="tg-header-actions">
          <button className="tg-btn primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="tg-stats">
        {[
          { label: "Total Tasks",  value: tasks.length,       meta: "This sprint"       },
          { label: "In Progress",  value: inprogress.length,  meta: "Being worked on"   },
          { label: "Pending",      value: pending.length,     meta: "Not started yet"   },
          { label: "Completed",    value: done.length,        meta: "This sprint"       },
        ].map((s, i) => (
          <div className="tg-stat" key={i}>
            <div className="tg-stat-label">{s.label}</div>
            <div className="tg-stat-value">{s.value}</div>
            <div className="tg-stat-meta">{s.meta}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>Loading tasks...</p>
      ) : (
        /* Kanban Board */
        <div className="tg-board">
          {[
            { label: "Pending",     items: pending,    key: "pending"    },
            { label: "In Progress", items: inprogress, key: "inprogress" },
            { label: "Completed",   items: done,       key: "done"       },
          ].map(col => (
            <div className="tg-column" key={col.key}>
              <div className="tg-column-header">
                <span className="tg-column-title">
                  <span className={`tg-col-dot ${col.key}`} /> {col.label}
                </span>
                <span className="tg-col-count">{col.items.length}</span>
              </div>
              {col.items.map(t => <TaskCard key={t._id} task={t} />)}
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showForm && (
        <div className="tg-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <span className="tg-modal-title">New Task</span>
              <button className="tg-modal-close" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <form className="tg-modal-body" onSubmit={handleCreate}>
              <div className="tg-modal-row">
                <span className="tg-modal-label">Title *</span>
                <input className="ca-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="tg-modal-row">
                <span className="tg-modal-label">Assign To *</span>
                <select className="ca-input" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} required>
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="tg-modal-row">
                <span className="tg-modal-label">Due Date</span>
                <input type="date" className="ca-input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
              </div>
              <div className="tg-modal-row">
                <span className="tg-modal-label">Priority</span>
                <select className="ca-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="tg-modal-row">
                <span className="tg-modal-label">Description</span>
                <textarea className="ca-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <button type="submit" className="ca-btn-approve" style={{ marginTop: 12, width: "100%" }} disabled={submitting}>
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selected && (
        <div className="tg-modal-overlay" onClick={() => setSelected(null)}>
          <div className="tg-modal" onClick={e => e.stopPropagation()}>
            <div className="tg-modal-header">
              <span className="tg-modal-title">Task Details</span>
              <button className="tg-modal-close" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>
            <div className="tg-modal-body">
              {[
                { label: "Title",       value: selected.title },
                { label: "Assignee",    value: selected.assignedTo?.name || "—" },
                { label: "Priority",    value: selected.priority },
                { label: "Status",      value: selected.status },
                { label: "Due Date",    value: selected.dueDate ? new Date(selected.dueDate).toLocaleDateString("en-IN") : "—" },
                { label: "Description", value: selected.description || "—" },
              ].map((r, i) => (
                <div className="tg-modal-row" key={i}>
                  <span className="tg-modal-label">{r.label}</span>
                  <span className="tg-modal-value">{r.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {selected.status !== "inprogress" && (
                  <button className="ca-btn-approve" onClick={() => { handleStatusChange(selected._id, "inprogress"); setSelected(null); }}>Mark In Progress</button>
                )}
                {selected.status !== "done" && (
                  <button className="ca-btn-approve" onClick={() => { handleStatusChange(selected._id, "done"); setSelected(null); }}>Mark Done</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksGoals;
