import React, { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";

const CheckInOutWidget = () => {
  const [record, setRecord]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const data = await api.get("/attendance/today");
      setRecord(data.record);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await api.post("/attendance/checkin", {});
      await fetchToday();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      await api.post("/attendance/checkout", {});
      await fetchToday();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  if (loading) return null;

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  };

  const statusBadge = {
    fontSize: 12,
    fontWeight: 600,
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    borderRadius: 6,
    padding: "4px 8px",
    whiteSpace: "nowrap",
  };

  if (!record?.checkIn) {
    return (
      <button
        style={{ ...btnBase, background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }}
        onClick={handleCheckIn}
        disabled={busy}
      >
        {busy ? "..." : "Check In"}
      </button>
    );
  }

  if (record.checkIn && !record.checkOut) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={statusBadge}>In: {record.checkIn}</span>
        <button
          style={{ ...btnBase, background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          onClick={handleCheckOut}
          disabled={busy}
        >
          {busy ? "..." : "Check Out"}
        </button>
      </div>
    );
  }

  return (
    <span style={statusBadge}>✓ {record.checkIn} → {record.checkOut}</span>
  );
};

export default CheckInOutWidget;
