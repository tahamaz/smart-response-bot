import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./Chatbot.css";

type Lang = "fr" | "en" | "ar";
interface Message {
  text: string;
  isUser: boolean;
  time: string;
}

const interfaceMessages = {
  fr: {
    header: "Département d'Informatique - Université Batna 2",
    placeholder: "Posez votre question...",
    suggestions: "Questions fréquentes",
    welcome:
      "👋 Bonjour ! Je suis l'assistant virtuel du Département d'Informatique. Je parle arabe, anglais et français. Comment puis-je vous aider ?",
  },
  en: {
    header: "Computer Science Department - Batna 2 University",
    placeholder: "Ask your question...",
    suggestions: "Frequent questions",
    welcome:
      "👋 Hello! I am the virtual assistant of the Computer Science Department. I speak Arabic, English, and French. How can I help you?",
  },
  ar: {
    header: "قسم الإعلام الآلي - جامعة باتنة 2",
    placeholder: "اكتب سؤالك...",
    suggestions: "أسئلة شائعة",
    welcome:
      "👋 مرحبًا! أنا المساعد الافتراضي لقسم الإعلام الآلي. أتحدث العربية والإنجليزية والفرنسية. كيف يمكنني مساعدتك؟",
  },
};

const suggestionsParLangue = {
  fr: [
    { icon: "📞", text: "Contact", keyword: "contact" },
    { icon: "🎓", text: "Master", keyword: "master" },
    { icon: "📚", text: "Licence 3", keyword: "licence" },
    { icon: "🔒", text: "Master SI", keyword: "master si" },
    { icon: "🤖", text: "Master IAM", keyword: "master iam" },
    { icon: "🌐", text: "Master RSD", keyword: "master rsd" },
    { icon: "🔐", text: "Master ISIDS", keyword: "master isids" },
    { icon: "💻", text: "Master DTI", keyword: "master dti" },
    { icon: "⚙️", text: "Cycle Ingénieur", keyword: "ingenieur" },
    { icon: "📅", text: "Emploi du temps", keyword: "emploi" },
    { icon: "📝", text: "Sujets de mémoire", keyword: "sujets" },
  ],
  en: [
    { icon: "📞", text: "Contact", keyword: "contact" },
    { icon: "🎓", text: "Master", keyword: "master" },
    { icon: "📚", text: "Bachelor 3", keyword: "bachelor" },
    { icon: "🔒", text: "Master CS", keyword: "master cs" },
    { icon: "🤖", text: "Master AIM", keyword: "master aim" },
    { icon: "🌐", text: "Master DSN", keyword: "master dsn" },
    { icon: "🔐", text: "Master DISES", keyword: "master dises" },
    { icon: "💻", text: "Master DIT", keyword: "master dit" },
    { icon: "⚙️", text: "Engineering", keyword: "engineering" },
    { icon: "📅", text: "Schedule", keyword: "schedule" },
    { icon: "📝", text: "Thesis", keyword: "thesis" },
  ],
  ar: [
    { icon: "📞", text: "اتصال", keyword: "اتصال" },
    { icon: "🎓", text: "ماستر", keyword: "ماستر" },
    { icon: "📚", text: "ليسانس 3", keyword: "ليسانس" },
    { icon: "🔒", text: "ماستر أمن", keyword: "ماستر أمن" },
    { icon: "🤖", text: "ماستر ذكاء", keyword: "ماستر ذكاء اصطناعي" },
    { icon: "🌐", text: "ماستر شبكات", keyword: "ماستر شبكات" },
    { icon: "🔐", text: "ماستر نظم", keyword: "ماستر نظم موزعة" },
    { icon: "💻", text: "ماستر تحول", keyword: "ماستر تحول رقمي" },
    { icon: "⚙️", text: "مهندس", keyword: "طور المهندس" },
    { icon: "📅", text: "توقيت", keyword: "التوقيت" },
    { icon: "📝", text: "مذكرة", keyword: "مواضيع" },
  ],
};

export default function Chatbot() {
  const [lang, setLang] = useState<Lang>("en");
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
        text: interfaceMessages[lang].welcome,
        isUser: false,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      },
    ]);
  }, [lang]);

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
      setMessages((prev) => [...prev, { text: text.trim(), isUser: true, time }]);
      setInput("");
      setIsTyping(true);

      try {
        const { data, error } = await supabase.functions.invoke("chat", {
          body: { question: text.trim() },
        });

        if (error) throw error;

        // Auto-update UI language based on detected language
        if (data.langue && data.langue !== lang) {
          setLang(data.langue as Lang);
        }

        const botTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, { text: data.reponse, isUser: false, time: botTime }]);
        }, 600);
      } catch {
        setIsTyping(false);
        const errMsgs = {
          fr: "❌ Erreur de connexion au serveur.",
          en: "❌ Server connection error.",
          ar: "❌ خطأ في الاتصال بالخادم.",
        };
        setMessages((prev) => [...prev, { text: errMsgs[lang], isUser: false, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }) }]);
      }
    },
    [lang, isTyping]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage(input);
  };

  const isRtl = lang === "ar";

  return (
    <div className={`chatbot-page ${isDark ? "dark-mode" : ""} ${isRtl ? "rtl" : ""}`}>
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
                  <i className="fas fa-map-pin"></i> {interfaceMessages[lang].header}
                </p>
              </div>
            </div>
            <div className="header-controls">
              <div className="language-selector">
                <i className="fas fa-globe"></i>
                <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
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
                <div className="message-bubble" style={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
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

        <div className="suggestions-section">
          <div className="suggestions-title">
            <i className="fas fa-bolt"></i>{" "}
            <span>{interfaceMessages[lang].suggestions}</span>
          </div>
          <div className="suggestions-grid">
            {suggestionsParLangue[lang].map((s, i) => (
              <div
                key={i}
                className="suggestion-item"
                onClick={() => {
                  setInput(s.keyword);
                  sendMessage(s.keyword);
                }}
              >
                {s.icon} {s.text}
              </div>
            ))}
          </div>
        </div>

        <div className="chat-input-section">
          <div className="input-container">
            <input
              type="text"
              placeholder={interfaceMessages[lang].placeholder}
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
