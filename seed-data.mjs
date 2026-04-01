import { drizzle } from "drizzle-orm/mysql2";
import { users, cases, casePhotos, donations, events } from "./drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create test users
    console.log("Creating users...");
    const [associationResult] = await db.insert(users).values({
      openId: "test-association-1",
      name: "Association UniVersElle Ariana",
      email: "association@universelle-ariana.org",
      role: "association",
      phone: "95403001",
      bio: "Organisation humanitaire apolitique combattant la pauvreté",
    });

    const [donorResult] = await db.insert(users).values({
      openId: "test-donor-1",
      name: "Ahmed Ben Ali",
      email: "ahmed@example.com",
      role: "donor",
    });

    console.log("Creating cases...");
    // Create test cases
    const casesData = [
      {
        title: "Aide médicale urgente pour Fatima",
        description: "Fatima, 8 ans, souffre d'une maladie cardiaque grave nécessitant une intervention chirurgicale urgente. Sa famille n'a pas les moyens de payer l'opération qui coûte 15 000 DT. Chaque jour compte pour sauver la vie de cette petite fille pleine de vie qui rêve de retourner à l'école et jouer avec ses amis.",
        category: "health",
        cha9a9aLink: "https://cha9a9a.tn/donate/fatima-heart",
        targetAmount: 15000,
        currentAmount: 8500,
        status: "approved",
        isUrgent: 1,
        associationId: 1,
        viewCount: 245,
      },
      {
        title: "Fauteuil roulant électrique pour Karim",
        description: "Karim, 25 ans, a perdu l'usage de ses jambes dans un accident. Il a besoin d'un fauteuil roulant électrique pour retrouver son autonomie et continuer ses études universitaires. Le coût du fauteuil est de 8 000 DT. Votre soutien peut changer sa vie.",
        category: "disability",
        cha9a9aLink: "https://cha9a9a.tn/donate/karim-wheelchair",
        targetAmount: 8000,
        currentAmount: 3200,
        status: "approved",
        isUrgent: 0,
        associationId: 1,
        viewCount: 156,
      },
      {
        title: "Fournitures scolaires pour 50 enfants démunis",
        description: "50 enfants de familles démunies n'ont pas les moyens d'acheter leurs fournitures scolaires pour la rentrée. Nous avons besoin de 5 000 DT pour leur offrir cartables, cahiers, livres et tout le nécessaire pour réussir leur année scolaire. Donnons-leur une chance égale de réussir.",
        category: "education",
        cha9a9aLink: "https://cha9a9a.tn/donate/school-supplies",
        targetAmount: 5000,
        currentAmount: 4200,
        status: "approved",
        isUrgent: 0,
        associationId: 1,
        viewCount: 189,
      },
      {
        title: "Rénovation d'une maison pour famille nombreuse",
        description: "Une famille de 7 personnes vit dans une maison délabrée avec un toit qui fuit et des murs fissurés. Les enfants tombent souvent malades à cause de l'humidité. Nous avons besoin de 12 000 DT pour rénover leur maison et leur offrir un logement digne.",
        category: "renovation",
        cha9a9aLink: "https://cha9a9a.tn/donate/house-renovation",
        targetAmount: 12000,
        currentAmount: 2800,
        status: "approved",
        isUrgent: 0,
        associationId: 1,
        viewCount: 98,
      },
      {
        title: "Aide d'urgence pour famille sinistrée",
        description: "Une famille a tout perdu dans un incendie qui a ravagé leur maison. Ils ont besoin d'aide immédiate pour se reloger, s'habiller et se nourrir. Objectif : 6 000 DT pour les aider à redémarrer leur vie.",
        category: "emergency",
        cha9a9aLink: "https://cha9a9a.tn/donate/fire-emergency",
        targetAmount: 6000,
        currentAmount: 1500,
        status: "approved",
        isUrgent: 1,
        associationId: 1,
        viewCount: 312,
      },
      {
        title: "Opération chirurgicale pour enfant orphelin",
        description: "Mohamed, 6 ans, orphelin, a besoin d'une opération des yeux pour retrouver la vue. Sans cette intervention, il risque de perdre définitivement la vision. Le coût est de 10 000 DT. Aidons cet enfant à voir le monde.",
        category: "children",
        cha9a9aLink: "https://cha9a9a.tn/donate/mohamed-eyes",
        targetAmount: 10000,
        currentAmount: 5600,
        status: "approved",
        isUrgent: 1,
        associationId: 1,
        viewCount: 278,
      },
    ];

    for (const caseData of casesData) {
      await db.insert(cases).values(caseData);
    }

    console.log("Creating donations...");
    // Create test donations
    const donationsData = [
      { caseId: 1, donorId: 2, amount: 500, message: "Que Dieu guérisse Fatima", isAnonymous: 0 },
      { caseId: 1, donorId: 2, amount: 1000, message: "Pour la santé de nos enfants", isAnonymous: 0 },
      { caseId: 2, donorId: 2, amount: 300, message: "Bon courage Karim", isAnonymous: 0 },
      { caseId: 3, donorId: 2, amount: 200, message: "Pour l'éducation de nos enfants", isAnonymous: 1 },
    ];

    for (const donation of donationsData) {
      await db.insert(donations).values(donation);
    }

    console.log("Creating events...");
    // Create test events
    const eventsData = [
      {
        title: "Journée solidaire au profit des orphelins",
        description: "Grande journée de solidarité avec animations, vente de charité et collecte de dons pour soutenir les orphelins de notre région.",
        eventDate: new Date("2026-03-15T10:00:00"),
        location: "Centre culturel Ariana",
        associationId: 1,
      },
      {
        title: "Campagne de collecte de vêtements d'hiver",
        description: "Distribution de vêtements chauds pour les familles démunies. Nous acceptons vos dons de vêtements en bon état.",
        eventDate: new Date("2026-02-20T14:00:00"),
        location: "Siège de l'association",
        associationId: 1,
      },
    ];

    for (const event of eventsData) {
      await db.insert(events).values(event);
    }

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
