import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Lang = "fr" | "en" | "ar";

function detectLanguage(text: string): Lang {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const frenchIndicators = /[àâäéèêëïîôùûüÿçœæ]|(\b(je|tu|il|nous|vous|ils|les|des|une|est|sont|dans|pour|avec|que|qui|sur|pas|plus|cette|tout)\b)/i;
  
  if (arabicRegex.test(text)) return "ar";
  if (frenchIndicators.test(text)) return "fr";
  return "en";
}

const reponses: Record<string, Record<string, string>> = {
  bonjour: {
    fr: "👋 Bonjour ! Bienvenue au Département d'Informatique - Université Batna 2. Comment puis-je vous aider ?",
    en: "👋 Hello! Welcome to the Computer Science Department - University of Batna 2. How can I help you?",
    ar: "👋 مرحبًا! أهلاً بكم في قسم الإعلام الآلي - جامعة باتنة 2. كيف يمكنني مساعدتكم؟",
  },
  salut: {
    fr: "👋 Salut ! Bienvenue au Département Informatique.",
    en: "👋 Hi! Welcome to the Computer Science Department.",
    ar: "👋 مرحبًا! أهلاً بك في قسم الإعلام الآلي.",
  },
  merci: {
    fr: "🙏 Avec plaisir ! N'hésitez pas à revenir.",
    en: "🙏 You're welcome! Feel free to come back.",
    ar: "🙏 العفو! لا تتردد في العودة.",
  },
  "au revoir": {
    fr: "👋 Au revoir ! Bonne continuation !",
    en: "👋 Goodbye! Good luck!",
    ar: "👋 وداعًا! بالتوفيق!",
  },
  contact: {
    fr: "📞 **Contacts officiels du département**\n\n📍 **Adresse** : 53, Route de Constantine, Fésdis, Batna 05078, Algérie\n📞 **Téléphone** : +213 33 23 02 66\n📠 **Fax** : +213 33 23 02 22\n📧 **Email** : chef-dept.inf@univ-batna2.dz\n\n📱 **Facebook** : https://facebook.com/chefdepartementinformatiquebatna\n\n🕐 **Horaires** : Dimanche - Jeudi, 8h - 16h",
    en: "📞 **Official Department Contacts**\n\n📍 **Address**: 53, Route de Constantine, Fésdis, Batna 05078, Algeria\n📞 **Phone**: +213 33 23 02 66\n📠 **Fax**: +213 33 23 02 22\n📧 **Email**: chef-dept.inf@univ-batna2.dz\n\n📱 **Facebook**: https://facebook.com/chefdepartementinformatiquebatna\n\n🕐 **Hours**: Sunday - Thursday, 8 AM - 4 PM",
    ar: "📞 **معلومات الاتصال الرسمية للقسم**\n\n📍 **العنوان**: 53، طريق قسنطينة، فسديس، باتنة 05078، الجزائر\n📞 **الهاتف**: +213 33 23 02 66\n📠 **الفاكس**: +213 33 23 02 22\n📧 **البريد الإلكتروني**: chef-dept.inf@univ-batna2.dz\n\n📱 **فيسبوك**: https://facebook.com/chefdepartementinformatiquebatna\n\n🕐 **ساعات العمل**: الأحد - الخميس، 8 صباحًا - 4 مساءً",
  },
  licence: {
    fr: "🎓 **Licence 3 - Deux parcours**\n\n📌 **SI (Systèmes Informatiques)**\n→ Réseaux, systèmes d'exploitation, administration\nModules : Système d'exploitation 2, Compilation, Génie Logiciel, IHM, Programmation linéaire, Probabilités\n\n📌 **ISIL (Ingénierie des Systèmes d'Information et du Logiciel)**\n→ Développement, bases de données, génie logiciel\nModules : Système d'information distribué, Système d'aide à la décision, Génie Logiciel, IHM, Administration des SI, Programmation Web avancée",
    en: "🎓 **Bachelor Year 3 - Two Tracks**\n\n📌 **CS (Computer Systems)**\n→ Networks, operating systems, administration\nModules: Operating Systems 2, Compilation, Software Engineering, HCI, Linear Programming, Probability\n\n📌 **ISSE (Information Systems and Software Engineering)**\n→ Development, databases, software engineering\nModules: Distributed Information Systems, Decision Support Systems, Software Engineering, HCI, IS Administration, Advanced Web Programming",
    ar: "🎓 **السنة الثالثة ليسانس - مساران**\n\n📌 **نظم الحاسوب**\n→ الشبكات، أنظمة التشغيل، الإدارة\nالوحدات: أنظمة التشغيل 2، الترجمة، هندسة البرمجيات، واجهات الإنسان والآلة، البرمجة الخطية، الاحتمالات\n\n📌 **هندسة نظم المعلومات والبرمجيات**\n→ التطوير، قواعد البيانات، هندسة البرمجيات\nالوحدات: نظم المعلومات الموزعة، نظم دعم القرار، هندسة البرمجيات، واجهات الإنسان والآلة، إدارة نظم المعلومات، برمجة الويب المتقدمة",
  },
  master: {
    fr: "🎓 **Master - 5 spécialités**\n\n1️⃣ **SI** (Sécurité Informatique)\n2️⃣ **IAM** (Intelligence Artificielle et Multimédia)\n3️⃣ **RSD** (Réseaux et Systèmes Distribués)\n4️⃣ **ISIDS** (Ingénierie des Systèmes d'Information Distribués et Sécurité)\n5️⃣ **DTI** (Transformation Digitale et Innovation) → **À distance**\n\nTapez le nom de la spécialité pour plus de détails !",
    en: "🎓 **Master - 5 Specialties**\n\n1️⃣ **CS** (Computer Security)\n2️⃣ **AIM** (Artificial Intelligence and Multimedia)\n3️⃣ **DSN** (Distributed Systems and Networks)\n4️⃣ **DISES** (Distributed Information Systems Engineering and Security)\n5️⃣ **DIT** (Digital Transformation and Innovation) → **Online**\n\nType the specialty name for more details!",
    ar: "🎓 **ماستر - 5 تخصصات**\n\n1️⃣ **أمن الحاسوب**\n2️⃣ **الذكاء الاصطناعي والوسائط المتعددة**\n3️⃣ **الشبكات والأنظمة الموزعة**\n4️⃣ **هندسة نظم المعلومات الموزعة والأمن**\n5️⃣ **التحول الرقمي والابتكار** → **عن بعد**\n\nاكتب اسم التخصص للمزيد من التفاصيل!",
  },
  si_master: {
    fr: "🔒 **Master SI - Sécurité Informatique**\n\n📚 **Semestre 1 (S1)** :\n• Advanced Database = Dr. YASMINE MEDJADBA\n• La Complexité Algorithmique\n• Outils Mathématiques pour la Cryptographie\n• Ethical Hacking and Systems Defense = MEBARKI YOUCEF\n• Delivering Secure Software through Continuous Delivery\n• AI, Informations Publiques, Cybercriminalité\n\n📚 **Semestre 2 (S2)** :\n• Cryptographie\n• Cybercriminalité & Réseaux = DEKHINET Abdelhamid\n• Criminalistique\n• BD Forensique, Multimédia & Sécurité = DJEBAILI KARIMA\n• Gestion de Projets = OUSSAMA BOULDJEDRI\n• Gouvernance & Digital\n• Internet of Things\n\n👨‍💼 **Débouchés** : Expert en cybersécurité, Analyste SOC, Pentester",
    en: "🔒 **Master CS - Computer Security**\n\n📚 **Semester 1 (S1)**:\n• Advanced Database = Dr. YASMINE MEDJADBA\n• Algorithmic Complexity\n• Mathematical Tools for Cryptography\n• Ethical Hacking and Systems Defense = MEBARKI YOUCEF\n• Delivering Secure Software through Continuous Delivery\n• AI, Public Information, Cybercrime\n\n📚 **Semester 2 (S2)**:\n• Cryptography\n• Cybercrime & Networks = DEKHINET Abdelhamid\n• Forensics\n• Forensic DB, Multimedia & Security = DJEBAILI KARIMA\n• Project Management = OUSSAMA BOULDJEDRI\n• Governance & Digital\n• Internet of Things\n\n👨‍💼 **Careers**: Cybersecurity Expert, SOC Analyst, Pentester",
    ar: "🔒 **ماستر أمن الحاسوب**\n\n📚 **السداسي الأول (S1)**:\n• قواعد البيانات المتقدمة = د. ياسمين مجدبة\n• التعقيد الخوارزمي\n• أدوات رياضية للتشفير\n• القرصنة الأخلاقية والدفاع عن الأنظمة = مباركي يوسف\n• تقديم برمجيات آمنة عبر التسليم المستمر\n• الذكاء الاصطناعي، المعلومات العامة، الجرائم الإلكترونية\n\n📚 **السداسي الثاني (S2)**:\n• التشفير\n• الجرائم الإلكترونية والشبكات = دخينات عبد الحميد\n• الطب الشرعي الرقمي\n• قواعد البيانات الجنائية والوسائط المتعددة والأمن = جبايلي كريمة\n• إدارة المشاريع = أسامة بولجدري\n• الحوكمة والرقمنة\n• إنترنت الأشياء\n\n👨‍💼 **آفاق العمل**: خبير أمن سيبراني، محلل SOC، مختبر اختراق",
  },
  iam: {
    fr: "🤖 **Master IAM - Intelligence Artificielle et Multimédia**\n\n📚 **Modules** :\n• Conception d'application multimédia\n• Recherche d'information multimédia\n• Programmation GPU\n• Reconnaissance de formes\n• Ontologies\n\n👨‍💼 **Débouchés** : Data Scientist, Ingénieur IA, NLP Developer",
    en: "🤖 **Master AIM - Artificial Intelligence and Multimedia**\n\n📚 **Modules**:\n• Multimedia Application Design\n• Multimedia Information Retrieval\n• GPU Programming\n• Pattern Recognition\n• Ontologies\n\n👨‍💼 **Careers**: Data Scientist, AI Engineer, NLP Developer",
    ar: "🤖 **ماستر الذكاء الاصطناعي والوسائط المتعددة**\n\n📚 **الوحدات**:\n• تصميم تطبيقات الوسائط المتعددة\n• استرجاع المعلومات المتعددة الوسائط\n• برمجة GPU\n• التعرف على الأنماط\n• الأنطولوجيات\n\n👨‍💼 **آفاق العمل**: عالم بيانات، مهندس ذكاء اصطناعي، مطور NLP",
  },
  rsd: {
    fr: "🌐 **Master RSD - Réseaux et Systèmes Distribués**\n\n📚 **Modules** :\n• QoS dans les réseaux\n• Réseaux sans fils\n• Algorithmes distribués\n• Cloud et virtualisation\n• Mobilité dans les réseaux\n\n👨‍💼 **Débouchés** : Administrateur réseau, Architecte IoT",
    en: "🌐 **Master DSN - Distributed Systems and Networks**\n\n📚 **Modules**:\n• Network QoS\n• Wireless Networks\n• Distributed Algorithms\n• Cloud and Virtualization\n• Network Mobility\n\n👨‍💼 **Careers**: Network Administrator, IoT Architect",
    ar: "🌐 **ماستر الشبكات والأنظمة الموزعة**\n\n📚 **الوحدات**:\n• جودة الخدمة في الشبكات\n• الشبكات اللاسلكية\n• الخوارزميات الموزعة\n• الحوسبة السحابية والافتراضية\n• التنقل في الشبكات\n\n👨‍💼 **آفاق العمل**: مسؤول شبكات، مهندس إنترنت الأشياء",
  },
  isids: {
    fr: "🔐 **Master ISIDS - Ingénierie des SI Distribués et Sécurité**\n\n📚 **Modules** :\n• Blockchain\n• Cybersécurité 2\n• Big Data\n• Business Intelligence\n• Deep Learning\n\n👨‍💼 **Débouchés** : Architecte SI, Expert Blockchain",
    en: "🔐 **Master DISES - Distributed IS Engineering and Security**\n\n📚 **Modules**:\n• Blockchain\n• Cybersecurity 2\n• Big Data\n• Business Intelligence\n• Deep Learning\n\n👨‍💼 **Careers**: IS Architect, Blockchain Expert",
    ar: "🔐 **ماستر هندسة نظم المعلومات الموزعة والأمن**\n\n📚 **الوحدات**:\n• سلسلة الكتل (Blockchain)\n• الأمن السيبراني 2\n• البيانات الضخمة\n• ذكاء الأعمال\n• التعلم العميق\n\n👨‍💼 **آفاق العمل**: مهندس نظم معلومات، خبير بلوكتشين",
  },
  dti: {
    fr: "💻 **Master DTI - Transformation Digitale et Innovation**\n\n🎓 **Formation 100% à distance**\n\n📚 **Modules** :\n• Digital Business Models\n• Digital User Experience\n• Programmation Orientée Objet\n• Bases de données avancées\n• Innovation Management\n\n👨‍💼 **Débouchés** : Chef de projet digital, Consultant transformation numérique",
    en: "💻 **Master DIT - Digital Transformation and Innovation**\n\n🎓 **100% Online Training**\n\n📚 **Modules**:\n• Digital Business Models\n• Digital User Experience\n• Object-Oriented Programming\n• Advanced Databases\n• Innovation Management\n\n👨‍💼 **Careers**: Digital Project Manager, Digital Transformation Consultant",
    ar: "💻 **ماستر التحول الرقمي والابتكار**\n\n🎓 **تكوين 100% عن بعد**\n\n📚 **الوحدات**:\n• نماذج الأعمال الرقمية\n• تجربة المستخدم الرقمية\n• البرمجة كائنية التوجه\n• قواعد البيانات المتقدمة\n• إدارة الابتكار\n\n👨‍💼 **آفاق العمل**: مدير مشروع رقمي، مستشار تحول رقمي",
  },
  emploi: {
    fr: "📅 **Emplois du temps**\n\n📌 Affichage au département (1er étage)\n📌 Semestre 2 : début le **01/02/2026**",
    en: "📅 **Class Schedules**\n\n📌 Posted at the department (1st floor)\n📌 Semester 2: starts on **02/01/2026**",
    ar: "📅 **التوقيت الدراسي**\n\n📌 معلق في القسم (الطابق الأول)\n📌 السداسي الثاني: يبدأ في **01/02/2026**",
  },
  ingenieur: {
    fr: "⚙️ **Cycle Ingénieur en Informatique**\n\nLe cycle Ingénieur dure **4 ans**, répartis comme suit :\n\n📌 **1ère année TC-ING (Tronc Commun Ingénieur)**\n• Semestre 1 : Math Analysis 1, Algebra 1, Algo & SDD 1, Computer Architecture 1, Operating System 1, Fundamental Electronics, Written Expression\n• Semestre 2 : Analysis 2, Algebra 2, Algorithmics 2, Mathematical Logic, Computer Architecture 2, Proba-Stat, Oral Expression\n\n📌 **2ème année CC-ENGINEER**\n• Semestre 3 : O.O.P 1, Algebra 3, Algo & SDD 3, Math Analysis 3, Proba-Stat 2, Information System, Entrepreneurship\n• Semestre 4 : O.O.P 2, Int inform systems, Int Databases, Language theory, Graph theory, English, Multidisciplinary Project\n\n📌 **3ème année** : Cryptographie, Analyse Numérique\n📌 **4ème année** : Malwares Analysis\n\n📌 **Contact** : pedagogie.scmi@univ-batna2.dz",
    en: "⚙️ **Engineering Cycle in Computer Science**\n\nThe Engineering cycle lasts **4 years**:\n\n📌 **1st year TC-ING (Common Core)**\n• Semester 1: Math Analysis 1, Algebra 1, Algo & SDD 1, Computer Architecture 1, OS 1, Electronics, Written Expression\n• Semester 2: Analysis 2, Algebra 2, Algorithmics 2, Mathematical Logic, Architecture 2, Proba-Stat, Oral Expression\n\n📌 **2nd year CC-ENGINEER**\n• Semester 3: O.O.P 1, Algebra 3, Algo & SDD 3, Analysis 3, Proba-Stat 2, Info System, Entrepreneurship\n• Semester 4: O.O.P 2, Int IS, Int Databases, Language theory, Graph theory, English, Multidisciplinary Project\n\n📌 **3rd year**: Cryptography, Numerical Analysis\n📌 **4th year**: Malware Analysis\n\n📌 **Contact**: pedagogie.scmi@univ-batna2.dz",
    ar: "⚙️ **طور المهندس في الإعلام الآلي**\n\nيمتد طور المهندس على **4 سنوات**:\n\n📌 **السنة الأولى (الجذع المشترك)**\n• السداسي 1: التحليل 1، الجبر 1، الخوارزميات 1، هندسة الحاسوب 1، نظام التشغيل 1، الإلكترونيات، التعبير الكتابي\n• السداسي 2: التحليل 2، الجبر 2، الخوارزميات 2، المنطق الرياضي، هندسة الحاسوب 2، الاحتمالات، التعبير الشفهي\n\n📌 **السنة الثانية**\n• السداسي 3: البرمجة كائنية 1، الجبر 3، الخوارزميات 3، التحليل 3، الاحتمالات 2، نظم المعلومات، المقاولاتية\n• السداسي 4: البرمجة كائنية 2، نظم المعلومات الذكية، قواعد البيانات، نظرية اللغات، نظرية البيان، الإنجليزية، مشروع متعدد\n\n📌 **السنة الثالثة**: التشفير، التحليل العددي\n📌 **السنة الرابعة**: تحليل البرامج الضارة\n\n📌 **الاتصال**: pedagogie.scmi@univ-batna2.dz",
  },
  sujets: {
    fr: "🔬 **Sujets de mémoire 2025-2026**\n\n🤖 **IAM** : Chatbots, Reconnaissance faciale, IA médicale\n🌐 **RSD** : 5G/6G, IoT, Véhicules autonomes\n🔒 **SI/ISIDS** : Cryptographie post-quantique, Sécurité IoT\n📊 **DTI** : Transformation digitale, Cloud computing",
    en: "🔬 **Thesis Topics 2025-2026**\n\n🤖 **AIM**: Chatbots, Face Recognition, Medical AI\n🌐 **DSN**: 5G/6G, IoT, Autonomous Vehicles\n🔒 **CS/DISES**: Post-quantum Cryptography, IoT Security\n📊 **DIT**: Digital Transformation, Cloud Computing",
    ar: "🔬 **مواضيع المذكرات 2025-2026**\n\n🤖 **الذكاء الاصطناعي**: المساعدات الذكية، التعرف على الوجوه\n🌐 **الشبكات**: الجيل الخامس/السادس، إنترنت الأشياء\n🔒 **الأمن/النظم الموزعة**: التشفير ما بعد الكمي، أمن إنترنت الأشياء\n📊 **التحول الرقمي**: التحول الرقمي، الحوسبة السحابية",
  },
  default: {
    fr: "Désolé, je n'ai pas cette information. Contactez le secrétariat au 📞 +213 33 23 02 66",
    en: "Sorry, I don't have this information. Contact the secretariat at 📞 +213 33 23 02 66",
    ar: "عذرًا، لا تتوفر لدي هذه المعلومة. اتصل بالسكرتارية على 📞 +213 33 23 02 66",
  },
};

