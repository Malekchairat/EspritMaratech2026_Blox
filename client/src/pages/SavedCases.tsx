import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/SaveButton";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Bookmark, ArrowLeft, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/TranslatedText";

export default function SavedCases() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });

  const { data: savedCases, isLoading: queryLoading } = trpc.favorites.listWithCases.useQuery(undefined, {
    retry: false,
    enabled: !!user,
    refetchOnMount: true,
  });

  const isLoading = authLoading || queryLoading;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      disability: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      children: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
      education: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      renovation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
      emergency: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    };
    return colors[category] || "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-8">
        <div className="container max-w-6xl mx-auto px-4">

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-200 dark:border-rose-800">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("savedCases.title")}
              </h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 ml-14">
              {t("savedCases.subtitle")}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent" />
              <p className="text-zinc-500 dark:text-zinc-400">{t("common.loading")}</p>
            </div>
          ) : savedCases && savedCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCases.map((item) => (
                <div
                  key={item.favoriteId}
                  className="flex flex-col border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {item.coverImage && (
                    <div className="relative w-full h-48">
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.isUrgent && (
                        <Badge className="absolute top-3 right-3 flex items-center gap-1 bg-rose-500 text-white border-0">
                          <AlertCircle className="h-3 w-3" />
                          {t("common.urgent")}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1 gap-3">
                    {/* Category + Save */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={`text-xs font-medium border-0 ${getCategoryColor(item.category)}`}>
                        {t(`categories.${item.category}`)}
                      </Badge>
                      <SaveButton caseId={item.caseId} />
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-2 mb-1">
                        <TranslatedText text={item.title} />
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        <TranslatedText text={item.description} />
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">{t("home.goal")}</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.targetAmount.toLocaleString()} {t("common.currency")}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((item.currentAmount / item.targetAmount) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">{t("home.collected")}</span>
                        <span className="font-semibold text-rose-500">
                          {item.currentAmount.toLocaleString()} {t("common.currency")}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {t("savedCases.savedOn", { date: new Date(item.savedAt).toLocaleDateString() })}
                    </p>

                    {/* CTA */}
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-md"
                    >
                      <Link href={`/case/${item.caseId}`}>{t("home.viewDetails")}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl">
                <Bookmark className="h-12 w-12 text-rose-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {t("savedCases.empty")}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
                {t("savedCases.emptyDesc")}
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white border-0 rounded-xl shadow-md px-6"
              >
                <Link href="/">{t("donor.exploreCases")}</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/30 dark:border-white/10 py-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
        <div className="container text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("common.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
