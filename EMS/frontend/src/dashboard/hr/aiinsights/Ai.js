import React, { useState, useEffect } from "react";
import "../Hrdash.css";
import { UserMinus, TrendingUp, AlertTriangle, Users, Calendar } from "lucide-react";
import { api } from "../../../utils/api";

const pct = (n) => `${n}%`;

const AIInsights = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/ai/analytics")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading AI insights...</div>;

  if (error) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Service Unavailable</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Start the AI service: <code>python api.py</code> in AI_Models/</div>
    </div>
  );

  const { attrition, performance, recruitment, leave } = data;
  const attritionLevel = attrition.leaving_pct > 20 ? "HIGH" : attrition.leaving_pct > 10 ? "MEDIUM" : "LOW";
  const attritionColor = attritionLevel === "HIGH" ? "#dc2626" : attritionLevel === "MEDIUM" ? "#d97706" : "#16a34a";

  return (
    <>
      {/* Stat Cards */}
      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">Attrition Risk</span>
            <div className="hr-stat-icon red"><UserMinus size={17} /></div>
          </div>
          <div className="hr-stat-value">{pct(attrition.leaving_pct)}</div>
          <div className="hr-stat-meta">{attrition.leaving} of {attrition.total} employees at risk</div>
        </div>

        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">Avg Performance Score</span>
            <div className="hr-stat-icon blue"><TrendingUp size={17} /></div>
          </div>
          <div className="hr-stat-value">{performance.avg_score}<span style={{ fontSize: 16, fontWeight: 400 }}>/5</span></div>
          <div className="hr-stat-meta">{performance.top_performers} top performers · {performance.low_performers} need attention</div>
        </div>

        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">Recruitment Flight Risk</span>
            <div className="hr-stat-icon amber"><Users size={17} /></div>
          </div>
          <div className="hr-stat-value">{pct(recruitment.flight_risk_pct)}</div>
          <div className="hr-stat-meta">{recruitment.flight_risk} of {recruitment.total} candidates flagged</div>
        </div>

        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">High Leave Risk</span>
            <div className="hr-stat-icon green"><Calendar size={17} /></div>
          </div>
          <div className="hr-stat-value">{leave.high_count}</div>
          <div className="hr-stat-meta">Avg predicted leave: {leave.avg_days} days</div>
        </div>
      </div>

      {/* Insights */}
      <div className="hr-grid-wide">
        <div className="hr-card">
          <div className="hr-card-header">
            <span className="hr-card-title">Attrition Analysis</span>
          </div>
          <div className="hr-card-body" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: attritionColor }}>{pct(attrition.leaving_pct)}</div>
              <div>
                <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, background: attritionColor + "20", color: attritionColor, fontSize: 12, fontWeight: 600 }}>{attritionLevel} RISK</span>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Based on {attrition.total} employee records</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1, padding: "12px 16px", borderRadius: 8, background: "#dc262615", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>{attrition.leaving}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Predicted to Leave</div>
              </div>
              <div style={{ flex: 1, padding: "12px 16px", borderRadius: 8, background: "#16a34a15", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{attrition.staying}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Predicted to Stay</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hr-card">
          <div className="hr-card-header">
            <span className="hr-card-title">Performance Breakdown</span>
          </div>
          <div className="hr-card-body" style={{ padding: "20px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>Overall Score</span>
                <span style={{ fontWeight: 600 }}>{performance.avg_score}/5</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(performance.avg_score / 5) * 100}%`, borderRadius: 4, background: performance.avg_score >= 3.5 ? "#16a34a" : "#d97706" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#16a34a15", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{performance.top_performers}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Top Performers (≥4)</div>
              </div>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#d9780615", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#d97706" }}>{performance.total - performance.top_performers - performance.low_performers}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Average (3–4)</div>
              </div>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#dc262615", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>{performance.low_performers}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Low (&lt;3)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="hr-card">
        <div className="hr-card-header">
          <span className="hr-card-title">AI Recommendations</span>
        </div>
        <div className="hr-card-body" style={{ padding: "16px 20px" }}>
          {attrition.leaving_pct > 15 && (
            <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>High Attrition Risk Detected</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {pct(attrition.leaving_pct)} of the workforce is predicted to leave. Consider reviewing compensation, work-life balance, and career growth opportunities.
                </div>
              </div>
            </div>
          )}
          {recruitment.flight_risk_pct > 15 && (
            <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Recruitment Flight Risk</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {pct(recruitment.flight_risk_pct)} of recently recruited employees show signs of leaving early. Strengthen onboarding and engagement programs.
                </div>
              </div>
            </div>
          )}
          {performance.low_performers > 0 && (
            <div style={{ display: "flex", gap: 12, padding: "12px 0" }}>
              <TrendingUp size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Performance Improvement Needed</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {performance.low_performers} employees are predicted to score below 3/5. Schedule performance reviews and assign targeted training programs.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AIInsights;
