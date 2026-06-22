import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Link, Users, Clock, Trash2, Calendar } from "lucide-react";
import { api } from "../../../utils/api";

const EVENT_TYPES = [
  { value: "standup",        label: "Standup",        color: "#3b82f6", bg: "#eff6ff" },
  { value: "sprint_planning",label: "Sprint Planning", color: "#7c3aed", bg: "#f5f3ff" },
  { value: "1on1",           label: "1:1 Meeting",    color: "#db2777", bg: "#fdf2f8" },
  { value: "review",         label: "Review",         color: "#d97706", bg: "#fffbeb" },
  { value: "event",          label: "Event",          color: "#10b981", bg: "#ecfdf5" },
];

const typeConfig = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));

const DAY_NAMES  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const startOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d, n) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const fmt = (d) => d.toISOString().split("T")[0];

const EMPTY_FORM = { title: "", type: "standup", date: "", startTime: "09:00", endTime: "09:30", attendees: [], description: "", link: "" };

const Schedule = () => {
  const [weekStart,  setWeekStart]  = useState(startOfWeek(new Date()));
  const [schedules,  setSchedules]  = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [selected,   setSelected]   = useState(null); // detail view
  const [deleting,   setDeleting]   = useState(false);

  const weekEnd = addDays(weekStart, 6);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const from = fmt(weekStart);
      const to   = fmt(addDays(weekStart, 6));
      const data = await api.get(`/schedule?from=${from}&to=${to}`);
      setSchedules(data.schedules || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [weekStart]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  useEffect(() => {
    api.get("/employees?limit=200")
      .then(d => setEmployees(d.employees || []))
      .catch(console.error);
  }, []);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday  = () => setWeekStart(startOfWeek(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsOnDay = (day) =>
    schedules.filter(s => isSameDay(new Date(s.date), day))
             .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openCreate = (day) => {
    setForm({ ...EMPTY_FORM, date: fmt(day) });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/schedule", form);
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      await loadSchedules();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    setDeleting(true);
    try {
      await api.delete(`/schedule/${id}`);
      setSelected(null);
      await loadSchedules();
    } catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  };

  const toggleAttendee = (id) => {
    setForm(f => ({
      ...f,
      attendees: f.attendees.includes(id)
        ? f.attendees.filter(a => a !== id)
        : [...f.attendees, id],
    }));
  };

  const today = new Date();
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(today));

  const weekLabel = (() => {
    const s = weekStart, e = weekEnd;
    if (s.getMonth() === e.getMonth())
      return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  })();

  return (
    <div style={{ padding: "0 0 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Team Schedule</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Plan and manage team meetings and events</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 8, marginRight: 8, flexWrap: "wrap" }}>
            {EVENT_TYPES.map(t => (
              <span key={t.value} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: t.bg, color: t.color, fontWeight: 600 }}>{t.label}</span>
            ))}
          </div>
          <button onClick={() => openCreate(today)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="tl-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
          <button onClick={prevWeek} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{weekLabel}</span>
            {!isCurrentWeek && (
              <button onClick={goToday} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--accent)", color: "var(--accent)", background: "transparent", cursor: "pointer", fontWeight: 500 }}>Today</button>
            )}
          </div>
          <button onClick={nextWeek} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderTop: "1px solid var(--border)" }}>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const events  = eventsOnDay(day);
            const isPast  = day < today && !isToday;

            return (
              <div key={i} style={{ borderRight: i < 6 ? "1px solid var(--border)" : "none", minHeight: 160 }}>
                {/* Day header */}
                <div style={{ padding: "10px 12px 6px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: isToday ? "var(--accent-light)" : "transparent" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isToday ? "var(--accent)" : "var(--text-muted)", textTransform: "uppercase" }}>{DAY_NAMES[day.getDay()]}</span>
                  <span style={{ fontSize: 18, fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : isPast ? "var(--text-muted)" : "var(--text-primary)", width: 32, height: 32, borderRadius: "50%", background: isToday ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {loading ? (
                    <div style={{ height: 8, background: "var(--border)", borderRadius: 4, margin: "4px 0" }} />
                  ) : (
                    events.map(ev => {
                      const cfg = typeConfig[ev.type] || typeConfig.event;
                      return (
                        <div key={ev._id} onClick={() => setSelected(ev)}
                          style={{ padding: "4px 8px", borderRadius: 6, background: cfg.bg, borderLeft: `3px solid ${cfg.color}`, cursor: "pointer", fontSize: 11 }}>
                          <div style={{ fontWeight: 600, color: cfg.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                          <div style={{ color: "var(--text-muted)", marginTop: 1 }}>{ev.startTime} – {ev.endTime}</div>
                        </div>
                      );
                    })
                  )}
                  {!loading && (
                    <button onClick={() => openCreate(day)}
                      style={{ marginTop: 2, padding: "3px 0", borderRadius: 6, border: "1px dashed var(--border)", background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, opacity: 0.6 }}>
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="tl-card">
        <div className="tl-card-header">
          <span className="tl-card-title">This Week's Events ({schedules.length})</span>
        </div>
        <div style={{ padding: "0 20px 16px" }}>
          {schedules.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No events this week. Click "+ New Event" to schedule something.
            </div>
          ) : (
            <table className="tl-table">
              <thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Time</th><th>Attendees</th></tr></thead>
              <tbody>
                {schedules.map(ev => {
                  const cfg = typeConfig[ev.type] || typeConfig.event;
                  return (
                    <tr key={ev._id} style={{ cursor: "pointer" }} onClick={() => setSelected(ev)}>
                      <td><div className="tl-member-name">{ev.title}</div></td>
                      <td><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span></td>
                      <td style={{ fontSize: 13 }}>{new Date(ev.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{ev.startTime} – {ev.endTime}</td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{ev.attendees?.length || 0} people</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create Event Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--surface)", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>New Event</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Title *</label>
                <input className="ca-input" placeholder="e.g. Daily Standup" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Type</label>
                  <select className="ca-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Date *</label>
                  <input className="ca-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Start Time *</label>
                  <input className="ca-input" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div>
                  <label style={lbl}>End Time *</label>
                  <input className="ca-input" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}><Link size={12} style={{ marginRight: 4 }} />Meeting Link (optional)</label>
                <input className="ca-input" placeholder="https://meet.google.com/..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}><Users size={12} style={{ marginRight: 4 }} />Attendees</label>
                <div style={{ maxHeight: 140, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {employees.map(emp => {
                    const sel = form.attendees.includes(emp._id);
                    return (
                      <span key={emp._id} onClick={() => toggleAttendee(emp._id)}
                        style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontWeight: 500, border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`, background: sel ? "var(--accent-light)" : "transparent", color: sel ? "var(--accent)" : "var(--text-secondary)" }}>
                        {emp.name}
                      </span>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{form.attendees.length} selected</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Description (optional)</label>
                <textarea className="ca-input" rows={2} placeholder="Agenda or notes..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "vertical" }} />
              </div>

              <button type="submit" className="ca-btn-approve" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Creating..." : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "var(--surface)", borderRadius: 14, width: "100%", maxWidth: 440 }}
            onClick={e => e.stopPropagation()}>

            {(() => {
              const cfg = typeConfig[selected.type] || typeConfig.event;
              return (
                <>
                  <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600, marginBottom: 6, display: "inline-block" }}>{cfg.label}</span>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.title}</div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                  </div>

                  <div style={{ padding: "20px 24px" }}>
                    {[
                      [<Calendar size={14} />, "Date", new Date(selected.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
                      [<Clock size={14} />, "Time", `${selected.startTime} – ${selected.endTime}`],
                      [<Users size={14} />, "Attendees", selected.attendees?.length ? selected.attendees.map(a => a.name).join(", ") : "None"],
                    ].map(([icon, label, val]) => (
                      <div key={label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
                        <span style={{ color: "var(--text-muted)", marginTop: 1 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                          <div style={{ fontSize: 13, marginTop: 2 }}>{val}</div>
                        </div>
                      </div>
                    ))}

                    {selected.link && (
                      <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Meeting Link</div>
                        <a href={selected.link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--accent)", wordBreak: "break-all" }}>{selected.link}</a>
                      </div>
                    )}

                    {selected.description && (
                      <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Description</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>{selected.description}</div>
                      </div>
                    )}

                    <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                      <button onClick={() => setSelected(null)} className="ca-btn-reject" style={{ flex: 1 }}>Close</button>
                      <button onClick={() => handleDelete(selected._id)} disabled={deleting}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--danger-light)", color: "var(--danger)", border: "1px solid #fca5a5", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        <Trash2 size={13} />{deleting ? "Deleting..." : "Delete Event"}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", marginBottom: 4 };

export default Schedule;
