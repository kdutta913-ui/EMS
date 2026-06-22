import React, { useState } from "react";
import "../CAdmin.css";
import { Bell, Shield } from "lucide-react";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    leaveApprovals: true,
    newRegistrations: true,
    payrollProcessed: false,
    systemAlerts: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      {saved && <div style={{ color: "green", marginBottom: 14, fontSize: 13, fontWeight: 600 }}>Settings saved.</div>}

      <div className="ca-card" style={{ marginBottom: 24 }}>
        <div className="ca-card-header">
          <span className="ca-card-title"><Bell size={16} style={{ marginRight: 8 }} />Notification Preferences</span>
        </div>
        <div className="ca-card-body">
          {[
            ["leaveApprovals",    "Leave Approval Requests",  "Notify when employees submit leave requests"],
            ["newRegistrations",  "New Employee Registrations","Notify when a new employee is added"],
            ["payrollProcessed",  "Payroll Processed",        "Notify when monthly payroll is completed"],
            ["systemAlerts",      "System Alerts",            "Important system notifications"],
          ].map(([key, label, desc]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
              </div>
              <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
                <input type="checkbox" checked={notifications[key]} onChange={e => setNotifications({ ...notifications, [key]: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: "absolute", inset: 0, borderRadius: 24, background: notifications[key] ? "var(--accent)" : "var(--border)", transition: "0.3s"
                }}>
                  <span style={{
                    position: "absolute", top: 2, left: notifications[key] ? 22 : 2, width: 20, height: 20,
                    background: "#fff", borderRadius: "50%", transition: "0.3s"
                  }} />
                </span>
              </label>
            </div>
          ))}
          <button className="ca-btn-approve" style={{ marginTop: 20 }} onClick={handleSave}>Save Preferences</button>
        </div>
      </div>

      <div className="ca-card">
        <div className="ca-card-header">
          <span className="ca-card-title"><Shield size={16} style={{ marginRight: 8 }} />Integrations</span>
        </div>
        <div className="ca-card-body">
          <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔌</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Integrations Coming Soon</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Connect Slack, Google Workspace, Razorpay and more to automate your HR workflows.</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
