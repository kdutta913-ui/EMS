import React, { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const colors = ["#2563eb","#7c3aed","#db2777","#d97706","#16a34a","#0d9488","#dc2626","#9333ea"];
const initials = n => n?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "??";
const color    = n => colors[(n?.length || 0) % colors.length];

const TECH_KEYWORDS = [
  "engineer", "developer", "dev", "software", "frontend", "backend",
  "fullstack", "full stack", "qa", "quality assurance", "devops", "data",
  "architect", "tech", "product", "design", "ux", "ui", "cloud",
  "security", "network", "database", "analyst", "programmer", "it",
  "infrastructure", "mobile", "android", "ios", "machine learning", "ml", "ai",
];

const isTechRole = (employee) => {
  const fields = [
    employee.role, employee.designation, employee.department,
  ].map(f => (f || "").toLowerCase());
  return TECH_KEYWORDS.some(kw => fields.some(f => f.includes(kw)));
};

const Myteam = () => {
  const [team,     setTeam]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    api.get("/employees?limit=200")
      .then(data => {
        const techOnly = (data.employees || []).filter(isTechRole);
        setTeam(techOnly);
      })
      .catch(err => console.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = team.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading team...</div>;

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>My Team</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{team.length} tech members</div>
        </div>
        <input className="ca-input" placeholder="Search members..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          {team.length === 0 ? "No tech members found." : "No members match your search."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map(m => (
            <div key={m._id} className="tl-card" style={{ cursor: "pointer" }} onClick={() => setSelected(m)}>
              <div style={{ padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: color(m.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{initials(m.name)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.role || m.designation || "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.department}</div>
                </div>
              </div>
              <div style={{ padding: "8px 20px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
                <span className={`tl-tag ${m.status}`} style={{ fontSize: 11 }}>
                  {m.status?.charAt(0).toUpperCase() + m.status?.slice(1)}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.employmentType}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "var(--surface)", borderRadius: 12, padding: 28, width: 380, maxWidth: "90%" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: color(selected.name),
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20 }}>
                {initials(selected.name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{selected.role || selected.designation || "—"} · {selected.department}</div>
              </div>
            </div>
            {[
              ["Employee ID", selected.employeeCode], ["Email", selected.email],
              ["Phone", selected.phone || "—"], ["Employment", selected.employmentType],
              ["Status", selected.status], ["Joined", selected.dateOfJoining ? new Date(selected.dateOfJoining).toLocaleDateString("en-IN") : "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <button className="ca-btn-reject" style={{ marginTop: 16, width: "100%" }} onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Myteam;