function matchKeyword(question: string): string | null {
  const q = question.toLowerCase().trim();

  if (
    ["contact", "adresse", "téléphone", "email", "facebook", "phone", "address", "اتصل", "العنوان", "الهاتف", "البريد"].some((m) => q.includes(m))
  )
    return "contact";
  if (["sujet", "mémoire", "thesis", "topic", "مذكرة", "مواضيع", "المذكرات"].some((m) => q.includes(m))) return "sujets";

  if (q.includes("master") || q.includes("ماستر")) {
    if (["isids", "dises", "نظم موزعة", "هندسة نظم"].some((m) => q.includes(m))) return "isids";
    if (["si", "cs", "sécurité", "security", "أمن", "امن"].some((m) => q.includes(m)) && !q.includes("نظم")) return "si_master";
    if (["iam", "aim", "ia", "ai", "intelligence", "ذكاء", "اصطناعي"].some((m) => q.includes(m))) return "iam";
    if (["rsd", "dsn", "réseaux", "networks", "شبكات"].some((m) => q.includes(m))) return "rsd";
    if (["dti", "dit", "digital", "transformation", "تحول", "رقمي"].some((m) => q.includes(m))) return "dti";
    if (["engineering", "ingenieur", "engineer", "مهندس", "طور المهندس"].some((m) => q.includes(m))) return "ingenieur";
    return "master";
  }

  if (["licence", "bachelor", "l3", "ليسانس"].some((m) => q.includes(m))) return "licence";
  if (["emploi", "edt", "horaire", "schedule", "time", "التوقيت", "جدول"].some((m) => q.includes(m))) return "emploi";
  if (["ingénieur", "engineer", "engineering", "مهندس", "طور المهندس"].some((m) => q.includes(m))) return "ingenieur";
  if (["bonjour", "hello", "salut", "hi", "مرحبا", "اهلا"].some((m) => q.includes(m))) return "bonjour";
  if (["merci", "thanks", "شكرا"].some((m) => q.includes(m))) return "merci";
  if (["au revoir", "bye", "وداعا"].some((m) => q.includes(m))) return "au revoir";

  return null;
}

