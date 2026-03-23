import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./Chatbot.css";

interface Message {
  text: string;
  isUser: boolean;
  time: string;
}

const getTime = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

// Format bot text: bold, lists, links
function formatText(text: string) {
  // Clean markdown symbols we don't need
  let clean = text
    .replace(/(?<!\*)\*(?!\*)/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "");

  // Convert **bold** to <strong>
  clean = clean.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Convert URLs to links
  clean = clean.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  clean = clean.replace(
    /(^|[^"'])(https?:\/\/[^\s)<]+)/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'
  );

  // Convert list items (- or • or 1.) to bullet points
  clean = clean.replace(/^\s*[-•●]\s+(.+)$/gm, '<li>$1</li>');
  clean = clean.replace(/^\s*\d+[.)]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  clean = clean.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="bot-list">$1</ul>');

  return clean;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "👋 Hello! Welcome to the Computer Science Department - University of Batna 2. How can I help you?", isUser: false, time: getTime() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("darkMode") === "true");
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages, isTyping]);

  const toggleDark = () => {
    setIsDark((d) => {
      localStorage.setItem("darkMode", String(!d));
      return !d;
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { text, isUser: true, time: getTime() }]);
    setInput("");
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { question: text },
      });
      if (error) throw error;

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { text: data.reponse, isUser: false, time: getTime() }]);
      }, 600);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: "❌ Server connection error.", isUser: false, time: getTime() }]);
    }
  };

  return (
    <div className={`chatbot-page ${isDark ? "dark-mode" : ""}`}>
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-main">
            <div className="brand">
              <div className="logo-wrapper">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="brand-text">
                <h1>Assistant Info Batna 2</h1>
                <p><i className="fas fa-map-pin"></i> Computer Science Department - Batna 2 University</p>
              </div>
            </div>
            <div className="theme-toggle" onClick={toggleDark}>
              <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`}></i>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" ref={chatBoxRef}>
          {messages.map((msg, i) => {
            const rtl = isArabic(msg.text);
            return (
              <div key={i} className={`message ${msg.isUser ? "user" : "bot"}`}>
                {!msg.isUser && <div className="message-avatar"><i className="fas fa-robot"></i></div>}
                <div className="message-wrapper">
                  <div
                    className="message-bubble"
                    style={{ direction: rtl ? "rtl" : "ltr", textAlign: rtl ? "right" : "left" }}
                    dangerouslySetInnerHTML={{ __html: msg.isUser ? msg.text : formatText(msg.text) }}
                  />
                  <div className="message-time"><i className="far fa-clock"></i> {msg.time}</div>
                </div>
                {msg.isUser && <div className="message-avatar"><i className="fas fa-user"></i></div>}
              </div>
            );
          })}
          {isTyping && (
            <div className="message bot">
              <div className="message-avatar"><i className="fas fa-robot"></i></div>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="chat-input-section">
          <div className="input-container">
            <input
              type="text"
              placeholder="Ask your question... / Posez votre question... / ...اكتب سؤالك"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="send-button" onClick={sendMessage}>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
