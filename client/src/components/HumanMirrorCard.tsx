import { useState } from "react";
import { Sparkles, Heart, Shield, TrendingUp } from "lucide-react";

interface ImpactScenario {
  id: number;
  scenario: string;
  sentiment: "positive" | "neutral" | "negative";
  biasScore: number;
  clusterId?: number | null;
  metadata: {
    keywords: string[];
    themes: string[];
    originalRequest: string;
  };
  generatedAt: string | Date;
}

interface HumanMirrorCardProps {
  scenarios: ImpactScenario[];
  stats?: {
    total: number;
    avgBiasScore: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

export default function HumanMirrorCard({ scenarios, stats }: HumanMirrorCardProps) {
  const [selectedScenario, setSelectedScenario] = useState(0);

  if (scenarios.length === 0) {
    return null;
  }

  const currentScenario = scenarios[selectedScenario];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getBiasScoreColor = (score: number) => {
    if (score < 20) return "text-green-600 dark:text-green-400";
    if (score < 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-md">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Human Mirror AI
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Empathy-amplifying impact scenarios to help you understand the real human impact
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full backdrop-blur-sm">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Ethical AI
          </span>
        </div>
      </div>

      {/* Scenario Content */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-5 mb-4 border border-purple-100 dark:border-purple-800/50">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
          {currentScenario.scenario}
        </p>

        {/* Keywords */}
        {currentScenario.metadata?.keywords && currentScenario.metadata.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {currentScenario.metadata.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scenario Navigation */}
      {scenarios.length > 1 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          {scenarios.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedScenario(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === selectedScenario
                  ? "w-8 bg-gradient-to-r from-purple-500 to-blue-500"
                  : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-purple-400 dark:hover:bg-purple-600"
              }`}
              aria-label={`View scenario ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Transparency Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Sentiment */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Sentiment
            </span>
          </div>
          <p className={`text-sm font-semibold capitalize ${getSentimentColor(currentScenario.sentiment)}`}>
            {currentScenario.sentiment}
          </p>
        </div>

        {/* Bias Score */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Bias Score
            </span>
          </div>
          <p className={`text-sm font-semibold ${getBiasScoreColor(currentScenario.biasScore)}`}>
            {currentScenario.biasScore}/100
          </p>
        </div>

        {/* Themes */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Category
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
            {currentScenario.metadata?.themes?.[0] || "General"}
          </p>
        </div>
      </div>

      {/* Explainability Footer */}
      <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/50">
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-2">
            <span className="font-medium">Why is this AI non-manipulative?</span>
            <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              <strong className="text-purple-700 dark:text-purple-400">Transparency:</strong> All
              scenarios show bias scores and sentiment analysis to help you evaluate their
              objectivity.
            </p>
            <p>
              <strong className="text-purple-700 dark:text-purple-400">Dignity-First:</strong>{" "}
              Scenarios focus on realistic outcomes without exaggeration or guilt-tripping.
            </p>
            <p>
              <strong className="text-purple-700 dark:text-purple-400">Optional:</strong> This is an
              empathy tool, not a pressure tactic. Your decision to donate is entirely yours.
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
              Generated by GPT-4 with ethical guardrails • Bias score &lt;20 = high quality
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
