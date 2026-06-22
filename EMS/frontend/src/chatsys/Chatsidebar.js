import React, { useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Tooltip from "@mui/material/Tooltip";
import {
  Search,  ChevronDown, ChevronLeft, Plus, Users, VolumeX,
} from "lucide-react";
import "./Chatsidebar.css";

const STATUS_OPTIONS = [
  { value: "online",  label: "Online",  color: "#2bac76" },
  { value: "away",    label: "Away",    color: "#e8a723" },
  { value: "offline", label: "Offline", color: "rgba(255,255,255,0.4)" },
];

const SectionHeader = ({ title, collapsed, onToggle, onAdd, addTooltip }) => (
  <div className="cs-section-header" onClick={onToggle}>
    <div className="cs-section-title-wrap">
      <span className={`cs-section-chevron ${collapsed ? "collapsed" : ""}`}>
        <ChevronDown size={17} />
      </span>
      <span className="cs-section-title">{title}</span>
    </div>
    {onAdd && (
      <Tooltip title={addTooltip || "Add"} placement="right">
        <button className="cs-section-add" onClick={e => { e.stopPropagation(); onAdd(); }}>
          <Plus size={16} />
        </button>
      </Tooltip>
    )}
  </div>
);

const ChannelItem = ({ channel, active, onClick }) => (
  <div
    className={`cs-nav-item ${active ? "active" : ""} ${channel.unread > 0 && !active ? "unread" : ""} ${channel.muted ? "muted" : ""}`}
    onClick={() => onClick(channel.id || channel._id)}
  >
    <span className="cs-nav-prefix">#</span>
    <span className="cs-nav-label">{channel.name}</span>
    {channel.muted && !active && (
      <span className="cs-mute-icon"><VolumeX size={15} /></span>
    )}
    {channel.unread > 0 && !active && !channel.muted && (
      <span className="cs-badge grey">{channel.unread}</span>
    )}
  </div>
);

const DMItem = ({ dm, active, onClick }) => (
  <div
    className={`cs-nav-item ${active ? "active" : ""} ${dm.unread > 0 && !active ? "unread" : ""} ${dm.muted ? "muted" : ""}`}
    onClick={() => onClick(dm.id || `dm-${dm._id}`)}
  >
    <div className="cs-dm-avatar" style={{ background: dm.color }}>
      {dm.initials}
      <span className={`cs-dm-avatar-status ${dm.status || "offline"}`} />
    </div>
    <span className="cs-nav-label">{dm.name}</span>
    {dm.muted && !active && (
      <span className="cs-mute-icon"><VolumeX size={15} /></span>
    )}
    {dm.unread > 0 && !active && !dm.muted && (
      <span className="cs-badge">{dm.unread}</span>
    )}
  </div>
);

const GroupItem = ({ group, active, onClick }) => (
  <div
    className={`cs-nav-item ${active ? "active" : ""} ${group.unread > 0 && !active ? "unread" : ""} ${group.muted ? "muted" : ""}`}
    onClick={() => onClick(group.id || `grp-${group._id}`)}
  >
    <div className="cs-group-icon"><Users size={15} /></div>
    <span className="cs-nav-label">{group.name}</span>
    {group.muted && !active && (
      <span className="cs-mute-icon"><VolumeX size={15} /></span>
    )}
    {group.unread > 0 && !active && !group.muted && (
      <span className="cs-badge grey">{group.unread}</span>
    )}
  </div>
);

const AddLink = ({ label, onClick }) => (
  <div className="cs-add-link" onClick={onClick}>
    <div className="cs-add-link-icon"><Plus size={13} /></div>
    <span className="cs-add-link-label">{label}</span>
  </div>
);

/* ── Main Component ── */
const ChatSidebar = ({
  activeChat,
  onChatChange,
  onBackToDashboard,
  channels      = [],
  dms           = [],
  groups        = [],
  currentUser   = {},
  workspace     = "CompanyChat",
  onAddChannel  = () => {},
  onNewDM       = () => {},
  onNewGroup    = () => {},
}) => {
  const [channelsCollapsed, setChannelsCollapsed] = useState(false);
  const [dmsCollapsed,      setDmsCollapsed]       = useState(false);
  const [groupsCollapsed,   setGroupsCollapsed]    = useState(false);
  const [userStatus,        setUserStatus]          = useState("online");
  const [showStatusMenu,    setShowStatusMenu]      = useState(false);
  const [searchQuery,       setSearchQuery]         = useState("");

  const q = searchQuery.toLowerCase();
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(q));
  const filteredDMs      = dms.filter(d => d.name.toLowerCase().includes(q));
  const filteredGroups   = groups.filter(g => g.name.toLowerCase().includes(q));

  const sidebarContent = (
    <Box className="chat-root chat-sidebar" sx={{ width: 260 }} role="navigation" aria-label="Chat sidebar">

      {/* ── Header ── */}
      <div className="cs-header">
        <div className="cs-header-left">
          <span className="cs-workspace-name">{workspace}</span>
          <button className="cs-back-btn" onClick={onBackToDashboard} aria-label="Back to dashboard">
            <ChevronLeft size={15} />
            Back to Dashboard
          </button>
        </div>
        {/* <Tooltip title="Preferences" placement="right">
          <button className="cs-settings-btn" aria-label="Settings">
            <Settings size={18} />
          </button>
        </Tooltip> */}
      </div>

      {/* ── Search ── */}
      <div className="cs-search-wrap">
        <div className="cs-search-inner">
          <span className="cs-search-icon"><Search size={20} /></span>
          <input
            className="cs-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search channels and people"
          />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="cs-body">

        {/* ── Channels ── */}
        <div className="cs-section">
          <SectionHeader
            title="Channels"
            collapsed={channelsCollapsed}
            onToggle={() => setChannelsCollapsed(prev => !prev)}
            onAdd={onAddChannel}
            addTooltip="Add a channel"
          />
          {!channelsCollapsed && (
            <List disablePadding>
              {filteredChannels.map(ch => (
                <ListItem key={ch.id || ch._id} disablePadding disableGutters>
                  <ChannelItem channel={ch} active={activeChat === (ch.id || ch._id)} onClick={onChatChange} />
                </ListItem>
              ))}
              {filteredChannels.length === 0 && searchQuery && (
                <ListItem disablePadding disableGutters>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "4px 16px" }}>No channels found</span>
                </ListItem>
              )}
              <ListItem disablePadding disableGutters>
                <AddLink label="Add a channel" onClick={onAddChannel} />
              </ListItem>
            </List>
          )}
        </div>

        <div className="cs-divider" />

        {/* ── Direct Messages ── */}
        <div className="cs-section">
          <SectionHeader
            title="Direct Messages"
            collapsed={dmsCollapsed}
            onToggle={() => setDmsCollapsed(prev => !prev)}
            onAdd={onNewDM}
            addTooltip="New direct message"
          />
          {!dmsCollapsed && (
            <List disablePadding>
              {filteredDMs.map(dm => (
                <ListItem key={dm.id || dm._id} disablePadding disableGutters>
                  <DMItem dm={dm} active={activeChat === (dm.id || `dm-${dm._id}`)} onClick={onChatChange} />
                </ListItem>
              ))}
              {filteredDMs.length === 0 && searchQuery && (
                <ListItem disablePadding disableGutters>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "4px 16px" }}>No contacts found</span>
                </ListItem>
              )}
              <ListItem disablePadding disableGutters>
                <AddLink label="New message" onClick={onNewDM} />
              </ListItem>
            </List>
          )}
        </div>

        <div className="cs-divider" />

        {/* ── Groups ── */}
        <div className="cs-section">
          <SectionHeader
            title="Groups"
            collapsed={groupsCollapsed}
            onToggle={() => setGroupsCollapsed(prev => !prev)}
            onAdd={onNewGroup}
            addTooltip="New group"
          />
          {!groupsCollapsed && (
            <List disablePadding>
              {filteredGroups.map(grp => (
                <ListItem key={grp.id || grp._id} disablePadding disableGutters>
                  <GroupItem group={grp} active={activeChat === (grp.id || `grp-${grp._id}`)} onClick={onChatChange} />
                </ListItem>
              ))}
              {filteredGroups.length === 0 && searchQuery && (
                <ListItem disablePadding disableGutters>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "4px 16px" }}>No groups found</span>
                </ListItem>
              )}
              <ListItem disablePadding disableGutters>
                <AddLink label="New group" onClick={onNewGroup} />
              </ListItem>
            </List>
          )}
        </div>
      </div>

      {/* ── Status Dropdown ── */}
      {showStatusMenu && (
        <div className="cs-status-dropdown">
          {STATUS_OPTIONS.map(s => (
            <div
              key={s.value}
              className={`cs-status-option ${userStatus === s.value ? "selected" : ""}`}
              onClick={() => { setUserStatus(s.value); setShowStatusMenu(false); }}
            >
              <span className="cs-status-option-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      {/* ── User Card ── */}
      <div
        className="cs-user-card"
        onClick={() => setShowStatusMenu(prev => !prev)}
        aria-label="Change status"
      >
        <div className="cs-user-avatar-wrap">
          <div className="cs-user-avatar" style={{ background: currentUser.color || "#2563eb" }}>
            {currentUser.initials || "?"}
          </div>
          <span className={`cs-user-avatar-dot ${userStatus}`} />
        </div>
        <div className="cs-user-info">
          <div className="cs-user-name">{currentUser.name || "User"}</div>
          <div className="cs-user-role">{currentUser.role || ""}</div>
        </div>
        <span style={{ color: "white", display: "flex", flexShrink: 0 }}>
          <ChevronDown size={17} />
        </span>
      </div>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 260,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 260,
          boxSizing: "border-box",
          background: "transparent",
          border: "none",
          overflow: "hidden",
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default ChatSidebar;
