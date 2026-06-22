import React, { useState, useRef, useEffect, useCallback } from "react";
import Tooltip from "@mui/material/Tooltip";
import {
  Plus, Send, Smile, Paperclip, AtSign,
  Bold, Italic, Strikethrough, Link2,
  List, ListOrdered, Code, MoreHorizontal,
  Pin, Reply, ChevronDown, X, Download,
  Hash, Lock,
} from "lucide-react";
import "./Message.css";
import { chatApi } from "../utils/api";
import { getSocket, connectSocket } from "../utils/socket";

const QUICK_EMOJIS = ["👍","❤️","🎉","🔥","😂","🙌"];

const EMOJI_GROUPS = {
  "Recently used": ["😊","👍","🙏","🎉","🔥","😂","❤️","🙌","✅","💯"],
  "Smileys":       ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍"],
  "Gestures":      ["👍","👎","👌","🤌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","☝️","👇"],
  "Objects":       ["📄","📊","📝","📁","📅","⏰","🔔","🔕","📌","📍","🔗","💡","🔥","⭐"],
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/* ── Sub-components ── */

const ChannelBanner = ({ meta, activeChat }) => {
  if (meta.type === "dm") return (
    <div className="cma-channel-banner">
      <div className="cma-dm-banner-avatar" style={{ background: meta.color || "#2563eb" }}>
        {meta.initials || "?"}
        {meta.status === "online" && <span className="cma-dm-banner-dot" />}
      </div>
      <div className="cma-banner-title">{meta.name}</div>
      <div className="cma-banner-desc">
        {meta.role}
        <span>This is the beginning of your direct message history with {meta.name}.</span>
      </div>
    </div>
  );

  return (
    <div className="cma-channel-banner">
      <div className="cma-banner-icon">
        {meta.type === "group" ? "👥" : <Hash size={28} />}
      </div>
      <div className="cma-banner-title">
        {meta.type === "group" ? meta.name : `#${meta.name || activeChat}`}
      </div>
      <div className="cma-banner-desc">
        {meta.desc}
        {meta.readOnly && <span>🔒 Only admins can post in this channel.</span>}
      </div>
    </div>
  );
};

const DateSep = ({ label }) => (
  <div className="cma-date-sep">
    <div className="cma-date-sep-line" />
    <span className="cma-date-sep-label">{label}</span>
    <div className="cma-date-sep-line" />
  </div>
);

const UnreadSep = ({ count }) => (
  <div className="cma-unread-sep">
    <div className="cma-unread-line" />
    <span className="cma-unread-label">{count} New Message{count > 1 ? "s" : ""}</span>
    <div className="cma-unread-line" />
  </div>
);

const SystemMsg = ({ text }) => (
  <div className="cma-system-msg">
    <div className="cma-system-icon">⚙️</div>
    <span>{text}</span>
  </div>
);

const PinBanner = () => (
  <div className="cma-pin-banner">
    <Pin size={12} /> Pinned message
  </div>
);

const Reactions = ({ reactions, onReact, onAddReact }) => (
  <div className="cma-reactions">
    {reactions.map((r, i) => (
      <Tooltip key={i} title={`${r.count} ${r.count === 1 ? "person" : "people"} reacted`} placement="top">
        <button className={`cma-reaction ${r.mine ? "mine" : ""}`} onClick={() => onReact(r.emoji)}>
          <span>{r.emoji}</span>
          <span className="cma-reaction-count">{r.count}</span>
        </button>
      </Tooltip>
    ))}
    <Tooltip title="Add reaction" placement="top">
      <button className="cma-reaction-add" onClick={onAddReact}>😊</button>
    </Tooltip>
  </div>
);

const ThreadPreview = ({ count, time, avatars }) => (
  <div className="cma-thread-preview">
    <div className="cma-thread-avatars">
      {(avatars || []).slice(0, 3).map((a, i) => (
        <div key={i} className="cma-thread-tiny-avatar" style={{ background: a.color }}>{a.initials}</div>
      ))}
    </div>
    <span className="cma-thread-count">{count} {count === 1 ? "reply" : "replies"}</span>
    <span className="cma-thread-time">Last reply {time}</span>
    <span className="cma-thread-view">View thread →</span>
  </div>
);

const triggerDownload = (url, name) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const Attachment = ({ att }) => (
  <div className="cma-attachment">
    <div className="cma-attachment-icon">{att.icon || "📄"}</div>
    <div className="cma-attachment-info">
      <div className="cma-attachment-name">{att.name}</div>
      <div className="cma-attachment-meta">{att.meta}</div>
    </div>
    <Tooltip title={att.url ? "Download file" : "No download URL available"} placement="top">
      <button
        className="cma-attachment-dl"
        onClick={() => att.url && triggerDownload(att.url, att.name)}
        style={{ opacity: att.url ? 1 : 0.4, cursor: att.url ? "pointer" : "not-allowed" }}
      >
        <Download size={14} />
      </button>
    </Tooltip>
  </div>
);

const ActionBar = ({ onReply, onReact, onPin, onMore, quickEmojis }) => (
  <div className="cma-action-bar">
    {quickEmojis.map((e, i) => (
      <Tooltip key={i} title={e} placement="top">
        <button className="cma-quick-emoji" onClick={() => onReact(e)}>{e}</button>
      </Tooltip>
    ))}
    <div className="cma-action-divider" />
    <Tooltip title="Add reaction" placement="top">
      <button className="cma-action-btn" onClick={onReact}><Smile size={16} /></button>
    </Tooltip>
    <Tooltip title="Reply in thread" placement="top">
      <button className="cma-action-btn" onClick={onReply}><Reply size={16} /></button>
    </Tooltip>
    <Tooltip title="Pin message" placement="top">
      <button className="cma-action-btn" onClick={onPin}><Pin size={16} /></button>
    </Tooltip>
    <Tooltip title="More actions" placement="top">
      <button className="cma-action-btn" onClick={onMore}><MoreHorizontal size={16} /></button>
    </Tooltip>
  </div>
);

const MessageText = ({ text, edited }) => {
  const parts = text.split(/(@\w+(?:\s\w+)?)/g);
  return (
    <div className="cma-msg-text">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="mention">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
      {edited && <span className="cma-edited-label">(edited)</span>}
    </div>
  );
};

const EmojiPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const allEmojis = Object.values(EMOJI_GROUPS).flat();
  const filtered  = search ? allEmojis.filter(e => e.includes(search)) : null;

  return (
    <div className="cma-emoji-picker" ref={ref}>
      <input className="cma-emoji-picker-search" placeholder="Search emoji..."
        value={search} onChange={e => setSearch(e.target.value)} autoFocus />
      {filtered ? (
        <>
          <div className="cma-emoji-picker-section">Results</div>
          <div className="cma-emoji-grid">
            {filtered.map((e, i) => (
              <button key={i} className="cma-emoji-btn" onClick={() => { onSelect(e); onClose(); }}>{e}</button>
            ))}
          </div>
        </>
      ) : (
        Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
          <React.Fragment key={group}>
            <div className="cma-emoji-picker-section">{group}</div>
            <div className="cma-emoji-grid">
              {emojis.map((e, i) => (
                <button key={i} className="cma-emoji-btn" onClick={() => { onSelect(e); onClose(); }}>{e}</button>
              ))}
            </div>
          </React.Fragment>
        ))
      )}
    </div>
  );
};

