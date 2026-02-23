import { useState, useRef, useEffect } from "react";
import "../index.css";

// ── SVG Icons ─────────────────────────────────────────
const BoltIcon = ({ size = 16, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const MicIcon = ({ color = "#3b82f6" }) => (
  <svg width="18" height="20" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="1" width="8" height="13" rx="4" fill={color}/>
    <path d="M1 10C1 14.418 4.582 18 9 18C13.418 18 17 14.418 17 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="9" y1="18" x2="9" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="6" y1="22" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SendIcon = ({ color = "white" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="#64748b" strokeWidth="2"/>
  </svg>
);

const BookmarkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
      stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2"/>
    <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
      stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="17" r="1" fill="#64748b"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
  </svg>
);

// ── Data ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Study planner" },
  { label: "Compare EVs" },
  { label: "Range tips" },
  { label: "Charging guide" },
  { label: "Fun EV facts" },
];

const RECENT_CHATS = [
  { title: "Tesla Model 3 vs Model Y",    time: "2h ago" },
  { title: "Battery maintenance tips",    time: "Yesterday" },
  { title: "Road trip planning",          time: "2d ago" },
  { title: "Home charging setup",         time: "1w ago" },
  { title: "EV tax credits 2025",         time: "1w ago" },
  { title: "Best budget EVs under 40k",   time: "2w ago" },
  { title: "Maintenance cost comparison", time: "3w ago" },
];

// ── Sub-components ────────────────────────────────────
const BotAvatar = () => (
  <div className="bot-avatar">
    <BoltIcon size={16} color="white" />
  </div>
);

const UserAvatar = () => (
  <div className="user-avatar">
    <UserIcon />
  </div>
);

const TypingIndicator = () => (
  <div className="typing-bubble">
    <div className="typing-dot" />
    <div className="typing-dot" />
    <div className="typing-dot" />
  </div>
);

// ── Sidebar ───────────────────────────────────────────
function Sidebar({ onNewChat, onSelectChat, activeChat }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <BoltIcon size={18} color="white" />
        </div>
        <span className="sidebar-logo-text">EVAssist</span>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <PlusIcon /> New Chat
      </button>

      <div className="sidebar-section-label">Recent Chats</div>
      <div className="sidebar-chats">
        {RECENT_CHATS.map((chat, i) => (
          <div
            key={i}
            className={`chat-item ${activeChat === i ? "active" : ""}`}
            onClick={() => onSelectChat(i)}
          >
            <div className="chat-item-icon">
              <ChatIcon />
            </div>
            <div className="chat-item-info">
              <div className="chat-item-title">{chat.title}</div>
              <div className="chat-item-time">{chat.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-label">General</div>
        <button className="quick-link"><SettingsIcon /> Settings</button>
        <button className="quick-link"><BookmarkIcon /> Saved chats</button>
        <button className="quick-link"><HelpIcon /> Help & FAQ</button>
      </div>
    </aside>
  );
}

// ── Main App ──────────────────────────────────────────
export default function EVAssist() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm EVAssist\nHere to help you with everything electric vehicles — comparisons, charging, range, and more!",
      time: "Now",
    },
  ]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeChat, setActiveChat]   = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([{
      sender: "bot",
      text: "Starting a new conversation. What would you like to know about EVs?",
      time: getTime(),
    }]);
  };

  const handleSelectChat = (index) => {
    setActiveChat(index);
    setMessages([{
      sender: "bot",
      text: `Resuming: "${RECENT_CHATS[index].title}"\nHow can I help you continue?`,
      time: getTime(),
    }]);
  };

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: msg, time: getTime() }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://evassist-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: msg }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.answer, time: getTime() }]);
    } catch {
      setMessages((prev) => [...prev, {
        sender: "bot",
        text: "Couldn't reach the server. Please try again.",
        time: getTime(),
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="ev-root">
      <Sidebar
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        activeChat={activeChat}
      />

      <div className="main">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-avatar">
            <BoltIcon size={20} color="white" />
          </div>
          <div>
            <div className="chat-header-name">EVAssist</div>
            <div className="chat-header-status">
              <span className="status-dot" />
              Online
            </div>
          </div>
          <button className="chat-header-more">···</button>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.sender}`}>
              {msg.sender === "bot" ? <BotAvatar /> : <UserAvatar />}
              <div className="msg-content">
                <div className={`msg-bubble ${msg.sender}`}>{msg.text}</div>
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row bot">
              <BotAvatar />
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick chips */}
        <div className="chips-row">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} className="chip" onClick={() => sendMessage(a.label)}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="input-area">
          <button
            className={`mic-btn ${isRecording ? "recording" : "idle"}`}
            onClick={() => setIsRecording((r) => !r)}
          >
            <MicIcon color={isRecording ? "white" : "#3b82f6"} />
            {isRecording && <span className="pulse-ring" />}
          </button>

          <input
            className="text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about EVs..."
          />

          <button
            className={`send-btn ${input.trim() ? "active" : "inactive"}`}
            onClick={() => sendMessage()}
            disabled={!input.trim()}
          >
            <SendIcon color={input.trim() ? "white" : "#94a3b8"} />
          </button>
        </div>
      </div>
    </div>
  );
}
