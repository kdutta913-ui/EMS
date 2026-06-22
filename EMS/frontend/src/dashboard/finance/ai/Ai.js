import React, { useState, useEffect } from "react";
import "../Finance.css";
import { Wallet, ShieldAlert, AlertCircle, Receipt, AlertTriangle } from "lucide-react";
import { api } from "../../../utils/api";

const fmt = (n) => Number(n).toLocaleString("en-IN");

const ALERT_COLORS = { HIGH: "#dc2626", WARNING: "#d97706", LOW: "#16a34a" };

const AIFinance = () => {
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

  const { payroll, fraud } = data;
  const alertColor = ALERT_COLORS[fraud.alert_level] || "#16a34a";

  return (
    <>
      {/* Stat Cards */}
      <div className="fin-stats-grid">
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Avg Predicted Salary</span>
            <div className="fin-stat-icon blue"><Wallet size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{fmt(payroll.avg_salary)}</div>
          <div className="fin-stat-meta">Per employee · monthly</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Payroll Cost</span>
            <div className="fin-stat-icon green"><Receipt size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{fmt(payroll.total_cost)}</div>
          <div className="fin-stat-meta">Across {payroll.total} employee records</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Fraud Flagged</span>
            <div className="fin-stat-icon" style={{ background: alertColor + "20", color: alertColor }}>
              <ShieldAlert size={17} strokeWidth={1.8} />
            </div>
          </div>
          <div className="fin-stat-value" style={{ color: alertColor }}>{fraud.flagged}</div>
          <div className="fin-stat-meta">{fraud.fraud_pct}% of expense records</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Fraud Alert Level</span>
            <div className="fin-stat-icon" style={{ background: alertColor + "20", color: alertColor }}>
              <AlertCircle size={17} strokeWidth={1.8} />
            </div>
          </div>
          <div className="fin-stat-value" style={{ color: alertColor, fontSize: 22 }}>{fraud.alert_level}</div>
          <div className="fin-stat-meta">{fraud.total} expense records analyzed</div>
        </div>
      </div>

      {/* Payroll & Fraud Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="fin-card">
          <div className="fin-card-header">
            <span className="fin-card-title">Payroll Analysis</span>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Average Monthly Income</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(payroll.avg_salary)}</div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 8, background: "var(--surface-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Employees Analyzed</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{payroll.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Monthly Payroll</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(payroll.total_cost)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fin-card">
          <div className="fin-card-header">
            <span className="fin-card-title">Expense Fraud Detection</span>
          </div>
          <div style={{ padding: "20px" }}>
            {fraud.alert_level !== "LOW" && (
              <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 8, background: alertColor + "15", marginBottom: 16 }}>
                <ShieldAlert size={15} color={alertColor} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: alertColor, fontWeight: 500 }}>
                  {fraud.alert_level === "HIGH"
                    ? `HIGH ALERT: ${fraud.flagged} fraudulent expense records detected.`
                    : `WARNING: ${fraud.flagged} suspicious expense claims flagged.`}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: alertColor + "15", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: alertColor }}>{fraud.flagged}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Flagged Records</div>
              </div>
              <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#16a34a15", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a" }}>{fraud.total - fraud.flagged}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Clean Records</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Fraud Rate</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: alertColor }}>{fraud.fraud_pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--surface-2)" }}>
                <div style={{ height: "100%", width: `${Math.min(fraud.fraud_pct, 100)}%`, borderRadius: 3, background: alertColor }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {fraud.alert_level !== "LOW" && (
        <div className="fin-card">
          <div className="fin-card-header">
            <span className="fin-card-title">AI Recommendations</span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 12, padding: "12px 0" }}>
              <AlertTriangle size={16} color={alertColor} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {fraud.alert_level === "HIGH" ? "Immediate Audit Required" : "Review Flagged Claims"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {fraud.flagged} expense records ({fraud.fraud_pct}%) have been flagged as potentially fraudulent.
                  {fraud.alert_level === "HIGH"
                    ? " Initiate an immediate financial audit and escalate to compliance."
                    : " Assign a finance reviewer to manually verify the flagged submissions."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIFinance;