const Toolbar = () => (
  <div className="cma-toolbar">
    <Tooltip title="Bold (Ctrl+B)" placement="top">
      <button className="cma-toolbar-btn"><Bold size={14} /></button>
    </Tooltip>
    <Tooltip title="Italic (Ctrl+I)" placement="top">
      <button className="cma-toolbar-btn"><Italic size={14} /></button>
    </Tooltip>
    <Tooltip title="Strikethrough" placement="top">
      <button className="cma-toolbar-btn"><Strikethrough size={14} /></button>
    </Tooltip>
    <Tooltip title="Link" placement="top">
      <button className="cma-toolbar-btn"><Link2 size={14} /></button>
    </Tooltip>
    <div className="cma-toolbar-divider" />
    <Tooltip title="Bullet list" placement="top">
      <button className="cma-toolbar-btn"><List size={14} /></button>
    </Tooltip>
    <Tooltip title="Numbered list" placement="top">
      <button className="cma-toolbar-btn"><ListOrdered size={14} /></button>
    </Tooltip>
    <div className="cma-toolbar-divider" />
    <Tooltip title="Code block" placement="top">
      <button className="cma-toolbar-btn"><Code size={14} /></button>
    </Tooltip>
    <Tooltip title="More formatting" placement="top">
      <button className="cma-toolbar-btn"><MoreHorizontal size={14} /></button>
    </Tooltip>
  </div>
);

