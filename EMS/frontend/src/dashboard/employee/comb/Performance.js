import React, { useState, useEffect } from "react";
import "../comb/EmpPages.css";
import { api } from "../../../utils/api";

const EmpPerformance = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/performance/my").then(d => setReviews(d.reviews || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading performance data...</div>;

  if (reviews.length === 0) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Reviews Yet</div>
      <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Your performance reviews will appear here once your manager submits them.</div>
    </div>
  );

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Performance Overview</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Your performance reviews and KPI scores</div>

      {reviews.map((r, i) => (
        <div key={r._id || i} className="shared-card" style={{ marginBottom: 20 }}>
          <div className="shared-card-header">
            <span className="shared-card-title">{r.period?.quarter ? `Q${r.period.quarter} ` : ""}{r.period?.year || ""} Review</span>
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12, background: "var(--surface-2)" }}>{r.status}</span>
          </div>
          <div className="shared-card-body">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Overall Score: {r.overallScore ?? "—"}%</div>
            {(r.metrics || []).map((m, j) => (
              <div key={j} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{m.label}</span><span style={{ fontWeight: 600 }}>{m.score}%</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.score}%`, background: "var(--accent)", borderRadius: 4 }} />
                </div>
              </div>
            ))}
            {r.feedback && (
              <div style={{ padding: "12px 16px", background: "var(--surface-2)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)", marginTop: 12 }}>
                <strong>Feedback:</strong> {r.feedback}
              </div>
            )}
            {r.goals?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Goals</div>
                {r.goals.map((g, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: g.achieved ? "var(--success)" : "var(--text-muted)" }}>{g.achieved ? "✓" : "○"}</span>
                    <span style={{ textDecoration: g.achieved ? "line-through" : "none" }}>{g.title}</span>
                  </div>
                ))}
              </div>
            )}
            {r.status !== "acknowledged" && (
              <button className="ca-btn-approve" style={{ marginTop: 16 }}
                onClick={() => api.put(`/performance/${r._id}/acknowledge`).then(() => setReviews(prev => prev.map(x => x._id === r._id ? { ...x, status: "acknowledged" } : x)))}>
                Acknowledge Review
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmpPerformance;
