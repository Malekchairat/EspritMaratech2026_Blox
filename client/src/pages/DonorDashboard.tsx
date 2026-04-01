import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  HandHeart,
  Bookmark,
  Users,
  Video,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function DonorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const { data: myDonations, isLoading } = trpc.donations.getMyDonations.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const totalDonated = myDonations?.reduce((sum, d) => sum + d.amount, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-6 space-y-12">
          {/* Welcome Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-8 py-4 rounded-3xl mb-6 shadow">
              <Heart className="h-9 w-9 text-rose-500" fill="currentColor" />
              <span className="text-2xl font-semibold">Espace Donateur</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-foreground mb-3">
              Bonjour, {user?.name?.split(" ")[0] || "Donateur"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Merci pour votre générosité. Chaque don change une vie.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-5xl font-bold text-rose-600">
                      {totalDonated.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground mt-2">TND donnés</p>
                  </div>
                  <Heart className="h-14 w-14 text-rose-500" fill="currentColor" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-5xl font-bold text-emerald-600">
                      {myDonations?.length ?? 0}
                    </div>
                    <p className="text-muted-foreground mt-2">Dons effectués</p>
                  </div>
                  <HandHeart className="h-14 w-14 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
              onClick={() => window.location.href = "/saved-cases"}
            >
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-5xl font-bold text-blue-600">
                      {favorites?.length ?? 0}
                    </div>
                    <p className="text-muted-foreground mt-2">Cas suivis</p>
                  </div>
                  <Bookmark className="h-14 w-14 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
              onClick={() => window.location.href = "/memberships"}
            >
              <CardContent className="pt-8 pb-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-9 w-9 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-xl mb-1">Mes Adhésions</p>
                  <p className="text-muted-foreground">Gérez vos memberships et tiers d’association</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
              onClick={() => window.location.href = "/meetings"}
            >
              <CardContent className="pt-8 pb-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Video className="h-9 w-9 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-xl mb-1">Réunions & Événements</p>
                  <p className="text-muted-foreground">Rejoignez les visioconférences et événements</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donation History */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <HandHeart className="h-7 w-7 text-rose-500" />
                Historique de vos dons
              </CardTitle>
              <CardDescription className="text-base">
                Retrouvez tous les dons que vous avez effectués
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent" />
                  <p className="mt-6 text-muted-foreground">Chargement de l’historique...</p>
                </div>
              ) : !myDonations || myDonations.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">Vous n’avez pas encore fait de don</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    Commencez par explorer les cas et faire votre premier don solidaire.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600">
                    <Link href="/">Découvrir les cas</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myDonations.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-6 bg-white/70 dark:bg-zinc-950/70 rounded-3xl border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-900 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg truncate">
                          Don pour le cas #{d.caseId}
                        </p>
                        {d.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            "{d.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge className="text-lg px-6 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        +{d.amount.toLocaleString()} TND
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}