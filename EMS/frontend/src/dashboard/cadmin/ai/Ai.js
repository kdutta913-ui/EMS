import React, { useState, useEffect } from "react";
import "../CAdmin.css";
import { TrendingUp, UserMinus, Users, BarChart2, AlertTriangle } from "lucide-react";
import { api } from "../../../utils/api";

const fmtNum = (n) => Number(n).toLocaleString("en-IN");
const CURRENCY_SCALE = 100_000;
const fmtCurrency = (n) => "₹" + (Number(n) * CURRENCY_SCALE).toLocaleString("en-IN");

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

  const { attrition, growth, recruitment, performance } = data;

  return (
    <>
      {/* Stat Cards */}
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Avg Predicted Revenue</span>
            <div className="ca-stat-icon green"><TrendingUp size={17} /></div>
          </div>
          <div className="ca-stat-value">{fmtCurrency(growth.avg_revenue)}</div>
          <div className="ca-stat-meta">Across {growth.total} growth periods</div>
        </div>

        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Avg Predicted Profit</span>
            <div className="ca-stat-icon blue"><BarChart2 size={17} /></div>
          </div>
          <div className="ca-stat-value">{fmtCurrency(growth.avg_profit)}</div>
          <div className="ca-stat-meta">Estimated from workforce data</div>
        </div>

        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Attrition Risk</span>
            <div className="ca-stat-icon red"><UserMinus size={17} /></div>
          </div>
          <div className="ca-stat-value">{attrition.leaving_pct}%</div>
          <div className="ca-stat-meta">{attrition.leaving} employees predicted to leave</div>
        </div>

        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Workforce Analyzed</span>
            <div className="ca-stat-icon amber"><Users size={17} /></div>
          </div>
          <div className="ca-stat-value">{fmtNum(attrition.total)}</div>
          <div className="ca-stat-meta">Avg performance: {performance.avg_score}/5</div>
        </div>
      </div>

      {/* Company Growth & Attrition Detail */}
      <div className="ca-grid-wide" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="ca-card">
          <div className="ca-card-header">
            <span className="ca-card-title">Company Growth Forecast</span>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: "16px", borderRadius: 8, background: "#16a34a15", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Revenue</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{fmtCurrency(growth.avg_revenue)}</div>
              </div>
              <div style={{ flex: 1, padding: "16px", borderRadius: 8, background: "#2563eb15", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Profit</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2563eb" }}>{fmtCurrency(growth.avg_profit)}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Revenue-to-profit ratio: <strong>{growth.avg_revenue > 0 ? ((growth.avg_profit / growth.avg_revenue) * 100).toFixed(1) : "N/A"}%</strong>. Based on workforce size and historical growth patterns.
            </div>
          </div>
        </div>

        <div className="ca-card">
          <div className="ca-card-header">
            <span className="ca-card-title">Workforce Risk Summary</span>
          </div>
          <div style={{ padding: "20px" }}>
            {[
              { label: "Attrition Risk", value: attrition.leaving_pct, color: attrition.leaving_pct > 20 ? "#dc2626" : attrition.leaving_pct > 10 ? "#d97706" : "#16a34a" },
              { label: "Recruitment Flight Risk", value: recruitment.flight_risk_pct, color: recruitment.flight_risk_pct > 20 ? "#dc2626" : recruitment.flight_risk_pct > 10 ? "#d97706" : "#16a34a" },
              { label: "Low Performance Rate", value: ((performance.low_performers / performance.total) * 100).toFixed(1), color: "#2563eb" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13 }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color }}>{value}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)" }}>
                  <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, borderRadius: 3, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="ca-card">
        <div className="ca-card-header">
          <span className="ca-card-title">AI Recommendations</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {attrition.leaving_pct > 15 && (
            <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Attrition Threatens Workforce Stability</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {attrition.leaving} employees ({attrition.leaving_pct}%) are predicted to leave. Review compensation benchmarks and career progression policies company-wide.
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, padding: "12px 0" }}>
            <TrendingUp size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Growth Trajectory Looks Positive</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                Predicted average revenue of {fmtCurrency(growth.avg_revenue)} with {fmtCurrency(growth.avg_profit)} in profit indicates a healthy growth margin. Continue investing in workforce development.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIInsights;
