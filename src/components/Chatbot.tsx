import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./Chatbot.css";

interface Message {
  text: string;
  isUser: boolean;
  time: string;
  isRtl?: boolean;
}

const welcomeMessage =
  "👋 Hello! I am the virtual assistant of the Computer Science Department - University of Batna 2. How can I help you?";

const isArabic = (text: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);

// Render inline formatting: **bold**, links, and raw URLs
const renderInline = (text: string, keyPrefix: string = ""): ReactNode[] => {
  const parts: ReactNode[] = [];
  const inlineRegex = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s)<]+)/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`${keyPrefix}t${i++}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[1]) {
      parts.push(<strong key={`${keyPrefix}b${i++}`}>{match[1]}</strong>);
    } else {
      const label = match[2] || match[4];
      const url = match[3] || match[4];
      parts.push(
        <a key={`${keyPrefix}a${i++}`} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8", textDecoration: "underline", wordBreak: "break-all" }}>
          {label}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`${keyPrefix}t${i++}`}>{text.slice(lastIndex)}</span>);
  }
  return parts;
};

const cleanAndRender = (text: string): ReactNode => {
  // Remove single * (italic markers), headings, backticks
  let cleaned = text
    .replace(/(?<!\*)\*(?!\*)/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "")
    .replace(/^\s*\n/gm, "\n");

  // Split into lines and group into paragraphs and list items
  const lines = cleaned.split("\n");
  const elements: ReactNode[] = [];
  let currentList: ReactNode[] = [];
  let idx = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul${idx++}`} style={{ margin: "6px 0", paddingLeft: "20px", listStyle: "none" }}>
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, li) => {
    const listMatch = line.match(/^\s*[-•●]\s+(.*)/);
    const numberedMatch = line.match(/^\s*\d+[.)]\s+(.*)/);

    if (listMatch || numberedMatch) {
      const content = listMatch ? listMatch[1] : numberedMatch![1];
      currentList.push(
        <li key={`li${li}`} style={{ padding: "3px 0", position: "relative", paddingLeft: "12px" }}>
          <span style={{ position: "absolute", left: 0, color: "#1a73e8", fontWeight: 600 }}>•</span>
          {renderInline(content, `li${li}`)}
        </li>
      );
    } else {
      flushList();
      if (line.trim()) {
        elements.push(<span key={`p${li}`}>{renderInline(line, `p${li}`)}{"\n"}</span>);
      } else {
        elements.push(<span key={`br${li}`}>{"\n"}</span>);
      }
    }
  });
  flushList();

  return <>{elements}</>;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedDark = localStorage.getItem("darkMode") === "true";
    setIsDark(savedDark);
  }, []);

  useEffect(() => {
    setMessages([
      {
        text: welcomeMessage,
        isUser: false,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      },
    ]);
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleDark = () => {
    setIsDark((d) => {
      localStorage.setItem("darkMode", String(!d));
      return !d;
    });
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
      setMessages((prev) => [...prev, { text: text.trim(), isUser: true, time, isRtl: isArabic(text) }]);
      setInput("");
      setIsTyping(true);

      try {
        const { data, error } = await supabase.functions.invoke("chat", {
          body: { question: text.trim() },
        });

        if (error) throw error;

        const botTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
        setTimeout(() => {
          setIsTyping(false);
          const responseText = data.reponse;
          setMessages((prev) => [...prev, { text: responseText, isUser: false, time: botTime, isRtl: isArabic(responseText) }]);
        }, 600);
      } catch {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            text: "❌ Server connection error.",
            isUser: false,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }),
          },
        ]);
      }
    },
    [isTyping]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage(input);
  };

  return (
    <div className={`chatbot-page ${isDark ? "dark-mode" : ""}`}>
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-main">
            <div className="brand">
              <div className="logo-wrapper">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="brand-text">
                <h1>Assistant Info Batna 2</h1>
                <p>
                  <i className="fas fa-map-pin"></i> Computer Science Department - Batna 2 University
                </p>
              </div>
            </div>
            <div className="header-controls">
              <div className="theme-toggle" onClick={toggleDark}>
                <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="chat-messages" ref={chatBoxRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.isUser ? "user" : "bot"}`}>
              {!msg.isUser && (
                <div className="message-avatar">
                  <i className="fas fa-robot"></i>
                </div>
              )}
              <div className="message-wrapper">
                <div className="message-bubble" style={{ whiteSpace: "pre-wrap", direction: msg.isRtl ? "rtl" : "ltr", textAlign: msg.isRtl ? "right" : "left" }}>
                  {cleanAndRender(msg.text)}
                </div>
                <div className="message-time">
                  <i className="far fa-clock"></i> {msg.time}
                </div>
              </div>
              {msg.isUser && (
                <div className="message-avatar">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="message bot">
              <div className="message-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-section">
          <div className="input-container">
            <input
              type="text"
              placeholder="Ask your question in any language... / Posez votre question... / ...اكتب سؤالك"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              autoComplete="off"
            />
            <button className="send-button" onClick={() => sendMessage(input)}>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
