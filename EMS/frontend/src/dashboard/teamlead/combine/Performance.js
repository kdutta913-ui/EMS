import React, { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const TECH_KEYWORDS = [
  "engineer", "developer", "dev", "software", "frontend", "backend",
  "fullstack", "full stack", "qa", "quality assurance", "devops", "data",
  "architect", "tech", "product", "design", "ux", "ui", "cloud",
  "security", "network", "database", "analyst", "programmer", "it",
  "infrastructure", "mobile", "android", "ios", "machine learning", "ml", "ai",
];

const isTechRole = (emp) => {
  const fields = [emp.role, emp.designation, emp.department].map(f => (f || "").toLowerCase());
  return TECH_KEYWORDS.some(kw => fields.some(f => f.includes(kw)));
};

const DEFAULT_METRICS = [
  { label: "Task Completion", score: 0 },
  { label: "Code Quality",    score: 0 },
  { label: "Collaboration",   score: 0 },
  { label: "Communication",   score: 0 },
  { label: "Punctuality",     score: 0 },
];

const TlPerformance = () => {
  const [reviews,    setReviews]    = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [form,       setForm]       = useState({ employeeId: "", year: new Date().getFullYear(), quarter: 1, feedback: "" });
  const [metrics,    setMetrics]    = useState(DEFAULT_METRICS.map(m => ({ ...m })));

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reviewData, empData] = await Promise.all([
          api.get("/performance"),
          api.get("/employees?limit=200"),
        ]);
        setReviews(reviewData.reviews || []);
        setEmployees((empData.employees || []).filter(isTechRole));
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const resetForm = () => {
    setForm({ employeeId: "", year: new Date().getFullYear(), quarter: 1, feedback: "" });
    setMetrics(DEFAULT_METRICS.map(m => ({ ...m })));
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId) { alert("Please select an employee"); return; }
    setSubmitting(true);
    try {
      await api.post("/performance", {
        employeeId: form.employeeId,
        period: { year: Number(form.year), quarter: Number(form.quarter) },
        metrics,
        feedback: form.feedback,
        status: "submitted",
      });
      setSuccess(true);
      resetForm();
      const data = await api.get("/performance");
      setReviews(data.reviews || []);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading performance data...</div>;

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Team Performance & Appraisals</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Submit appraisal reviews — they are sent directly to the employee</div>

      {success && (
        <div style={{ background: "var(--success-light)", color: "var(--success)", border: "1px solid #a7f3d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          Appraisal submitted and sent to the employee successfully!
        </div>
      )}

      {/* New Appraisal Form */}
      <div className="tl-card" style={{ marginBottom: 20 }}>
        <div className="tl-card-header">
          <span className="tl-card-title">Appraisals ({reviews.length})</span>
          <button className="tl-card-action" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Appraisal"}
          </button>
        </div>

        {showForm && (
          <div style={{ padding: "0 20px 20px" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Employee *</label>
                  <select className="ca-input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                    <option value="">Select tech employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} — {emp.role || emp.designation || emp.department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Year</label>
                  <input className="ca-input" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Quarter</label>
                  <select className="ca-input" value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })}>
                    <option value={1}>Q1 (Jan–Mar)</option>
                    <option value={2}>Q2 (Apr–Jun)</option>
                    <option value={3}>Q3 (Jul–Sep)</option>
                    <option value={4}>Q4 (Oct–Dec)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>KPI Scores (0–100)</label>
                {metrics.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ width: 160, fontSize: 13, color: "var(--text-secondary)" }}>{m.label}</span>
                    <input type="range" min={0} max={100} value={m.score}
                      onChange={e => setMetrics(prev => prev.map((x, j) => j === i ? { ...x, score: Number(e.target.value) } : x))}
                      style={{ flex: 1, accentColor: "var(--accent)" }} />
                    <span style={{ width: 40, fontWeight: 700, fontSize: 13, color: "var(--accent)", textAlign: "right" }}>{m.score}%</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Feedback</label>
                <textarea className="ca-input" rows={3} placeholder="Overall feedback for this employee..."
                  value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })}
                  style={{ resize: "vertical", width: "100%" }} />
              </div>

              <button type="submit" className="ca-btn-approve" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit & Send to Employee"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Review History */}
      <div className="tl-card">
        <div className="tl-card-header">
          <span className="tl-card-title">Review History</span>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          {reviews.length === 0 ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No appraisal reviews yet. Click "+ New Appraisal" to create the first one.
            </p>
          ) : (
            <table className="tl-table">
              <thead>
                <tr><th>Employee</th><th>Period</th><th>Score</th><th>Status</th></tr>
              </thead>
              <tbody>
                {reviews.map((r, i) => (
                  <tr key={r._id || i}>
                    <td>
                      <div className="tl-member-name">{r.employeeId?.name || "—"}</div>
                      <div className="tl-member-role">{r.employeeId?.department}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {r.period?.quarter ? `Q${r.period.quarter} ` : ""}{r.period?.year}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>{r.overallScore ?? "—"}%</td>
                    <td>
                      <span className={`tl-tag ${r.status}`}>
                        {r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TlPerformance;