/* ── Message status (delivery / read receipt) ────────────────────────────
   Visual design: two rounded SVG check-paths.
   sent      = one grey  check
   delivered = two grey  checks
   read      = two blue  checks — second one "blooms" in with animation    */
const MessageStatus = ({ status }) => {
  if (!status) return null;
  const isDouble = status === "delivered" || status === "read";
  const isRead   = status === "read";
  return (
    <span className={`cma-msg-status cma-msg-status--${status}`} title={status}>
      <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d={isDouble ? "M1 6L3.8 8.8L8.5 3" : "M3.5 6L6.3 8.8L11 3"}
          stroke="currentColor" strokeWidth="1.7"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {isDouble && (
          <path
            d="M6 6L8.8 8.8L13.5 3"
            stroke={isRead ? "#3b82f6" : "currentColor"}
            strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round"
            className={isRead ? "cma-tick2-bloom" : ""}
          />
        )}
      </svg>
    </span>
  );
};

/* ── Typing indicator ── */
const TypingIndicator = ({ users }) => {
  if (!users.length) return null;
  const label = users.length === 1
    ? `${users[0]} is typing…`
    : users.length === 2
      ? `${users[0]} and ${users[1]} are typing…`
      : "Several people are typing…";
  return (
    <div className="cma-typing-indicator">
      <span className="cma-typing-dots">
        <span /><span /><span />
      </span>
      <span className="cma-typing-text">{label}</span>
    </div>
  );
};

