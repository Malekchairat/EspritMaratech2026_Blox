import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import {
  Heart, Building2, AlertCircle, Eye, BarChart3, Pencil, Users, Video, Plus,
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/TranslatedText";

export default function AssociationDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const { data: myCases, isLoading } = trpc.cases.listByAssociation.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  if (user && user.role !== "association" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("common.accessDenied")}</h2>
          <p className="text-muted-foreground mb-6">{t("association.onlyAssociations")}</p>
          <Button asChild>
            <Link href="/">{t("common.backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={styles[status] || ""}>{t(`status.${status}`)}</Badge>;
  };

  const totalRaised = myCases?.reduce((sum, c) => sum + c.currentAmount, 0) ?? 0;
  const totalTarget = myCases?.reduce((sum, c) => sum + c.targetAmount, 0) ?? 0;
  const totalViews = myCases?.reduce((sum, c) => sum + c.viewCount, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-10">
        <div className="container max-w-7xl mx-auto px-6 space-y-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 py-2 rounded-2xl mb-4 shadow">
              <Building2 className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold">Espace Association</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-foreground">
              Bonjour, {user?.name?.split(" ")[0] || "Association"}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-md">
              Suivez l’impact de vos actions solidaires
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-5xl font-bold text-foreground">{myCases?.length ?? 0}</div>
                    <p className="text-muted-foreground mt-2">Cas publiés</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-rose-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-5xl font-bold text-emerald-600">
                      {totalRaised.toLocaleString()} {t("common.currency")}
                    </div>
                    <p className="text-muted-foreground mt-2">
                      Collectés sur {totalTarget.toLocaleString()} {t("common.currency")}
                    </p>
                  </div>
                  <Heart className="h-12 w-12 text-rose-500" fill="currentColor" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-5xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
                    <p className="text-muted-foreground mt-2">Vues totales</p>
                  </div>
                  <Eye className="h-12 w-12 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button asChild variant="outline" size="lg" className="rounded-2xl">
              <Link href="/memberships">
                <Users className="h-5 w-5 mr-2" />
                Membres
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl">
              <Link href="/meetings">
                <Video className="h-5 w-5 mr-2" />
                Réunions
              </Link>
            </Button>
            <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 shadow-lg">
              <Link href="/create-case">
                <Plus className="h-5 w-5 mr-2" />
                Nouveau cas social
              </Link>
            </Button>
          </div>

          {/* My Cases Section */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Heart className="h-7 w-7 text-rose-500" fill="currentColor" />
                Mes Cas Solidaires
              </CardTitle>
              <CardDescription className="text-base">
                Gérez vos campagnes et suivez leur progression en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent" />
                  <p className="mt-6 text-muted-foreground">Chargement de vos cas...</p>
                </div>
              ) : !myCases || myCases.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">Vous n’avez pas encore de cas</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Créez votre premier cas social et commencez à changer des vies
                  </p>
                  <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600">
                    <Link href="/create-case">
                      <Plus className="h-5 w-5 mr-2" />
                      Créer mon premier cas
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myCases.map((c) => (
                    <div
                      key={c.id}
                      className="group bg-white/70 dark:bg-zinc-950/70 border border-white/50 dark:border-white/10 rounded-3xl p-7 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <h3 className="font-semibold text-xl leading-tight">
                              <TranslatedText text={c.title} />
                            </h3>
                            {getStatusBadge(c.status)}
                            {c.isUrgent && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> Urgent
                              </Badge>
                            )}
                          </div>

                          <p className="text-muted-foreground line-clamp-3 mb-5">
                            <TranslatedText text={c.description} />
                          </p>

                          <div className="flex flex-wrap gap-3">
                            <Badge variant="outline" className="rounded-full">
                              {t(`categories.${c.category}`)}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Eye className="h-4 w-4" /> {c.viewCount} vues
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                          <Button variant="outline" asChild className="rounded-2xl">
                            <Link href={`/case/${c.id}`}>Voir le cas</Link>
                          </Button>
                          <Button variant="outline" asChild className="rounded-2xl">
                            <Link href={`/edit-case/${c.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-8">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            {c.currentAmount.toLocaleString()} / {c.targetAmount.toLocaleString()} {t("common.currency")}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {Math.round((c.currentAmount / c.targetAmount) * 100)}% atteint
                          </span>
                        </div>
                        <div className="w-full bg-muted/70 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                          <div
                            className="h-3 bg-gradient-to-r from-rose-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((c.currentAmount / c.targetAmount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
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