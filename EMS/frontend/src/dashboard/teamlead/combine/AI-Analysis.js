import React, { useState, useEffect } from "react";
import "../Tl.css";
import { TrendingUp, Calendar, UserMinus, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import { api } from "../../../utils/api";

const AIAnalysis = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/ai/analytics")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading AI analysis...</div>;

  if (error) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Service Unavailable</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Start the AI service: <code>python api.py</code> in AI_Models/</div>
    </div>
  );

  const { performance, leave, attrition, recruitment } = data;

  const hasRecommendations =
    performance.low_performers > 0 ||
    leave.high_count > 0 ||
    attrition.leaving_pct > 10 ||
    recruitment.flight_risk_pct > 20;

  const perfColor  = performance.avg_score >= 4.0 ? "#16a34a" : performance.avg_score >= 3.0 ? "#d97706" : "#dc2626";
  const perfLabel  = performance.avg_score >= 4.0 ? "Strong" : performance.avg_score >= 3.0 ? "Moderate" : "Needs Attention";

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>AI Team Analysis</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>ML-powered insights across performance, leave, and retention</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          {
            label: "Avg Performance",
            value: `${performance.avg_score}/5`,
            meta: `${performance.top_performers} top performers`,
            icon: <TrendingUp size={17} />,
            iconBg: "#2563eb20",
            iconColor: "#2563eb",
          },
          {
            label: "High Leave Risk",
            value: leave.high_count,
            meta: `Avg ${leave.avg_days} days predicted`,
            icon: <Calendar size={17} />,
            iconBg: "#d9780620",
            iconColor: "#d97706",
          },
          {
            label: "Attrition Risk",
            value: `${attrition.leaving_pct}%`,
            meta: `${attrition.leaving} employees flagged`,
            icon: <UserMinus size={17} />,
            iconBg: "#dc262620",
            iconColor: "#dc2626",
          },
          {
            label: "Flight Risk (Recruitment)",
            value: `${recruitment.flight_risk_pct}%`,
            meta: `${recruitment.flight_risk} of ${recruitment.total} candidates`,
            icon: <Activity size={17} />,
            iconBg: "#7c3aed20",
            iconColor: "#7c3aed",
          },
        ].map(({ label, value, meta, icon, iconBg, iconColor }) => (
          <div key={label} style={{ padding: "16px 18px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{meta}</div>
          </div>
        ))}
      </div>

      {/* Performance & Leave Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Performance Distribution</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: perfColor }}>{performance.avg_score}<span style={{ fontSize: 16, fontWeight: 400 }}>/5</span></div>
            <div>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, background: perfColor + "20", color: perfColor, fontSize: 12, fontWeight: 600 }}>{perfLabel}</span>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{performance.total} employees analyzed</div>
            </div>
          </div>
          {[
            { label: "Top Performers (≥4/5)", count: performance.top_performers, color: "#16a34a" },
            { label: "Average (3–4)", count: performance.total - performance.top_performers - performance.low_performers, color: "#d97706" },
            { label: "Low Performers (<3/5)", count: performance.low_performers, color: "#dc2626" },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{count}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "var(--surface-2)" }}>
                <div style={{ height: "100%", width: `${(count / performance.total) * 100}%`, borderRadius: 3, background: color }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Leave & Retention Snapshot</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#d9780615", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#d97706" }}>{leave.avg_days}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Avg Days Predicted</div>
            </div>
            <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#dc262615", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>{leave.high_count}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>High-Risk Employees</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "var(--surface-2)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Retention Risk</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Attrition Risk</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{attrition.leaving_pct}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>New Hire Flight Risk</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{recruitment.flight_risk_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>AI Recommendations</div>
        {!hasRecommendations ? (
          <div style={{ display: "flex", gap: 12, padding: "10px 0", alignItems: "flex-start" }}>
            <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#16a34a" }}>Team is in good shape</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                No critical risk signals detected. Performance, retention, leave, and recruitment metrics are all within healthy ranges.
              </div>
            </div>
          </div>
        ) : (
          <>
            {performance.low_performers > 0 && (
              <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <TrendingUp size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Schedule Performance Reviews</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {performance.low_performers} team members are predicted to score below 3/5. Assign mentors and structured improvement plans.
                  </div>
                </div>
              </div>
            )}
            {leave.high_count > 0 && (
              <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <Calendar size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Plan for Leave Coverage</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {leave.high_count} employees are predicted to take above-average leave. Arrange cross-training and backup coverage.
                  </div>
                </div>
              </div>
            )}
            {attrition.leaving_pct > 10 && (
              <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: recruitment.flight_risk_pct > 20 ? "1px solid var(--border)" : "none" }}>
                <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Address Retention Risk</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {attrition.leaving_pct}% of team members are at attrition risk. Proactive 1-on-1 check-ins can help identify and resolve concerns early.
                  </div>
                </div>
              </div>
            )}
            {recruitment.flight_risk_pct > 20 && (
              <div style={{ display: "flex", gap: 12, padding: "10px 0" }}>
                <Activity size={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Strengthen New Hire Engagement</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {recruitment.flight_risk_pct}% of recent hires are flagged as flight risks. Improve onboarding, assign mentors, and schedule early check-ins.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;
