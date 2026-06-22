const AVATAR_COLORS = [
  "#2563eb","#7c3aed","#d97706","#db2777",
  "#10b981","#0d9488","#dc2626","#ea580c","#0891b2","#65a30d",
];

const getAvatarColor = (seed = "") => {
  const n = seed.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "??";

module.exports = { getAvatarColor, getInitials };
