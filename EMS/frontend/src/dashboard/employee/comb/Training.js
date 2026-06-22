import React, { useState, useEffect } from "react";
import { BookOpen, Award, Clock, BarChart2, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../../utils/api";

const LEVEL_COLOR = {
  beginner:     { color: "#10b981", bg: "#ecfdf5" },
  intermediate: { color: "#f59e0b", bg: "#fffbeb" },
  advanced:     { color: "#ef4444", bg: "#fef2f2" },
};

const CATEGORY_ICONS = {
  "Technical":   "💻",
  "Leadership":  "🏆",
  "Compliance":  "📋",
  "Soft Skills": "🤝",
  "General":     "📚",
  "HR":          "👥",
  "Finance":     "💰",
};

const enrollStatusTag = (status) => {
  if (status === "completed")  return { label: "Completed",   cls: "emp-tag approved" };
  if (status === "in_progress") return { label: "In Progress", cls: "emp-tag half"     };
  return                               { label: "Enrolled",    cls: "emp-tag pending"  };
};

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("browse");
  const [enrolling, setEnrolling] = useState({});
  const [updating,  setUpdating]  = useState({});
  const [expanded,  setExpanded]  = useState(null);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const data = await api.get("/training");
      setTrainings(data.trainings || []);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrainings(); }, []);

  const handleEnroll = async (id) => {
    setEnrolling(e => ({ ...e, [id]: true }));
    try {
      await api.post(`/training/${id}/enroll`, {});
      await fetchTrainings();
    } catch (err) { alert(err.message); }
    finally { setEnrolling(e => ({ ...e, [id]: false })); }
  };

  const handleProgress = async (id, value) => {
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await api.put(`/training/${id}/progress`, { progress: value });
      await fetchTrainings();
    } catch (err) { alert(err.message); }
    finally { setUpdating(u => ({ ...u, [id]: false })); }
  };

  const enrolled   = trainings.filter(t => t.enrollment);
  const available  = trainings.filter(t => !t.enrollment);
  const completed  = enrolled.filter(t => t.enrollment?.status === "completed");
  const inProgress = enrolled.filter(t => t.enrollment?.status === "in_progress");

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading training portal...</div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>Training Portal</div>
        <div style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 4 }}>Enroll in courses, track your progress, and earn completions</div>
      </div>

      {/* Stat cards */}
      <div className="emp-stats-grid" style={{ marginBottom: 28 }}>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Available</span>
            <div className="emp-stat-icon blue"><BookOpen size={17} /></div>
          </div>
          <div className="emp-stat-value">{available.length}</div>
          <div className="emp-stat-meta">Courses to explore</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Enrolled</span>
            <div className="emp-stat-icon green"><PlayCircle size={17} /></div>
          </div>
          <div className="emp-stat-value">{enrolled.length}</div>
          <div className="emp-stat-meta">Courses started</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">In Progress</span>
            <div className="emp-stat-icon amber"><BarChart2 size={17} /></div>
          </div>
          <div className="emp-stat-value">{inProgress.length}</div>
          <div className="emp-stat-meta">Currently active</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Completed</span>
            <div className="emp-stat-icon green"><Award size={17} /></div>
          </div>
          <div className="emp-stat-value">{completed.length}</div>
          <div className="emp-stat-meta">Courses finished</div>
        </div>
      </div>

      {/* Main card with tab switcher */}
      <div className="emp-card">
        <div className="emp-card-header">
          <span className="emp-card-title">
            {tab === "browse" ? "Browse Courses" : "My Learning"}
          </span>
          <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 4, borderRadius: 8 }}>
            {[
              { key: "browse", label: "Browse Courses" },
              { key: "my",     label: `My Learning (${enrolled.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: tab === t.key ? "var(--surface)" : "transparent", color: tab === t.key ? "var(--accent)" : "var(--text-muted)", boxShadow: tab === t.key ? "var(--shadow)" : "none", transition: "all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Browse Courses ── */}
        {tab === "browse" && (
          <div className="emp-card-body">
            {available.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No new courses available</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>You've enrolled in all available courses, or your HR team hasn't added any yet.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {available.map(t => {
                  const lc   = LEVEL_COLOR[t.level] || LEVEL_COLOR.beginner;
                  const icon = CATEGORY_ICONS[t.category] || "📚";
                  return (
                    <div key={t._id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>

                      {/* Card top */}
                      <div style={{ padding: "20px 20px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                          <span style={{ fontSize: 30 }}>{icon}</span>
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: lc.bg, color: lc.color, fontWeight: 600 }}>
                            {t.level?.charAt(0).toUpperCase() + t.level?.slice(1)}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.35, color: "var(--text-primary)" }}>{t.title}</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 14 }}>{t.description || "No description provided."}</div>
                        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                          {t.instructor && <span>👤 {t.instructor}</span>}
                          {t.duration   && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{t.duration}h</span>}
                          {t.category   && <span>🏷 {t.category}</span>}
                        </div>
                      </div>

                      {/* Enroll button */}
                      <div style={{ padding: "0 20px 20px", marginTop: "auto" }}>
                        <button onClick={() => enrolling[t._id] || handleEnroll(t._id)} disabled={enrolling[t._id]}
                          className="emp-card-action"
                          style={{ width: "100%", padding: "9px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: enrolling[t._id] ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, opacity: enrolling[t._id] ? 0.7 : 1 }}>
                          {enrolling[t._id] ? "Enrolling..." : "Enroll Now"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── My Learning ── */}
        {tab === "my" && (
          <div style={{ padding: 0 }}>
            {enrolled.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <PlayCircle size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>No courses enrolled yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Switch to Browse Courses to enroll in available trainings.</div>
              </div>
            ) : (
              enrolled.map((t, i) => {
                const en          = t.enrollment;
                const lc          = LEVEL_COLOR[t.level] || LEVEL_COLOR.beginner;
                const icon        = CATEGORY_ICONS[t.category] || "📚";
                const isCompleted = en?.status === "completed";
                const isExpanded  = expanded === t._id;
                const isLast      = i === enrolled.length - 1;
                const tag         = enrollStatusTag(en?.status);

                return (
                  <div key={t._id}>
                    {/* Row */}
                    <div onClick={() => setExpanded(isExpanded ? null : t._id)}
                      style={{ display: "flex", alignItems: "center", padding: "16px 24px", cursor: "pointer", borderBottom: isLast && !isExpanded ? "none" : "1px solid var(--border)", gap: 14, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.title}
                        </div>
                        {/* Progress bar */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${en?.progress || 0}%`, background: isCompleted ? "var(--success)" : "var(--accent)", borderRadius: 4, transition: "width 0.4s ease" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isCompleted ? "var(--success)" : "var(--accent)", width: 34, textAlign: "right", flexShrink: 0 }}>
                            {en?.progress || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Level badge */}
                      <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: lc.bg, color: lc.color, fontWeight: 600, flexShrink: 0 }}>
                        {t.level?.charAt(0).toUpperCase() + t.level?.slice(1)}
                      </span>

                      {/* Status badge */}
                      <span className={tag.cls} style={{ flexShrink: 0 }}>{tag.label}</span>

                      <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ padding: "16px 24px 20px", background: "var(--surface-2)", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                        {t.description && (
                          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.65 }}>{t.description}</p>
                        )}

                        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-muted)", marginBottom: 16, flexWrap: "wrap" }}>
                          {t.instructor  && <span>👤 {t.instructor}</span>}
                          {t.duration    && <span>⏱ {t.duration} hour{t.duration > 1 ? "s" : ""}</span>}
                          {en?.enrolledAt  && <span>📅 Enrolled {new Date(en.enrolledAt).toLocaleDateString("en-IN")}</span>}
                          {en?.completedAt && <span>🏆 Completed {new Date(en.completedAt).toLocaleDateString("en-IN")}</span>}
                        </div>

                        {t.materials && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Materials</div>
                            {t.materials.startsWith("http")
                              ? <a href={t.materials} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--accent)" }}>{t.materials}</a>
                              : <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.materials}</span>}
                          </div>
                        )}

                        {isCompleted ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 10, background: "var(--success-light)", border: "1px solid #a7f3d0" }}>
                            <Award size={20} color="var(--success)" />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)" }}>Course Completed!</div>
                              <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>You have successfully completed this training.</div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Update Your Progress</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {[0, 25, 50, 75, 100].map(pct => {
                                const isActive = en?.progress === pct;
                                return (
                                  <button key={pct} disabled={updating[t._id] || isActive}
                                    onClick={() => handleProgress(t._id, pct)}
                                    style={{ padding: "7px 18px", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, cursor: isActive ? "default" : "pointer", border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`, background: isActive ? "var(--accent-light)" : "var(--surface)", color: isActive ? "var(--accent)" : "var(--text-secondary)", transition: "all 0.15s" }}>
                                    {updating[t._id] && !isActive ? "..." : `${pct}%`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Training;
