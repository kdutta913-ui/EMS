import React, { useState, useEffect } from "react";
import "../CAdmin.css";
import { Building2, Mail, Phone, Globe, Edit } from "lucide-react";
import { api } from "../../../utils/api";

const CompanyProfile = () => {
  const [company,  setCompany]  = useState(null);
  const [form,     setForm]     = useState({});
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const loadCompany = () => {
    api.get("/company").then(data => {
      const c = data.company;
      setCompany(c);
      setForm({
        name: c.name || "", email: c.email || "", phone: c.phone || "",
        industry: c.industry || "", website: c.website || "",
        gstin: c.gstin || "", pan: c.pan || "",
        "address.street":  c.address?.street  || "",
        "address.city":    c.address?.city    || "",
        "address.state":   c.address?.state   || "",
        "address.pincode": c.address?.pincode || "",
      });
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { loadCompany(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const data = await api.put("/company", {
        name: form.name, email: form.email, phone: form.phone,
        industry: form.industry, website: form.website, gstin: form.gstin, pan: form.pan,
        address: { street: form["address.street"], city: form["address.city"], state: form["address.state"], pincode: form["address.pincode"] },
      });
      setCompany(data.company);
      setEditing(false);
      setSuccess("Company profile updated.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <>
      {error   && <div style={{ color: "red",   marginBottom: 14, fontSize: 13 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 14, fontSize: 13 }}>{success}</div>}

      <div className="ca-card" style={{ marginBottom: 24 }}>
        <div className="ca-card-header">
          <span className="ca-card-title">{company?.name || "Company Profile"}</span>
          <button className="ca-card-action" onClick={() => setEditing(!editing)}>
            <Edit size={13} /> {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
        <div className="ca-card-body">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
            {company?.email    && <span><Mail size={13} style={{ marginRight: 5 }} />{company.email}</span>}
            {company?.phone    && <span><Phone size={13} style={{ marginRight: 5 }} />{company.phone}</span>}
            {company?.website  && <span><Globe size={13} style={{ marginRight: 5 }} />{company.website}</span>}
            {company?.industry && <span><Building2 size={13} style={{ marginRight: 5 }} />{company.industry}</span>}
          </div>
          {company?.address?.city && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
              {[company.address.street, company.address.city, company.address.state, company.address.pincode].filter(Boolean).join(", ")}
            </div>
          )}
          <div style={{ fontSize: 13, display: "flex", gap: 24 }}>
            {company?.gstin && <span>GSTIN: <strong>{company.gstin}</strong></span>}
            {company?.pan   && <span>PAN: <strong>{company.pan}</strong></span>}
          </div>
        </div>
      </div>

      {editing && (
        <div className="ca-card" style={{ marginBottom: 24 }}>
          <div className="ca-card-header"><span className="ca-card-title">Edit Company Details</span></div>
          <div className="ca-card-body">
            <form onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {[
                  ["name","Company Name"],["email","Email"],["phone","Phone"],
                  ["industry","Industry"],["website","Website"],["gstin","GSTIN"],["pan","PAN"],
                  ["address.street","Street"],["address.city","City"],["address.state","State"],["address.pincode","Pincode"],
                ].map(([id, label]) => (
                  <div key={id}>
                    <label className="ca-emp-id">{label}</label>
                    <input className="ca-input" value={form[id] || ""} placeholder={label}
                      onChange={e => setForm({ ...form, [id]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button type="submit" className="ca-btn-approve" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" className="ca-btn-reject" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header"><span className="ca-stat-label">Total Employees</span><div className="ca-stat-icon blue"><Building2 size={17} /></div></div>
          <div className="ca-stat-value">{company?.employeeCount ?? 0}</div>
          <div className="ca-stat-meta">Registered employees</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header"><span className="ca-stat-label">Industry</span><div className="ca-stat-icon green"><Building2 size={17} /></div></div>
          <div className="ca-stat-value" style={{ fontSize: 18 }}>{company?.industry || "—"}</div>
          <div className="ca-stat-meta">Business sector</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header"><span className="ca-stat-label">Administrator</span><div className="ca-stat-icon amber"><Building2 size={17} /></div></div>
          <div className="ca-stat-value" style={{ fontSize: 16 }}>{company?.adminId?.name || "—"}</div>
          <div className="ca-stat-meta">Company Admin</div>
        </div>
      </div>
    </>
  );
};

export default CompanyProfile;
