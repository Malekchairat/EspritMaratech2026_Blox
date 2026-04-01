import { Express, Request, Response } from "express";
import * as db from "../db";

/**
 * Knowledge-based chatbot for the Universelle Ariana charity platform.
 * Handles questions about the platform, donations, cases, accessibility, etc.
 * Supports French, English, Arabic, Spanish, German, Turkish, Italian, Portuguese.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  lang?: string;
  history?: ChatMessage[];
}

// Platform knowledge base organized by topic
const KNOWLEDGE: Record<string, Record<string, string>> = {
  fr: {
    greeting: "Bonjour ! Je suis l'assistant virtuel d'Universelle Ariana. Je peux vous aider avec les dons, les cas sociaux, la navigation sur la plateforme et les fonctionnalités d'accessibilité. Comment puis-je vous aider ?",
    donate: "Pour faire un don, parcourez les cas sociaux sur la page d'accueil, cliquez sur un cas qui vous intéresse, puis cliquez sur le lien Chaqaqa pour contribuer. Chaque don fait une différence !",
    createCase: "Pour créer un cas social, vous devez être connecté en tant qu'association. Allez dans votre tableau de bord et cliquez sur 'Créer un cas'. Remplissez le titre, la description, la catégorie, le montant cible et le lien Chaqaqa.",
    categories: "Nous avons 6 catégories de cas : Santé, Handicap, Enfants, Éducation, Rénovation et Urgence. Vous pouvez filtrer les cas par catégorie sur la page d'accueil.",
    register: "Pour vous inscrire, cliquez sur 'S'inscrire' en haut de page. Choisissez votre rôle : Donateur (pour faire des dons) ou Association (pour publier des cas sociaux). Remplissez vos informations et c'est parti !",
    login: "Pour vous connecter, cliquez sur 'Connexion' en haut de page et entrez votre email et mot de passe. Vous pouvez aussi utiliser la saisie vocale pour entrer vos identifiants !",
    accessibility: "Notre plateforme est entièrement accessible ! Nous proposons : un lecteur d'écran vocal, un assistant vocal pour naviguer par la voix, un menu d'accessibilité (taille de texte, contraste, mode daltonien), la saisie vocale dans les formulaires, et le support de 8 langues dont l'arabe (RTL).",
    voice: "L'assistant vocal vous permet de naviguer par la voix. Cliquez sur le bouton micro flottant et dites des commandes comme 'accueil', 'connexion', 'créer un cas', etc. La saisie vocale est aussi disponible dans les champs de texte !",
    languages: "La plateforme est disponible en 8 langues : Français, English, العربية, Español, Deutsch, Türkçe, Italiano, Português. Utilisez le sélecteur de langue en haut à droite.",
    roles: "Il y a 3 rôles : Donateur (parcourir et donner), Association (créer et gérer des cas sociaux) et Administrateur (gérer les utilisateurs et valider les cas).",
    dashboard: "Chaque rôle a son propre tableau de bord. Les donateurs voient leurs dons, les associations gèrent leurs cas, et les administrateurs supervisent la plateforme.",
    urgent: "Les cas urgents sont marqués d'un badge rouge. Ce sont des situations nécessitant une aide immédiate. Vous pouvez les filtrer en cochant 'Urgents' sur la page d'accueil.",
    about: "Universelle Ariana est une plateforme solidaire qui connecte les donateurs avec les associations pour aider les personnes dans le besoin. Notre mission est de rendre la charité accessible à tous.",
    contact: "Pour toute question, vous pouvez utiliser ce chat ! Si vous avez besoin d'aide supplémentaire, contactez l'équipe d'administration via votre tableau de bord.",
    thanks: "De rien ! N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider !",
    stats: "",
    unknown: "Je ne suis pas sûr de comprendre votre question. Je peux vous aider avec : les dons, les statistiques, la création de cas, l'inscription, la connexion, l'accessibilité, les langues, les rôles utilisateurs, ou la navigation. Que souhaitez-vous savoir ?",
  },
  en: {
    greeting: "Hello! I'm the Universelle Ariana virtual assistant. I can help you with donations, social cases, platform navigation and accessibility features. How can I help you?",
    donate: "To make a donation, browse social cases on the homepage, click on a case that interests you, then click the Chaqaqa link to contribute. Every donation makes a difference!",
    createCase: "To create a social case, you must be logged in as an association. Go to your dashboard and click 'Create a case'. Fill in the title, description, category, target amount and Chaqaqa link.",
    categories: "We have 6 case categories: Health, Disability, Children, Education, Renovation and Emergency. You can filter cases by category on the homepage.",
    register: "To sign up, click 'Register' at the top of the page. Choose your role: Donor (to make donations) or Association (to publish social cases). Fill in your details and you're ready!",
    login: "To log in, click 'Login' at the top and enter your email and password. You can also use voice input to enter your credentials!",
    accessibility: "Our platform is fully accessible! We offer: a screen reader, voice assistant for navigation, accessibility menu (text size, contrast, color blindness mode), voice input in forms, and support for 8 languages including Arabic (RTL).",
    voice: "The voice assistant lets you navigate by voice. Click the floating mic button and say commands like 'home', 'login', 'create case', etc. Voice input is also available in text fields!",
    languages: "The platform is available in 8 languages: Français, English, العربية, Español, Deutsch, Türkçe, Italiano, Português. Use the language selector at the top right.",
    roles: "There are 3 roles: Donor (browse and donate), Association (create and manage social cases) and Administrator (manage users and validate cases).",
    dashboard: "Each role has its own dashboard. Donors see their donations, associations manage their cases, and administrators oversee the platform.",
    urgent: "Urgent cases are marked with a red badge. These are situations requiring immediate help. You can filter them by checking 'Urgent' on the homepage.",
    about: "Universelle Ariana is a solidarity platform that connects donors with associations to help people in need. Our mission is to make charity accessible to everyone.",
    contact: "For any questions, you can use this chat! If you need more help, contact the admin team through your dashboard.",
    thanks: "You're welcome! Don't hesitate if you have more questions. I'm here to help!",
    stats: "",
    unknown: "I'm not sure I understand your question. I can help you with: donations, statistics, creating cases, registration, login, accessibility, languages, user roles, or navigation. What would you like to know?",
  },
  ar: {
    greeting: "مرحبا! أنا المساعد الافتراضي لمنصة يونيفرسال أريانا. يمكنني مساعدتك في التبرعات، الحالات الاجتماعية، التنقل في المنصة وميزات إمكانية الوصول. كيف يمكنني مساعدتك؟",
    donate: "للتبرع، تصفح الحالات الاجتماعية في الصفحة الرئيسية، انقر على حالة تهمك، ثم انقر على رابط شقاقة للمساهمة. كل تبرع يحدث فرقا!",
    createCase: "لإنشاء حالة اجتماعية، يجب أن تكون مسجلا كجمعية. اذهب إلى لوحة التحكم وانقر على 'إنشاء حالة'. املأ العنوان والوصف والفئة والمبلغ المستهدف ورابط شقاقة.",
    categories: "لدينا 6 فئات: الصحة، الإعاقة، الأطفال، التعليم، الترميم والطوارئ. يمكنك تصفية الحالات حسب الفئة.",
    register: "للتسجيل، انقر على 'إنشاء حساب'. اختر دورك: متبرع أو جمعية. املأ بياناتك وابدأ!",
    login: "لتسجيل الدخول، انقر على 'تسجيل الدخول' وأدخل بريدك الإلكتروني وكلمة المرور. يمكنك أيضا استخدام الإدخال الصوتي!",
    accessibility: "منصتنا متاحة بالكامل! نقدم: قارئ شاشة، مساعد صوتي، قائمة إمكانية الوصول، إدخال صوتي، ودعم 8 لغات بما في ذلك العربية.",
    voice: "المساعد الصوتي يتيح لك التنقل بالصوت. انقر على زر الميكروفون وقل أوامر مثل 'الرئيسية'، 'تسجيل الدخول'، إلخ.",
    languages: "المنصة متاحة بـ 8 لغات: الفرنسية، الإنجليزية، العربية، الإسبانية، الألمانية، التركية، الإيطالية، البرتغالية.",
    roles: "هناك 3 أدوار: متبرع، جمعية، ومدير.",
    dashboard: "كل دور له لوحة تحكم خاصة به.",
    urgent: "الحالات العاجلة مميزة بشارة حمراء وتحتاج مساعدة فورية.",
    about: "يونيفرسال أريانا منصة تضامنية تربط المتبرعين بالجمعيات لمساعدة المحتاجين.",
    contact: "لأي سؤال، استخدم هذه المحادثة! للمزيد من المساعدة، تواصل مع فريق الإدارة.",
    thanks: "على الرحب والسعة! لا تتردد في طرح المزيد من الأسئلة.",
    stats: "",
    unknown: "لم أفهم سؤالك. يمكنني مساعدتك في: التبرعات، إنشاء الحالات، التسجيل، إمكانية الوصول، أو التنقل. ماذا تريد أن تعرف؟",
  },
  es: {
    greeting: "¡Hola! Soy el asistente virtual de Universelle Ariana. Puedo ayudarte con donaciones, casos sociales, navegación y accesibilidad. ¿Cómo puedo ayudarte?",
    donate: "Para donar, navega por los casos en la página principal, haz clic en uno que te interese y luego en el enlace Chaqaqa para contribuir.",
    createCase: "Para crear un caso social, debes estar conectado como asociación. Ve a tu panel y haz clic en 'Crear caso'.",
    categories: "Tenemos 6 categorías: Salud, Discapacidad, Niños, Educación, Renovación y Emergencia.",
    register: "Para registrarte, haz clic en 'Registrarse'. Elige tu rol: Donante o Asociación.",
    login: "Para iniciar sesión, haz clic en 'Iniciar sesión'. ¡También puedes usar entrada de voz!",
    accessibility: "Nuestra plataforma es totalmente accesible con lector de pantalla, asistente de voz, menú de accesibilidad y soporte para 8 idiomas.",
    voice: "El asistente de voz te permite navegar con tu voz. Haz clic en el micrófono flotante.",
    languages: "La plataforma está disponible en 8 idiomas.",
    roles: "Hay 3 roles: Donante, Asociación y Administrador.",
    dashboard: "Cada rol tiene su propio panel de control.",
    urgent: "Los casos urgentes están marcados con una insignia roja.",
    about: "Universelle Ariana es una plataforma solidaria que conecta donantes con asociaciones.",
    contact: "Para cualquier pregunta, ¡usa este chat!",
    thanks: "¡De nada! No dudes en hacer más preguntas. ¡Estoy aquí para ayudarte!",
    stats: "",
    unknown: "No estoy seguro de entender tu pregunta. Puedo ayudarte con: donaciones, casos, registro, accesibilidad o navegación. ¿Qué quieres saber?",
  },
};

// Keyword patterns for intent matching — use \b at start, word-char lookahead at end
// so prefixes like "donat" match "donate", "donation", etc.
const INTENT_PATTERNS: { intent: string; patterns: Record<string, RegExp> }[] = [
  {
    intent: "greeting",
    patterns: {
      fr: /\b(bonjour|salut|bonsoir|coucou|hey|hello|hi|salam|yo)\b/i,
      en: /\b(hello|hi|hey|good\s*(morning|afternoon|evening)|greetings)\b/i,
      ar: /(مرحبا|سلام|أهلا|هلا)/i,
      es: /\b(hola|buenos|buenas|saludos)\b/i,
    },
  },
  {
    intent: "donate",
    patterns: {
      fr: /(don\b|donner|donateur|contribu|aider|argent|payer|soutenir|financer)/i,
      en: /(donat|donate|donati|give|contribut|money|pay\b|support|fund)/i,
      ar: /(تبرع|مساعدة|مال|دعم)/i,
      es: /(donar|donación|contribuir|ayudar|dinero)/i,
    },
  },
  {
    intent: "createCase",
    patterns: {
      fr: /(cr[eé][eé]r|nouveau|publier|ajouter).*(cas|dossier|demande)/i,
      en: /(creat|new|publish|add|submit).*(case|request)/i,
      ar: /(إنشاء|جديد|حالة|إضافة)/i,
      es: /(crear|nuevo|publicar|añadir).*(caso)/i,
    },
  },
  {
    intent: "categories",
    patterns: {
      fr: /(cat[eé]gorie|sant[eé]|handicap|enfant|[eé]ducation|r[eé]novation|urgence)/i,
      en: /(categor|health|disabilit|children|education|renovation|emergency)/i,
      ar: /(فئة|صحة|إعاقة|أطفال|تعليم|طوارئ)/i,
      es: /(categoría|salud|discapacidad|niños|educación|emergencia)/i,
    },
  },
  {
    intent: "register",
    patterns: {
      fr: /(inscrip|inscrire|cr[eé][eé]r.*compte|enregistrer|nouveau.*compte)/i,
      en: /(register|sign.?up|create.*account|new.*account|join\b)/i,
      ar: /(تسجيل|حساب|إنشاء حساب)/i,
      es: /(registr|crear.*cuenta|nueva.*cuenta)/i,
    },
  },
  {
    intent: "login",
    patterns: {
      fr: /(connect|connexion|login|identifier|mot.*passe|se connecter)/i,
      en: /(log.?in|sign.?in|login|password|connect)/i,
      ar: /(تسجيل الدخول|دخول|كلمة المرور)/i,
      es: /(iniciar.*sesión|conectar|contraseña)/i,
    },
  },
  {
    intent: "accessibility",
    patterns: {
      fr: /(accessib|lecteur|[eé]cran|contraste|dalton|malvoyant|aveugle)/i,
      en: /(accessib|screen.?reader|contrast|color.?blind|visual|impair)/i,
      ar: /(إمكانية الوصول|قارئ|شاشة|ألوان)/i,
      es: /(accesib|lector|pantalla|contraste|dalton)/i,
    },
  },
  {
    intent: "voice",
    patterns: {
      fr: /(vocal|voix|micro|parler|dicter|commande.*vocale)/i,
      en: /(voice|vocal|microphone|speak|dictat|speech)/i,
      ar: /(صوت|صوتي|ميكروفون|تحدث)/i,
      es: /(voz|vocal|micrófono|hablar|dictar)/i,
    },
  },
  {
    intent: "languages",
    patterns: {
      fr: /(langue|traduction|traduire|français|anglais|arabe|espagnol|allemand)/i,
      en: /(language|translat|french|english|arabic|spanish|german)/i,
      ar: /(لغة|ترجمة|فرنسية|إنجليزية|عربية)/i,
      es: /(idioma|traducción|francés|inglés|árabe)/i,
    },
  },
  {
    intent: "roles",
    patterns: {
      fr: /(rôle|donateur|association|admin|compte)/i,
      en: /(role|donor|association|admin|account.*type)/i,
      ar: /(دور|متبرع|جمعية|مدير)/i,
      es: /(rol\b|donante|asociación|admin)/i,
    },
  },
  {
    intent: "dashboard",
    patterns: {
      fr: /(tableau.*bord|dashboard|panel|espace)/i,
      en: /(dashboard|panel|control|my.*space)/i,
      ar: /(لوحة|تحكم|لوحة التحكم)/i,
      es: /(panel|tablero|control)/i,
    },
  },
  {
    intent: "urgent",
    patterns: {
      fr: /(urgent|urgence|immédiat|priorit)/i,
      en: /(urgent|emergency|immediate|priorit)/i,
      ar: /(عاجل|طوارئ|فوري)/i,
      es: /(urgente|emergencia|inmediato|priorit)/i,
    },
  },
  {
    intent: "stats",
    patterns: {
      fr: /(combien|nombre|statistiq|chiffre|utilisat|membre|inscrit|total)/i,
      en: /(how many|number|statistic|figure|user|member|registered|total|count|people)/i,
      ar: /(كم|عدد|إحصائ|مستخدم|أعضاء|مسجل)/i,
      es: /(cuántos|número|estadístic|usuario|miembro|registrad|total)/i,
    },
  },
  {
    intent: "about",
    patterns: {
      fr: /(à propos|c.est quoi|qu.est.ce|mission|plateforme|universelle|ariana)/i,
      en: /(about|what is|mission|platform|universelle|ariana)/i,
      ar: /(حول|ما هي|مهمة|منصة)/i,
      es: /(acerca|qué es|misión|plataforma)/i,
    },
  },
  {
    intent: "contact",
    patterns: {
      fr: /(contact|joindre|email|téléphone|aide\b|support)/i,
      en: /(contact|reach|email|phone|help\b|support)/i,
      ar: /(اتصال|بريد|هاتف|مساعدة)/i,
      es: /(contacto|correo|teléfono|ayuda|soporte)/i,
    },
  },
  {
    intent: "thanks",
    patterns: {
      fr: /(merci|remerci|super|génial|parfait|cool|bravo)/i,
      en: /(thank|thanks|great|awesome|perfect|cool|nice)/i,
      ar: /(شكر|ممتاز|رائع)/i,
      es: /(gracia|genial|perfecto|excelente)/i,
    },
  },
];

function detectIntent(message: string, lang: string): string {
  const baseLang = lang.split("-")[0].toLowerCase();
  
  for (const { intent, patterns } of INTENT_PATTERNS) {
    // Try the user's language first, then fall back to French and English
    const langsToTry = [baseLang, "fr", "en"];
    for (const tryLang of langsToTry) {
      const pattern = patterns[tryLang];
      if (pattern && pattern.test(message)) {
        return intent;
      }
    }
  }
  return "unknown";
}

function getResponse(intent: string, lang: string): string {
  const baseLang = lang.split("-")[0].toLowerCase();
  const kb = KNOWLEDGE[baseLang] || KNOWLEDGE["fr"];
  return kb[intent] || kb["unknown"];
}

async function getStatsResponse(lang: string): Promise<string> {
  try {
    const allUsers = await db.getAllUsers();
    const allCases = await db.getCases();
    const userCount = allUsers?.length ?? 0;
    const caseCount = allCases?.length ?? 0;
    const urgentCount = allCases?.filter((c: any) => c.isUrgent).length ?? 0;
    const donorCount = allUsers?.filter((u: any) => u.role === "donor").length ?? 0;
    const assocCount = allUsers?.filter((u: any) => u.role === "association").length ?? 0;
    const adminCount = allUsers?.filter((u: any) => u.role === "admin").length ?? 0;
    const approvedCases = allCases?.filter((c: any) => c.status === "approved").length ?? 0;
    const pendingCases = allCases?.filter((c: any) => c.status === "pending").length ?? 0;

    const baseLang = lang.split("-")[0].toLowerCase();
    if (baseLang === "en") {
      return `Here are the current platform statistics:\n\n👥 **Users**: ${userCount} registered users\n  - ${donorCount} donors\n  - ${assocCount} associations\n  - ${adminCount} administrators\n\n📋 **Social Cases**: ${caseCount} total\n  - ${approvedCases} approved\n  - ${pendingCases} pending\n  - ${urgentCount} urgent`;
    }
    if (baseLang === "ar") {
      return `إليكم إحصائيات المنصة الحالية:\n\n👥 **المستخدمون**: ${userCount} مستخدم مسجل\n  - ${donorCount} متبرع\n  - ${assocCount} جمعية\n  - ${adminCount} مدير\n\n📋 **الحالات الاجتماعية**: ${caseCount} إجمالي\n  - ${approvedCases} معتمد\n  - ${pendingCases} قيد الانتظار\n  - ${urgentCount} عاجل`;
    }
    if (baseLang === "es") {
      return `Aquí están las estadísticas actuales de la plataforma:\n\n👥 **Usuarios**: ${userCount} registrados\n  - ${donorCount} donantes\n  - ${assocCount} asociaciones\n  - ${adminCount} administradores\n\n📋 **Casos sociales**: ${caseCount} en total\n  - ${approvedCases} aprobados\n  - ${pendingCases} pendientes\n  - ${urgentCount} urgentes`;
    }
    // Default: French
    return `Voici les statistiques actuelles de la plateforme :\n\n👥 **Utilisateurs** : ${userCount} inscrits\n  - ${donorCount} donateurs\n  - ${assocCount} associations\n  - ${adminCount} administrateurs\n\n📋 **Cas sociaux** : ${caseCount} au total\n  - ${approvedCases} approuvés\n  - ${pendingCases} en attente\n  - ${urgentCount} urgents`;
  } catch {
    const baseLang = lang.split("-")[0].toLowerCase();
    if (baseLang === "en") return "Sorry, I couldn't retrieve the statistics right now. Please try again later.";
    if (baseLang === "ar") return "عذراً، لم أتمكن من استرجاع الإحصائيات الآن. حاول مرة أخرى لاحقاً.";
    if (baseLang === "es") return "Lo siento, no pude obtener las estadísticas ahora. Inténtalo de nuevo más tarde.";
    return "Désolé, je n'ai pas pu récupérer les statistiques pour le moment. Veuillez réessayer plus tard.";
  }
}

async function getContextualInfo(intent: string, lang: string): Promise<string> {
  try {
    if (intent === "donate" || intent === "categories" || intent === "urgent") {
      const allCases = await db.getCases();
      if (allCases && allCases.length > 0) {
        const count = allCases.length;
        const urgentCount = allCases.filter((c: any) => c.isUrgent).length;
        const baseLang = lang.split("-")[0].toLowerCase();
        if (baseLang === "en") return ` (${count} cases available, ${urgentCount} urgent)`;
        if (baseLang === "ar") return ` (${count} حالة متاحة، ${urgentCount} عاجلة)`;
        if (baseLang === "es") return ` (${count} casos disponibles, ${urgentCount} urgentes)`;
        return ` (${count} cas disponibles, dont ${urgentCount} urgents)`;
      }
    }
  } catch {
    // DB not available, skip contextual info
  }
  return "";
}

export function registerChatRoutes(app: Express) {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, lang = "fr" }: ChatRequest = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const trimmed = message.trim();
      if (trimmed.length === 0) {
        res.status(400).json({ error: "Message cannot be empty" });
        return;
      }

      const intent = detectIntent(trimmed, lang);
      let response: string;

      if (intent === "stats") {
        response = await getStatsResponse(lang);
      } else {
        response = getResponse(intent, lang);
        // Add live data context when relevant
        const context = await getContextualInfo(intent, lang);
        if (context) {
          response += context;
        }
      }

      res.json({
        reply: response,
        intent,
      });
    } catch (error) {
      console.error("[Chat] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
