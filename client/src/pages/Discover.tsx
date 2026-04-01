import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AssociationCard } from "@/components/social/AssociationCard";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/Navigation";
import { Search, Loader2, Users, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Discover() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: associations, isLoading } =
    trpc.socialFollows.searchAssociations.useQuery(
      { query: searchQuery || undefined },
      { placeholderData: (prev) => prev }
    );

  const { data: followingIds } = trpc.socialFollows.followingIds.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const followingSet = new Set(followingIds || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-6">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-8 py-4 rounded-3xl mb-6 shadow">
              <Heart className="h-9 w-9 text-rose-500" fill="currentColor" />
              <span className="text-2xl font-semibold tracking-tight">Découvrir</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-foreground mb-4">
              Trouvez des associations solidaires
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Explorez, suivez et rejoignez les communautés qui changent des vies
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("social.searchAssociations")}
                className="h-14 pl-14 text-lg rounded-3xl border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl focus-visible:ring-rose-500"
              />
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                <p className="text-muted-foreground mt-4">Recherche en cours...</p>
              </div>
            </div>
          ) : !associations || associations.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-20 h-20 rounded-full bg-white/70 dark:bg-zinc-900/70 flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">
                {searchQuery ? "Aucune association trouvée" : "Aucune association pour le moment"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "Essayez avec d'autres mots-clés ou élargissez votre recherche."
                  : "De nouvelles associations rejoindront bientôt la plateforme."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {associations.map((assoc: any) => (
                <AssociationCard
                  key={assoc.id}
                  association={assoc}
                  isFollowing={followingSet.has(assoc.id)}
                  isAuthenticated={isAuthenticated}
                  followersCount={assoc.followersCount}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}