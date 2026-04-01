/**
 * Human Mirror AI Service
 *
 * This module generates empathy-amplifying impact scenarios using GPT-4.
 * It's designed for ethical, non-manipulative storytelling that helps donors
 * understand the real human impact of their potential contributions.
 */

interface CaseData {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  associationName?: string;
}

interface ImpactScenario {
  scenario: string;
  sentiment: "positive" | "neutral" | "negative";
  biasScore: number;
  clusterId?: number;
  metadata: {
    keywords: string[];
    themes: string[];
    originalRequest: string;
  };
}

/**
 * Generates AI-powered human impact scenarios for a case
 * Uses GPT-4 to create empathetic, realistic narratives
 */
export async function generateImpactScenarios(
  caseData: CaseData,
  count: number = 3
): Promise<ImpactScenario[]> {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    // Return mock scenarios for development/demo purposes
    return generateMockScenarios(caseData, count);
  }

  try {
    const prompt = buildPrompt(caseData);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an empathy amplification AI for a donation platform. Generate realistic, human-centered impact scenarios that help donors understand how their contribution would help real people.

CRITICAL ETHICAL GUIDELINES:
- Focus on factual, realistic outcomes (not exaggerated)
- Avoid manipulation or guilt-tripping
- Emphasize human dignity and agency
- Use inclusive, respectful language
- Never stereotype or generalize vulnerable groups
- Always maintain transparency about uncertainty

Generate ${count} diverse scenarios showing different potential impacts.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("[HumanMirrorAI] OpenAI API error:", response.statusText);
      return generateMockScenarios(caseData, count);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the generated scenarios
    const scenarios = parseGeneratedScenarios(generatedText, caseData);

    // Analyze sentiment and bias for each scenario
    return scenarios.map(scenario => ({
      ...scenario,
      sentiment: analyzeSentiment(scenario.scenario),
      biasScore: detectBias(scenario.scenario),
      metadata: {
        ...scenario.metadata,
        originalRequest: caseData.title,
      },
    }));

  } catch (error) {
    console.error("[HumanMirrorAI] Error generating scenarios:", error);
    return generateMockScenarios(caseData, count);
  }
}

/**
 * Builds an ethical, context-aware prompt for GPT-4
 */
function buildPrompt(caseData: CaseData): string {
  return `Case Details:
- Title: ${caseData.title}
- Description: ${caseData.description}
- Category: ${caseData.category}
- Target Amount: ${caseData.targetAmount} TND
${caseData.associationName ? `- Association: ${caseData.associationName}` : ""}

Generate realistic human impact scenarios that show:
1. Who this helps (specific but respectful, protecting dignity)
2. What changes in their daily life (concrete, realistic outcomes)
3. Ripple effects (family, community, future possibilities)

Format each scenario as:
SCENARIO [number]:
[2-3 sentences describing realistic, human-centered impact]

Keep scenarios diverse (different beneficiaries, timeframes, impact types).`;
}

/**
 * Parses GPT-4 output into structured scenarios
 */
function parseGeneratedScenarios(text: string, caseData: CaseData): ImpactScenario[] {
  const scenarios: ImpactScenario[] = [];
  const scenarioBlocks = text.split(/SCENARIO \d+:/i).filter(s => s.trim());

  scenarioBlocks.forEach((block, index) => {
    const scenario = block.trim();
    if (scenario.length > 20) {
      scenarios.push({
        scenario,
        sentiment: "positive",
        biasScore: 0,
        clusterId: index,
        metadata: {
          keywords: extractKeywords(scenario),
          themes: [caseData.category],
          originalRequest: caseData.title,
        },
      });
    }
  });

  return scenarios;
}

/**
 * Simple sentiment analysis
 * In production, use a proper NLP library
 */
function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const positiveWords = ["help", "better", "improve", "support", "enable", "opportunity", "hope", "future", "dignity", "empowerment"];
  const negativeWords = ["suffer", "struggle", "difficult", "crisis", "emergency", "desperate", "urgent"];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Bias detection: checks for manipulative or stereotyping language
 * Returns score 0-100 (0 = no bias, 100 = high bias)
 */
function detectBias(text: string): number {
  let biasScore = 0;
  const lowerText = text.toLowerCase();

  // Check for manipulative language
  const manipulativePatterns = [
    "you must", "you should feel", "imagine if it was you",
    "guilt", "obligated", "duty", "owe",
  ];

  manipulativePatterns.forEach(pattern => {
    if (lowerText.includes(pattern)) biasScore += 15;
  });

  // Check for stereotyping
  const stereotypePatterns = [
    "all of them", "they always", "these people", "typical",
  ];

  stereotypePatterns.forEach(pattern => {
    if (lowerText.includes(pattern)) biasScore += 20;
  });

  // Check for exaggeration
  if ((lowerText.match(/!/g) || []).length > 2) biasScore += 10;
  if (lowerText.includes("dramatic") || lowerText.includes("miracle")) biasScore += 10;

  return Math.min(biasScore, 100);
}

/**
 * Extracts keywords from scenario text
 */
function extractKeywords(text: string): string[] {
  const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];

  const wordFreq = words
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Generates mock scenarios for development/demo
 * Used when OpenAI API key is not available
 */
function generateMockScenarios(caseData: CaseData, count: number): ImpactScenario[] {
  const mockScenarios = [
    {
      scenario: `Your contribution would directly support the beneficiaries described in "${caseData.title}". This assistance enables them to access essential resources, maintain their dignity, and work towards stability. The impact extends to their immediate family, creating a ripple effect of positive change in their community.`,
      sentiment: "positive" as const,
      biasScore: 5,
      clusterId: 0,
      metadata: {
        keywords: ["support", "dignity", "community", "resources", "family"],
        themes: [caseData.category],
        originalRequest: caseData.title,
      },
    },
    {
      scenario: `This case addresses a real need in the ${caseData.category} sector. Your donation helps provide targeted assistance that can improve daily living conditions for vulnerable individuals. The goal is to create sustainable positive outcomes while respecting the autonomy and agency of beneficiaries.`,
      sentiment: "positive" as const,
      biasScore: 3,
      clusterId: 1,
      metadata: {
        keywords: ["assistance", "sustainable", "autonomy", "conditions", "vulnerable"],
        themes: [caseData.category],
        originalRequest: caseData.title,
      },
    },
    {
      scenario: `Supporting this initiative means contributing to a coordinated effort by ${caseData.associationName || "the association"} to address ${caseData.category} challenges. Your participation helps maintain essential services and creates opportunities for meaningful improvement in people's lives.`,
      sentiment: "positive" as const,
      biasScore: 2,
      clusterId: 2,
      metadata: {
        keywords: ["initiative", "coordinated", "services", "opportunities", "improvement"],
        themes: [caseData.category],
        originalRequest: caseData.title,
      },
    },
  ];

  return mockScenarios.slice(0, count);
}
