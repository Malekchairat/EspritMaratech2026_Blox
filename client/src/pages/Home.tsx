import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation } from "@/components/Navigation";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { HearingAccessibilityPanel } from "@/components/HearingAccessibilityPanel";
import { NeurodivergentPanel } from "@/components/NeurodivergentPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  Search,
  AlertCircle,
  Moon,
  Sun,
  Users,
  TrendingUp,
  Plus,
  LayoutDashboard,
  UserCircle,
  Rss,
  Compass,
  Bookmark,
  Video,
  LogOut,
  HandHeart,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/TranslatedText";
import { SaveButton } from "@/components/SaveButton";

export default function Home() {
  const { t } = useTranslation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Redirect associations to their dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "association") {
      navigate("/dashboard/association");
    }
  }, [loading, isAuthenticated, user?.role, navigate]);

  const { data: cases, isLoading: casesLoading } = trpc.cases.list.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const categoryKeys = ["health", "disability", "children", "education", "renovation", "emergency"] as const;

  const stats = useMemo(() => {
    if (!cases) return { totalRaised: 0, activeCases: 0, associations: 0 };
    const totalRaised = cases.reduce((sum, c) => sum + (c.currentAmount ?? 0), 0);
    const activeCases = cases.length;
    const associations = new Set(cases.map((c) => c.associationId)).size;
    return { totalRaised, activeCases, associations };
  }, [cases]);

  const categories = [
    { value: "all", label: t("home.allCategories") },
    ...categoryKeys.map((key) => ({ value: key, label: t(`categories.${key}`) })),
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      disability: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      children: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      education: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      renovation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      emergency: "bg-destructive/20 text-destructive dark:bg-destructive/30",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      {/* Skip to main content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-5 focus:py-2 focus:rounded-2xl">
        {t("home.skipToContent")}
      </a>

      <Navigation />

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-rose-300/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-[700px] h-[700px] bg-purple-300/10 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-8 py-3 rounded-3xl mb-8 shadow">
            <Heart className="h-9 w-9 text-rose-500" fill="currentColor" />
            <span className="text-2xl font-semibold tracking-tight">{t("common.appName")}</span>
          </div>

          <h1 className="text-6xl lg:text-7xl font-bold tracking-tighter leading-none mb-6">
            Ensemble, nous changeons<br />des vies
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Rejoignez une communauté solidaire qui transforme l'espoir en action
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-white/10">
              <div className="text-5xl font-bold text-rose-600 mb-2">{stats.totalRaised.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">TND collectés</div>
            </div>
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-white/10">
              <div className="text-5xl font-bold text-emerald-600 mb-2">{stats.activeCases}</div>
              <div className="text-sm text-muted-foreground">Cas actifs</div>
            </div>
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-white/10">
              <div className="text-5xl font-bold text-blue-600 mb-2">{stats.associations}</div>
              <div className="text-sm text-muted-foreground">Associations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-white/10 py-6">
        <div className="container max-w-6xl mx-auto px-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("home.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-12 rounded-2xl text-base border-2 focus-visible:border-primary"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 w-full sm:w-80 rounded-2xl border-2 focus-visible:border-primary">
              <SelectValue placeholder={t("home.filterCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cases Grid */}
      <section id="main-content" className="py-12">
        <div className="container max-w-6xl mx-auto px-6">
          {casesLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                <p className="mt-4 text-muted-foreground">Chargement des cas...</p>
              </div>
            </div>
          ) : cases && cases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cases.map((caseItem: any, index: number) => (
                <Card
                  key={caseItem.id}
                  className="group overflow-hidden border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-3xl"
                >
                  {caseItem.coverImage && (
                    <div className="relative h-56">
                      <img
                        src={caseItem.coverImage}
                        alt={caseItem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {caseItem.isUrgent && (
                        <Badge variant="destructive" className="absolute top-4 right-4 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Urgent
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getCategoryColor(caseItem.category)}>
                        {t(`categories.${caseItem.category}`)}
                      </Badge>
                      {caseItem.associationName && (
                        <span className="text-xs text-primary font-medium">Par {caseItem.associationName}</span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 text-xl"><TranslatedText text={caseItem.title} /></CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 pb-6">
                    <p className="line-clamp-3 text-sm text-muted-foreground mb-6">
                      <TranslatedText text={caseItem.description} />
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Objectif</span>
                        <span className="font-semibold">{caseItem.targetAmount.toLocaleString()} TND</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-2.5 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full"
                          style={{ width: `${Math.min((caseItem.currentAmount / caseItem.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Collecté</span>
                        <span className="font-medium text-emerald-600">
                          {caseItem.currentAmount.toLocaleString()} TND
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6 flex gap-3">
                    <Button asChild className="flex-1 rounded-2xl">
                      <Link href={`/case/${caseItem.id}`}>Voir le cas</Link>
                    </Button>
                    {isAuthenticated && user?.role === "donor" && (
                      <SaveButton caseId={caseItem.id} />
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Aucun cas trouvé</h3>
              <p className="text-muted-foreground">Essayez de modifier vos filtres ou revenez plus tard.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}