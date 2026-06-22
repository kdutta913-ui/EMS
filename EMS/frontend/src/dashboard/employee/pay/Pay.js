import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import "../comb/EmpPages.css";
import { api } from "../../../utils/api";

const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";

const Payslip = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(0);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("/payroll/payslips/my")
      .then(data => setPayslips(data.payslips || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading payslips...</div>;
  if (error)   return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;

  const latest = payslips[0];

  return (
    <div className="ps-page">
      <div className="ps-page-header">
        <div>
          <div className="ps-page-title">Payslip</div>
          <div className="ps-page-sub">View and download your monthly payslips</div>
        </div>
      </div>

      {/* Stats from latest payslip */}
      {latest && (
        <div className="shared-grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: "Monthly Gross",   value: fmt(latest.grossPay),        meta: "Before deductions"  },
            { label: "Monthly Net",     value: fmt(latest.netPay),          meta: "After deductions"   },
            { label: "Total Deductions",value: fmt(latest.totalDeductions),  meta: "PF, TDS, ESI"       },
            { label: "Present Days",    value: latest.presentDays ?? "—",   meta: `of ${latest.workingDays} working days` },
          ].map((s, i) => (
            <div className="shared-stat" key={i} style={{ borderLeftColor: ["var(--accent)","var(--success)","var(--danger)","var(--warning)"][i] }}>
              <div className="shared-stat-label">{s.label}</div>
              <div className="shared-stat-value" style={{ fontSize: 22 }}>{s.value}</div>
              <div className="shared-stat-meta">{s.meta}</div>
            </div>
          ))}
        </div>
      )}

      {payslips.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No payslips available yet.</div>
      ) : (
        payslips.map((p, i) => (
          <div className="ps-payslip-card" key={p._id}>
            <div className="ps-payslip-header" style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === i ? -1 : i)}>
              <div>
                <div className="ps-payslip-month">{monthNames[p.month - 1]} {p.year}</div>
                <div className="ps-payslip-sub">
                  <span className="shared-tag credited" style={{ fontSize: 12, padding: "2px 10px" }}>{p.status}</span>
                </div>
              </div>
              <div>
                <div className="ps-payslip-net">{fmt(p.netPay)}</div>
                <div className="ps-payslip-net-label">Net Pay</div>
              </div>
            </div>

            {expanded === i && (
              <>
                <div className="ps-breakdown">
                  <div className="ps-breakdown-col">
                    <div className="ps-breakdown-title">Earnings</div>
                    {Object.entries(p.earnings || {}).map(([key, val]) => (
                      <div className="ps-breakdown-row" key={key}>
                        <span className="ps-breakdown-label">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="ps-breakdown-val green">{fmt(val)}</span>
                      </div>
                    ))}
                    <div className="ps-breakdown-row" style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 10 }}>
                      <span className="ps-breakdown-label" style={{ fontWeight: 700 }}>Gross Total</span>
                      <span className="ps-breakdown-val green" style={{ fontSize: 16 }}>{fmt(p.grossPay)}</span>
                    </div>
                  </div>
                  <div className="ps-breakdown-col">
                    <div className="ps-breakdown-title">Deductions</div>
                    {Object.entries(p.deductions || {}).map(([key, val]) => (
                      <div className="ps-breakdown-row" key={key}>
                        <span className="ps-breakdown-label">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="ps-breakdown-val red">−{fmt(val)}</span>
                      </div>
                    ))}
                    <div className="ps-breakdown-row" style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 10 }}>
                      <span className="ps-breakdown-label" style={{ fontWeight: 700 }}>Net Pay</span>
                      <span className="ps-breakdown-val green" style={{ fontSize: 16 }}>{fmt(p.netPay)}</span>
                    </div>
                  </div>
                </div>
                <div className="ps-download-row">
                  <button className="shared-btn"><Download size={14} /> Download PDF</button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Payslip;