/* ── Main Component ── */
const ChatMessageArea = ({
  activeChat     = "general",
  userRole,
  panelOpen,
  currentUser    = {},
  allMeta        = {},
  onPinMessage   = () => {},
  refreshTrigger = 0,
}) => {
  const defaultMeta = { type: "channel", name: activeChat, desc: "", readOnly: false };
  const meta = allMeta[activeChat] || defaultMeta;

  const [messages,      setMessages]   = useState([]);
  const [inputText,     setInputText]  = useState("");
  const [replyTo,       setReplyTo]    = useState(null);
  const [fileAttached,  setFile]       = useState(null);
  const [emojiOpen,     setEmojiOpen]  = useState(false);
  const [showScrollFab, setScrollFab]  = useState(false);
  const [typingUsers,   setTypingUsers] = useState([]);

  const feedRef        = useRef(null);
  const inputRef       = useRef(null);
  const fileRef        = useRef(null);
  const typingTimer    = useRef(null);
  const prevChatRef    = useRef(null);
  const activeChatRef  = useRef(activeChat);

  // Keep ref in sync so socket callbacks always see the current chatId
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  /* ── Fetch message history via REST on room change ── */
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await chatApi.getMessages(activeChat);
        setMessages(data.messages || []);
      } catch {
        setMessages([]);
      }
      scrollToBottom("auto");
    };
    fetchMessages();
    setTypingUsers([]);
  }, [activeChat, refreshTrigger]);

  /* ── Connect socket once on mount, register persistent listeners ── */
  useEffect(() => {
    const sock = connectSocket();

    const onNewMessage = ({ chatId, message }) => {
      if (chatId !== activeChatRef.current) return;
      setMessages(prev => [...prev, message]);
      setTimeout(() => scrollToBottom(), 50);
      // Tell sender their message was read — we're actively viewing this chat
      const s = getSocket();
      if (s?.connected) s.emit("mark_read", { chatId });
    };

    const onUserTyping = ({ chatId, name }) => {
      if (chatId !== activeChatRef.current) return;
      setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
    };

    const onUserStoppedTyping = ({ chatId, name }) => {
      if (chatId !== activeChatRef.current) return;
      setTypingUsers(prev => prev.filter(n => n !== name));
    };

    const onPinUpdate = ({ chatId, messageId, pinned }) => {
      if (chatId !== activeChatRef.current) return;
      setMessages(prev => prev.map(m =>
        String(m.id) === String(messageId) ? { ...m, pinned } : m
      ));
    };

    // When the other person reads our messages → upgrade all own messages to "read"
    const onMessagesRead = ({ chatId }) => {
      if (chatId !== activeChatRef.current) return;
      setMessages(prev => prev.map(m =>
        m.status && m.status !== "read" ? { ...m, status: "read" } : m
      ));
    };

    sock.on("new_message",          onNewMessage);
    sock.on("user_typing",          onUserTyping);
    sock.on("user_stopped_typing",  onUserStoppedTyping);
    sock.on("message_pinned",       onPinUpdate);
    sock.on("messages_read",        onMessagesRead);

    return () => {
      sock.off("new_message",         onNewMessage);
      sock.off("user_typing",         onUserTyping);
      sock.off("user_stopped_typing", onUserStoppedTyping);
      sock.off("message_pinned",      onPinUpdate);
      sock.off("messages_read",       onMessagesRead);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Join / leave rooms when activeChat changes ── */
  useEffect(() => {
    const sock = getSocket();

    const joinRoom = () => {
      if (prevChatRef.current && prevChatRef.current !== activeChat) {
        sock.emit("leave_chat", prevChatRef.current);
      }
      sock.emit("join_chat", activeChat);   // server auto-marks unread as read
      prevChatRef.current = activeChat;
    };

    if (sock.connected) {
      joinRoom();
    } else {
      sock.once("connect", joinRoom);
    }

    return () => {
      sock.off("connect", joinRoom);
    };
  }, [activeChat]);

  /* ── Scroll helpers ── */
  const scrollToBottom = (behavior = "smooth") => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const el = feedRef.current;
    if (!el) return;
    setScrollFab(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  /* ── Send message via socket (REST fallback) ── */
  const sendMessage = useCallback(() => {
    if (!inputText.trim() && !fileAttached) return;

    const now    = new Date();
    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id:          tempId,
      senderId:    String(currentUser.id || ""),
      sender:      currentUser.name     || "Me",
      initials:    currentUser.initials || "?",
      color:       currentUser.color    || "#2563eb",
      text:        inputText.trim(),
      status:      "sent",
      time:        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      date:        todayLabel(),
      reactions:   [],
      pinned:      false,
      mention:     false,
      consecutive: messages[messages.length - 1]?.sender === (currentUser.name || "Me"),
      ...(fileAttached ? { attachment: { icon: "📄", name: fileAttached, meta: "File" } } : {}),
      ...(replyTo ? { replyTo } : {}),
    };

    // Optimistic update
    setMessages(prev => [...prev, newMsg]);
    const capturedText    = inputText.trim();
    const capturedReplyTo = replyTo;
    setInputText("");
    setReplyTo(null);
    setFile(null);
    setTimeout(() => scrollToBottom(), 50);

    // Stop typing indicator
    clearTimeout(typingTimer.current);
    const sock = getSocket();
    if (sock?.connected) {
      sock.emit("typing_stop", { chatId: activeChat });
    }

    const sock2 = getSocket();
    if (sock2?.connected) {
      sock2.emit(
        "send_message",
        {
          chatId:     activeChat,
          text:       capturedText,
          replyTo:    capturedReplyTo || null,
          attachment: fileAttached ? { name: fileAttached, meta: "File" } : null,
        },
        (res) => {
          if (res?.ok && res.message) {
            // Replace optimistic message with server-confirmed one
            setMessages(prev => prev.map(m =>
              m.id === tempId
                ? { ...res.message, consecutive: newMsg.consecutive }
                : m
            ));
          }
        }
      );
    } else {
      // Fallback: REST API when socket is unavailable
      chatApi.sendMessage(activeChat, { text: capturedText }).catch(() => {});
    }
  }, [activeChat, inputText, fileAttached, replyTo, messages, currentUser]);

  /* ── Typing indicator emission ── */
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    const sock = getSocket();
    if (!sock?.connected) return;

    sock.emit("typing_start", { chatId: activeChat });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sock.emit("typing_stop", { chatId: activeChat });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Pin ── */
  const handlePinMessage = async (msgId) => {
    try {
      const data = await onPinMessage(activeChat, msgId);
      if (data !== undefined) {
        setMessages(prev => prev.map(m =>
          String(m.id) === String(msgId) ? { ...m, pinned: data.pinned } : m
        ));
        // Broadcast pin change to other room members
        const sock = getSocket();
        if (sock?.connected) {
          sock.emit("pin_update", { chatId: activeChat, messageId: msgId, pinned: data.pinned });
        }
      }
    } catch (err) {
      console.error("Pin failed:", err.message);
    }
  };

  /* ── Reactions (local only) ── */
  const toggleReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions?.find(r => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions.map(r =>
          r.emoji === emoji
            ? { ...r, count: r.mine ? r.count - 1 : r.count + 1, mine: !r.mine }
            : r
        ).filter(r => r.count > 0) };
      }
      return { ...m, reactions: [...(m.reactions || []), { emoji, count: 1, mine: true }] };
    }));
  };

  /* ── Render ── */
  const renderMessage = (msg) => {
    if (msg.type === "system") return <SystemMsg key={msg.id} text={msg.text} />;

    return (
      <React.Fragment key={msg.id}>
        {msg.newMessages && <UnreadSep count={2} />}
        {msg.pinned && <PinBanner />}
        <div className={`cma-msg-row ${msg.mention ? "mention" : ""} ${msg.consecutive ? "consecutive" : ""} ${msg.pinned ? "pinned-highlight" : ""}`}>
          {msg.consecutive ? (
            <>
              <div className="cma-msg-avatar-spacer" />
              <div className="cma-msg-time-hover">
                {msg.time}
                {msg.status && <MessageStatus status={msg.status} />}
              </div>
            </>
          ) : (
            <div className="cma-msg-avatar" style={{ background: msg.color }}>{msg.initials}</div>
          )}
          <div className="cma-msg-content">
            {!msg.consecutive && (
              <div className="cma-msg-header">
                <span className="cma-msg-sender">{msg.sender}</span>
                <span className="cma-msg-timestamp">{msg.time}</span>
                {msg.status && <MessageStatus status={msg.status} />}
              </div>
            )}
            {msg.text && <MessageText text={msg.text} edited={msg.edited} />}
            {msg.attachment && <Attachment att={msg.attachment} />}
            {msg.reactions?.length > 0 && (
              <Reactions
                reactions={msg.reactions}
                onReact={(emoji) => toggleReaction(msg.id, emoji)}
                onAddReact={() => {}}
              />
            )}
            {msg.threadCount && (
              <ThreadPreview
                count={msg.threadCount}
                time={msg.threadTime}
                avatars={msg.threadAvatars || []}
              />
            )}
          </div>
          <ActionBar
            onReply={() => setReplyTo({ sender: msg.sender, text: msg.text })}
            onReact={(emoji) => typeof emoji === "string" ? toggleReaction(msg.id, emoji) : null}
            onPin={() => handlePinMessage(msg.id)}
            onMore={() => {}}
            quickEmojis={QUICK_EMOJIS}
          />
        </div>
      </React.Fragment>
    );
  };

  const renderFeed = () => {
    const today  = todayLabel();
    const groups = {};
    messages.forEach(msg => {
      const date = msg.date || today;
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });

    return Object.entries(groups).map(([date, msgs]) => (
      <React.Fragment key={date}>
        <DateSep label={date} />
        {msgs.map(msg => renderMessage(msg))}
      </React.Fragment>
    ));
  };

  const isReadOnly = meta.readOnly;
  const canSend    = (inputText.trim().length > 0 || !!fileAttached) && !isReadOnly;

  return (
    <div className="cma-wrap">
      <div className="cma-feed" ref={feedRef} onScroll={handleScroll}>
        <ChannelBanner meta={meta} activeChat={activeChat} />
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--slack-text-muted)", padding: "32px", fontSize: 13 }}>
            No messages yet. Be the first to say something!
          </div>
        ) : renderFeed()}
      </div>

      {showScrollFab && (
        <button className="cma-scroll-fab" onClick={() => scrollToBottom()}>
          <ChevronDown size={18} />
        </button>
      )}

      {emojiOpen && (
        <EmojiPicker
          onSelect={(e) => setInputText(prev => prev + e)}
          onClose={() => setEmojiOpen(false)}
        />
      )}

      {isReadOnly ? (
        <div className="cma-readonly-bar">
          <Lock size={15} />
          {`Only admins can post in #${meta.name || activeChat}`}
        </div>
      ) : (
        <div className="cma-input-wrap">
          <TypingIndicator users={typingUsers} />
          <div className="cma-input-box">
            {replyTo && (
              <div className="cma-reply-context">
                <Reply size={13} />
                <span>Replying to <strong>{replyTo.sender}</strong></span>
                <span className="cma-reply-quote">"{replyTo.text}"</span>
                <button className="cma-reply-close" onClick={() => setReplyTo(null)}>
                  <X size={13} />
                </button>
              </div>
            )}
            {fileAttached && (
              <div className="cma-file-chip">
                <span style={{ fontSize: 16 }}>📄</span>
                <span className="cma-file-chip-name">{fileAttached}</span>
                <button className="cma-file-chip-remove" onClick={() => setFile(null)}>
                  <X size={13} />
                </button>
              </div>
            )}
            <div className="cma-input-top">
              <Tooltip title="Attach file" placement="top">
                <button className="cma-input-add" onClick={() => fileRef.current?.click()}>
                  <Plus size={18} />
                </button>
              </Tooltip>
              <input ref={fileRef} type="file" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) setFile(e.target.files[0].name); }} />
              <textarea
                ref={inputRef}
                className="cma-input-field"
                placeholder={
                  meta.type === "dm"    ? `Message ${meta.name}` :
                  meta.type === "group" ? `Message ${meta.name}` :
                  `Message #${meta.name || activeChat}`
                }
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="cma-input-right">
                <Tooltip title="Emoji" placement="top">
                  <button className="cma-input-icon" onClick={() => setEmojiOpen(prev => !prev)}>
                    <Smile size={18} />
                  </button>
                </Tooltip>
                <Tooltip title="Mention someone" placement="top">
                  <button className="cma-input-icon"
                    onClick={() => { setInputText(prev => prev + "@"); inputRef.current?.focus(); }}>
                    <AtSign size={18} />
                  </button>
                </Tooltip>
                <Tooltip title="Attach file" placement="top">
                  <button className="cma-input-icon" onClick={() => fileRef.current?.click()}>
                    <Paperclip size={18} />
                  </button>
                </Tooltip>
                <Tooltip title={canSend ? "Send message" : "Type a message to send"} placement="top">
                  <button className={`cma-input-send ${canSend ? "active" : ""}`}
                    onClick={sendMessage} disabled={!canSend}>
                    <Send size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>
            <Toolbar />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageArea;
