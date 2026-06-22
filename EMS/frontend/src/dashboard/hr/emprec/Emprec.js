import React, { useState, useEffect, useCallback } from "react";
import "../Hrdash.css";
import { api } from "../../../utils/api";

const Emprec = () => {
  const [employees,  setEmployees]  = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [department, setDepartment] = useState("");
  const [status,     setStatus]     = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (search)     params.set("search",     search);
      if (department) params.set("department", department);
      if (status)     params.set("status",     status.toLowerCase());
      const data = await api.get(`/employees?${params}`);
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  }, [search, department, status]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const deptCounts = employees.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="hr-card" style={{ marginBottom: 20 }}>
        <div className="hr-card-header"><span className="hr-card-title">Employee Records ({total})</span></div>
        <div className="hr-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <input className="ca-input" placeholder="Search by name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="ca-input" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {["Engineering","Design","HR","Finance","Marketing","Operations","Sales"].map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="ca-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option>Active</option><option>Pending</option><option>Inactive</option><option>Probation</option>
            </select>
          </div>
        </div>
      </div>

      {Object.keys(deptCounts).length > 0 && (
        <div className="hr-card" style={{ marginBottom: 20 }}>
          <div className="hr-card-header"><span className="hr-card-title">Department Distribution</span></div>
          <div className="hr-card-body" style={{ padding: "0 20px 16px" }}>
            <table className="hr-table">
              <thead><tr><th>Department</th><th>Count</th></tr></thead>
              <tbody>{Object.entries(deptCounts).map(([dept, cnt]) => <tr key={dept}><td>{dept}</td><td>{cnt}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="hr-card">
        <div className="hr-card-header"><span className="hr-card-title">Employee Directory</span></div>
        <div className="hr-card-body" style={{ padding: "0 20px 20px" }}>
          {loading ? <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
            : employees.length === 0 ? <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No employees found.</p>
            : (
              <table className="hr-table">
                <thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Joined</th><th>Status</th></tr></thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e._id}>
                      <td>
                        <div className="hr-leave-name">{e.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.employeeCode} · {e.email}</div>
                      </td>
                      <td>{e.department}</td>
                      <td>{e.role || e.designation || "—"}</td>
                      <td style={{ fontSize: 13 }}>{e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString("en-IN") : "—"}</td>
                      <td><span className={`hr-tag ${e.status}`}>{e.status?.charAt(0).toUpperCase() + e.status?.slice(1)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  );
};

export default Emprec;