const langNames: Record<string, string> = { fr: "French", en: "English", ar: "Arabic" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question } = await req.json();
    const lang: Lang = detectLanguage(question || "");

    // 1. Try keyword match first
    const key = matchKeyword(question || "");
    if (key && reponses[key]) {
      return new Response(JSON.stringify({ reponse: reponses[key][lang], langue: lang, source: "keyword" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. AI fallback
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ reponse: reponses.default[lang], langue: lang, source: "default" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the assistant of the Computer Science Department at University of Batna 2, Algeria.
You MUST respond in the SAME LANGUAGE the user writes in. Detect the language automatically.
You are knowledgeable about computer science, education, university admissions, academic research, programming, algorithms, artificial intelligence, cybersecurity, networks, databases, and all IT-related topics.
You can answer any question - whether it's about the department, computer science concepts, programming help, math, science, general knowledge, or any other topic.
Be helpful, accurate, professional, and thorough. Use clear formatting with bullet points and emojis when appropriate.
For department-specific questions you don't know, suggest contacting the secretariat at +213 33 23 02 66 or email chef-dept.inf@univ-batna2.dz.
For general knowledge questions, provide the best possible answer.
IMPORTANT: Never mention that you are an AI, a chatbot, a language model, or any artificial intelligence. Act as the department's information desk assistant. Never say things like "as an AI" or "I'm an AI assistant".

Here is important department data you should know about:

MASTER SI (Computer Security) program details:
S1 modules: Advanced Database (Dr. YASMINE MEDJADBA), Algorithmic Complexity, Mathematical Tools for Cryptography, Ethical Hacking and Systems Defense (MEBARKI YOUCEF), Delivering Secure Software through Continuous Delivery, AI/Public Information/Cybercrime
S2 modules: Cryptography, Cybercrime & Networks (DEKHINET Abdelhamid), Forensics, Forensic DB/Multimedia & Security (DJEBAILI KARIMA), Project Management (OUSSAMA BOULDJEDRI), Governance & Digital, Internet of Things`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        const fallback: Record<string, string> = {
          fr: "⏳ Le service est momentanément surchargé. Veuillez réessayer dans quelques instants.",
          en: "⏳ The service is momentarily overloaded. Please try again shortly.",
          ar: "⏳ الخدمة مشغولة حاليًا. يرجى المحاولة مرة أخرى بعد قليل.",
        };
        return new Response(JSON.stringify({ reponse: fallback[lang] || fallback.fr, langue: lang, source: "error" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", aiResponse.status);
      return new Response(JSON.stringify({ reponse: reponses.default[lang], langue: lang, source: "default" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || reponses.default[lang];

    return new Response(JSON.stringify({ reponse: content, langue: lang, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ reponse: "Erreur technique. Contact: +213 33 23 02 66", langue: "fr", source: "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
