import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import {
  Crown,
  Shield,
  Award,
  Star,
  Users,
  Heart,
  LogOut,
  Building2,
  Sparkles,
  Video,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const TIER_CONFIG = {
  bronze: {
    label: "Bronze",
    icon: Shield,
    color: "text-amber-700 dark:text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    badgeCls: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    gradient: "from-amber-600 to-amber-800",
    nextTier: "silver" as const,
    nextAmount: 5000,
    perks: ["Access to community feed", "Join open meetings", "Membership badge"],
  },
  silver: {
    label: "Silver",
    icon: Award,
    color: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700",
    badgeCls: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    gradient: "from-slate-400 to-slate-600",
    nextTier: "gold" as const,
    nextAmount: 20000,
    perks: ["All Bronze perks", "Priority meeting access", "Monthly newsletter", "Silver badge"],
  },
  gold: {
    label: "Gold",
    icon: Star,
    color: "text-yellow-500 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700",
    badgeCls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    gradient: "from-yellow-400 to-yellow-600",
    nextTier: "platinum" as const,
    nextAmount: 50000,
    perks: ["All Silver perks", "Exclusive events", "Direct association contact", "Gold badge"],
  },
  platinum: {
    label: "Platinum",
    icon: Crown,
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700",
    badgeCls: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    gradient: "from-purple-500 to-purple-700",
    nextTier: null,
    nextAmount: null,
    perks: ["All Gold perks", "VIP access to all events", "Annual appreciation ceremony", "Platinum badge"],
  },
} as const;

function getTierProgress(tier: keyof typeof TIER_CONFIG, totalDonated: number) {
  const config = TIER_CONFIG[tier];
  if (!config.nextAmount) return 100;
  const prevAmount = tier === "bronze" ? 0 : tier === "silver" ? 5000 : tier === "gold" ? 20000 : 50000;
  const progress = ((totalDonated - prevAmount) / (config.nextAmount - prevAmount)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export default function Memberships() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const isAssociation = user?.role === "association" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-8 py-4 rounded-3xl mb-6 shadow">
              <Crown className="h-9 w-9 text-rose-500" />
              <span className="text-2xl font-semibold tracking-tight">Adhésions & Tiers</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter">Gérez vos adhésions</h1>
            <p className="text-xl text-muted-foreground mt-3 max-w-md mx-auto">
              Soutenez vos associations préférées et débloquez des avantages exclusifs
            </p>
          </div>

          {isAssociation ? <AssociationMembershipsView /> : <DonorMembershipsView />}
        </div>
      </main>
    </div>
  );
}

// ── Association View ───────────────────────────────────────

function AssociationMembershipsView() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: pendingRequests, isLoading: pendingLoading } = trpc.memberships.getPendingRequests.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const { data: members, isLoading: membersLoading } = trpc.memberships.getMembers.useQuery(
    { associationId: user!.id },
    { retry: false, enabled: !!user }
  );

  const approveMutation = trpc.memberships.approve.useMutation({
    onSuccess: () => {
      utils.memberships.getPendingRequests.invalidate();
      utils.memberships.getMembers.invalidate();
      utils.memberships.getMemberCount.invalidate();
    },
  });

  const rejectMutation = trpc.memberships.reject.useMutation({
    onSuccess: () => utils.memberships.getPendingRequests.invalidate(),
  });

  const approvedMembers = members?.filter((m: any) => m.status === "approved") ?? [];

  return (
    <div className="space-y-10">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-5xl font-bold text-emerald-600">{approvedMembers.length}</div>
                <p className="text-muted-foreground mt-2">Membres actifs</p>
              </div>
              <Users className="h-14 w-14 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-5xl font-bold text-yellow-600">{pendingRequests?.length ?? 0}</div>
                <p className="text-muted-foreground mt-2">Demandes en attente</p>
              </div>
              <Clock className="h-14 w-14 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-5xl font-bold text-rose-600">
                  {(approvedMembers.reduce((s: number, m: any) => s + (m.totalDonated || 0), 0)).toLocaleString()} TND
                </div>
                <p className="text-muted-foreground mt-2">Contributions totales</p>
              </div>
              <Heart className="h-14 w-14 text-rose-500" fill="currentColor" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Demandes en attente
            {(pendingRequests?.length ?? 0) > 0 && (
              <Badge className="ml-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {pendingRequests!.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Membres actifs ({approvedMembers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending" className="mt-6">
          {pendingLoading ? (
            <div className="text-center py-20">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-rose-500" />
              <p className="mt-6 text-muted-foreground">Chargement des demandes...</p>
            </div>
          ) : !pendingRequests || pendingRequests.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Aucune demande en attente</h3>
                <p className="text-muted-foreground">Toutes les demandes d'adhésion ont été traitées.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req: any) => (
                <Card key={req.id} className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/70 dark:bg-yellow-950/30 rounded-3xl">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          {req.memberAvatar && <AvatarImage src={req.memberAvatar} />}
                          <AvatarFallback>{req.memberName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{req.memberName || "Utilisateur"}</p>
                          <p className="text-sm text-muted-foreground">{req.memberEmail}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Demandé le {new Date(req.joinedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          En attente
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ membershipId: req.id })}
                          disabled={approveMutation.isPending}
                          className="rounded-2xl"
                        >
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate({ membershipId: req.id })}
                          disabled={rejectMutation.isPending}
                          className="rounded-2xl"
                        >
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Members */}
        <TabsContent value="members" className="mt-6">
          {membersLoading ? (
            <div className="text-center py-20">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-rose-500" />
              <p className="mt-6 text-muted-foreground">Chargement des membres...</p>
            </div>
          ) : approvedMembers.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Aucun membre actif</h3>
                <p className="text-muted-foreground">Les adhérents approuvés apparaîtront ici.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedMembers.map((member: any) => {
                const tier = TIER_CONFIG[member.tier as keyof typeof TIER_CONFIG];
                const TierIcon = tier.icon;
                return (
                  <Card key={member.id} className={`border-2 ${tier.bg} rounded-3xl hover:shadow-xl transition-all`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-white dark:border-zinc-800">
                            {member.memberAvatar && <AvatarImage src={member.memberAvatar} />}
                            <AvatarFallback>{member.memberName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-xl">{member.memberName || "Utilisateur"}</p>
                            <p className="text-sm text-muted-foreground">
                              Membre depuis {new Date(member.joinedAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 ${tier.color}`}>
                          <TierIcon className="h-7 w-7" />
                          <Badge className={tier.badgeCls}>{tier.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Contributions</span>
                          <span className="font-medium">{member.totalDonated.toLocaleString()} TND</span>
                        </div>
                        <Progress value={getTierProgress(member.tier, member.totalDonated)} className="h-2" />
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Avantages inclus</p>
                        <div className="flex flex-wrap gap-2">
                          {tier.perks.map((perk) => (
                            <Badge key={perk} variant="outline" className="text-xs">
                              {perk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Donor View ───────────────────────────────────────────────

function DonorMembershipsView() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: memberships, isLoading } = trpc.memberships.getMy.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const { data: associations } = trpc.socialFollows.searchAssociations.useQuery(undefined, {
    retry: false,
  });

  const joinMutation = trpc.memberships.join.useMutation({
    onSuccess: () => utils.memberships.getMy.invalidate(),
  });

  const leaveMutation = trpc.memberships.leave.useMutation({
    onSuccess: () => utils.memberships.getMy.invalidate(),
  });

  const memberAssociationIds = new Set(memberships?.map((m) => m.associationId) ?? []);
  const approvedMemberships = memberships?.filter((m) => m.status === "approved") ?? [];
  const pendingMemberships = memberships?.filter((m) => m.status === "pending") ?? [];

  const joinableAssociations = associations?.filter((a) => !memberAssociationIds.has(a.id) && a.id !== user?.id) ?? [];

  return (
    <div className="space-y-12">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-between">
              <div>
                <div className="text-5xl font-bold text-emerald-600">{approvedMemberships.length}</div>
                <p className="text-muted-foreground mt-2">Adhésions actives</p>
              </div>
              <Users className="h-14 w-14 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-between">
              <div>
                <div className="text-5xl font-bold text-rose-600">
                  {approvedMemberships.reduce((sum, m) => sum + (m.totalDonated || 0), 0).toLocaleString()} TND
                </div>
                <p className="text-muted-foreground mt-2">Contributions totales</p>
              </div>
              <Heart className="h-14 w-14 text-rose-500" fill="currentColor" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-between">
              <div>
                <div className="text-5xl font-bold text-purple-600">
                  {approvedMemberships.length > 0
                    ? TIER_CONFIG[
                        approvedMemberships.reduce((best, m) => {
                          const order = ["bronze", "silver", "gold", "platinum"] as const;
                          return order.indexOf(m.tier) > order.indexOf(best) ? m.tier : best;
                        }, approvedMemberships[0].tier)
                      ].label
                    : "—"}
                </div>
                <p className="text-muted-foreground mt-2">Niveau le plus élevé</p>
              </div>
              <Crown className="h-14 w-14 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingMemberships.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-500" />
            Demandes en attente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingMemberships.map((m) => (
              <Card key={m.id} className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-950/30 rounded-3xl">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {m.associationAvatar && <AvatarImage src={m.associationAvatar} />}
                        <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{m.associationName}</p>
                        <p className="text-xs text-muted-foreground">
                          Demandé le {new Date(m.joinedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => leaveMutation.mutate({ associationId: m.associationId })}
                      disabled={leaveMutation.isPending}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Memberships */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-rose-500" />
          Mes adhésions actives
        </h2>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-rose-500" />
            <p className="mt-6 text-muted-foreground">Chargement de vos adhésions...</p>
          </div>
        ) : approvedMemberships.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Aucune adhésion active</h3>
              <p className="text-muted-foreground mb-6">Demandez à rejoindre une association pour commencer.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvedMemberships.map((m) => {
              const tier = TIER_CONFIG[m.tier];
              const TierIcon = tier.icon;
              const progress = getTierProgress(m.tier, m.totalDonated);

              return (
                <Card key={m.id} className={`border-2 ${tier.bg} rounded-3xl hover:shadow-2xl transition-all`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-zinc-800">
                          {m.associationAvatar && <AvatarImage src={m.associationAvatar} />}
                          <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{m.associationName}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Membre depuis {new Date(m.joinedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${tier.color}`}>
                        <TierIcon className="h-7 w-7" />
                        <Badge className={tier.badgeCls}>{tier.label}</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Contributions</span>
                        <span className="font-medium">{m.totalDonated.toLocaleString()} TND</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                    </div>

                    <div>
                      <p className="uppercase text-xs tracking-widest text-muted-foreground mb-3">Avantages</p>
                      <div className="flex flex-wrap gap-2">
                        {tier.perks.map((perk) => (
                          <Badge key={perk} variant="outline" className="text-xs">
                            {perk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-3">
                    <Button asChild className="flex-1 rounded-2xl">
                      <Link href={`/association/${m.associationId}`}>Voir l'association</Link>
                    </Button>
                    <Button variant="outline" asChild className="rounded-2xl">
                      <Link href="/meetings">Réunions</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => leaveMutation.mutate({ associationId: m.associationId })}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Discover Associations */}
      {joinableAssociations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Building2 className="h-6 w-6 text-rose-500" />
            Découvrir d'autres associations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinableAssociations.map((a) => (
              <Card key={a.id} className="hover:shadow-xl transition-all rounded-3xl border border-white/50 dark:border-white/10">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {a.avatar && <AvatarImage src={a.avatar} />}
                      <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{a.name}</CardTitle>
                      {a.bio && <CardDescription className="line-clamp-2">{a.bio}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full rounded-2xl"
                    onClick={() => joinMutation.mutate({ associationId: a.id })}
                    disabled={joinMutation.isPending}
                  >
                    Demander à rejoindre
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tier Legend */}
      <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-purple-500" />
            Les niveaux d'adhésion
          </CardTitle>
          <CardDescription>Votre niveau évolue automatiquement selon vos dons à l'association</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(["bronze", "silver", "gold", "platinum"] as const).map((tierKey) => {
              const config = TIER_CONFIG[tierKey];
              const Icon = config.icon;
              return (
                <div key={tierKey} className={`rounded-3xl border-2 p-6 ${config.bg}`}>
                  <div className={`flex items-center gap-3 mb-4 ${config.color}`}>
                    <Icon className="h-8 w-8" />
                    <span className="font-bold text-2xl">{config.label}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {config.perks.map((perk) => (
                      <li key={perk} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span> {perk}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs text-muted-foreground border-t pt-4">
                    {tierKey === "bronze" && "0 – 4 999 TND"}
                    {tierKey === "silver" && "5 000 – 19 999 TND"}
                    {tierKey === "gold" && "20 000 – 49 999 TND"}
                    {tierKey === "platinum" && "50 000 TND et plus"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}