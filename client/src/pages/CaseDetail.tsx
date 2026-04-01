import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import HumanMirrorCard from "@/components/HumanMirrorCard";
import {
  Heart,
  ExternalLink,
  AlertCircle,
  Eye,
  Calendar,
  Share2,
  Instagram,
  Youtube,
  Globe,
  Copy,
  Check,
  Pencil,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { useParams, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/TranslatedText";
import { SaveButton } from "@/components/SaveButton";
import { useState, useEffect } from "react";
import axios from "axios";

export default function CaseDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const caseId = parseInt(id || "0");
  const { user, isAuthenticated } = useAuth();

  const { data: caseData, isLoading, refetch: refetchCase } = trpc.cases.getById.useQuery({ id: caseId });
  const { data: donations } = trpc.donations.getByCase.useQuery({ caseId });
  const { data: caseInfluencers } = trpc.influencers.getByCase.useQuery({ caseId });
  const { data: aiScenariosData, refetch: refetchScenarios } = trpc.humanMirror.getScenariosWithStats.useQuery({ caseId });

  const generateScenarios = trpc.humanMirror.generateScenarios.useMutation({
    onSuccess: () => refetchScenarios(),
  });

  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Verify Stripe payment after redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const success = params.get("success");

    if (success === "true" && sessionId) {
      axios.post("/api/payment/verify-stripe", { sessionId })
        .then((res) => {
          if (res.data.success) {
            setPaymentSuccess(true);
            refetchCase();
            window.history.replaceState({}, "", `/case/${caseId}`);
          }
        })
        .catch((err) => console.error("Payment verification failed:", err));
    }
  }, [caseId, refetchCase]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent" />
          <p className="mt-6 text-muted-foreground">Chargement du cas...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-3">Cas non trouvé</h2>
          <p className="text-muted-foreground mb-8">Le cas que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button asChild size="lg" className="rounded-2xl">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min((caseData.currentAmount / caseData.targetAmount) * 100, 100);

  async function handleStripePay() {
    if (!caseData) return;

    const amountTND = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amountTND) || amountTND <= 0) {
      setPaymentError("Veuillez entrer un montant valide supérieur à 0");
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    try {
      const amountMillimes = Math.round(amountTND * 100);
      const res = await axios.post("/api/payment/stripe-session", {
        amount: amountMillimes,
        description: caseData.title,
        caseId: caseId,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setPaymentError("Erreur lors de la création du paiement Stripe");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Une erreur est survenue";
      setPaymentError(errorMessage);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      {/* Success Banner */}
      {paymentSuccess && (
        <div className="bg-emerald-100 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800 py-4">
          <div className="container max-w-6xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
            <Check className="h-6 w-6" />
            <p className="font-medium">Merci ! Votre don a été reçu et ajouté à ce cas.</p>
          </div>
        </div>
      )}

      <main className="flex-1 py-10">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-10">
              {/* Hero Image + Title */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {caseData.coverImage ? (
                  <img
                    src={caseData.coverImage}
                    alt={caseData.title}
                    className="w-full h-[420px] object-cover"
                  />
                ) : (
                  <div className="h-[420px] bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center">
                    <Heart className="h-32 w-32 text-white/30" fill="currentColor" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Badge className={`${getCategoryColor(caseData.category)} text-sm px-4 py-1`}>
                      {t(`categories.${caseData.category}`)}
                    </Badge>
                    {caseData.isUrgent && (
                      <Badge variant="destructive" className="flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Urgent
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight">
                    <TranslatedText text={caseData.title} />
                  </h1>

                  <div className="flex items-center gap-4 mt-6 text-sm">
                    {caseData.associationName && (
                      <span className="flex items-center gap-2">
                        Par <span className="font-semibold">{caseData.associationName}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(caseData.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {caseData.viewCount} vues
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
                <CardContent className="pt-8 pb-10">
                  <h3 className="text-2xl font-semibold mb-6">L'histoire complète</h3>
                  <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-foreground/90">
                    <TranslatedText text={caseData.description} />
                  </div>
                </CardContent>
              </Card>

              {/* Photos Gallery */}
              {caseData.photos && caseData.photos.length > 0 && (
                <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
                  <CardHeader>
                    <CardTitle>Photos du cas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {caseData.photos.map((photo: any) => (
                        <div key={photo.id} className="rounded-2xl overflow-hidden aspect-video">
                          <img
                            src={photo.photoUrl}
                            alt={`Photo ${photo.displayOrder}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Human Mirror AI Section */}
              {aiScenariosData && aiScenariosData.scenarios.length > 0 ? (
                <HumanMirrorCard scenarios={aiScenariosData.scenarios} stats={aiScenariosData.stats} />
              ) : (
                <Card className="border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
                  <CardContent className="pt-10 pb-12 text-center">
                    <Sparkles className="h-16 w-16 mx-auto text-purple-500 mb-6" />
                    <h3 className="text-2xl font-bold mb-3">Découvrez l'impact humain</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                      Générez des scénarios réalistes pour visualiser comment votre don peut changer des vies.
                    </p>
                    <Button
                      onClick={() => generateScenarios.mutate({ caseId, count: 3 })}
                      disabled={generateScenarios.isPending}
                      size="lg"
                      className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {generateScenarios.isPending ? "Génération en cours..." : "Générer les scénarios d'impact"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Influencers / Supporters */}
              {caseInfluencers && caseInfluencers.length > 0 && (
                <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
                      Soutenu par
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {caseInfluencers.map((inf: any) => {
                        const links = inf.socialLinks ? (() => { try { return JSON.parse(inf.socialLinks); } catch { return {}; } })() : {};
                        return (
                          <div key={inf.id} className="flex gap-5 p-6 bg-white/60 dark:bg-zinc-950/60 rounded-3xl border border-white/50 dark:border-white/10">
                            <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-zinc-800">
                              {inf.photo && <AvatarImage src={inf.photo} />}
                              <AvatarFallback className="bg-gradient-to-br from-rose-400 to-purple-500 text-white font-bold">
                                {inf.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{inf.name}</p>
                                <Badge variant={inf.type === "sponsor" ? "default" : "secondary"} className="text-xs">
                                  {inf.type === "sponsor" ? "Sponsor" : "Influenceur"}
                                </Badge>
                              </div>
                              {inf.solidarityMessage && (
                                <p className="text-sm italic text-muted-foreground">"{inf.solidarityMessage}"</p>
                              )}
                              <div className="flex gap-4 mt-4">
                                {links.instagram && <a href={links.instagram} target="_blank" className="text-pink-500"><Instagram className="h-5 w-5" /></a>}
                                {links.youtube && <a href={links.youtube} target="_blank" className="text-red-500"><Youtube className="h-5 w-5" /></a>}
                                {links.website && <a href={links.website} target="_blank" className="text-blue-500"><Globe className="h-5 w-5" /></a>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Donations */}
              {donations && donations.length > 0 && (
                <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
                  <CardHeader>
                    <CardTitle>Dons récents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {donations.slice(0, 6).map((donation: any) => (
                        <div key={donation.id} className="flex justify-between items-center py-3 border-b last:border-0">
                          <div>
                            <p className="font-medium">
                              {donation.isAnonymous ? "Don anonyme" : "Un donateur"}
                            </p>
                            {donation.message && <p className="text-sm text-muted-foreground mt-0.5">"{donation.message}"</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">
                              +{donation.amount.toLocaleString()} TND
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(donation.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sticky Donation Sidebar */}
            <div className="lg:col-span-4">
              <Card className="sticky top-24 border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6">
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Heart className="h-8 w-8 text-rose-500" fill="currentColor" />
                    Soutenir ce cas
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Progress */}
                  <div className="space-y-5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Collecté</span>
                      <span className="font-bold text-foreground">
                        {caseData.currentAmount.toLocaleString()} TND
                      </span>
                    </div>

                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-3 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Objectif</span>
                      <span className="font-semibold">{caseData.targetAmount.toLocaleString()} TND</span>
                    </div>

                    <div className="text-center">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-purple-600 text-white text-4xl font-bold shadow-inner">
                        {progressPercentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Amount Input */}
                  {(!isAuthenticated || user?.role === "donor") && (
                    <div className="space-y-4">
                      <Label className="text-base">Montant du don (TND)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="50"
                          value={donationAmount}
                          onChange={(e) => {
                            setDonationAmount(e.target.value);
                            setIsAmountValid(parseFloat(e.target.value) > 0);
                          }}
                          className="h-14 text-2xl font-semibold rounded-2xl"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-medium text-muted-foreground">TND</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[10, 25, 50, 100].map((amt) => (
                          <Button
                            key={amt}
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setDonationAmount(amt.toString());
                              setIsAmountValid(true);
                            }}
                            className="rounded-2xl"
                          >
                            {amt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <Button
                    size="lg"
                    onClick={handleStripePay}
                    disabled={isPaying || !isAmountValid}
                    className="w-full h-16 text-xl font-semibold rounded-3xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 shadow-xl active:scale-[0.985] transition-all"
                  >
                    {isPaying ? (
                      <>Traitement en cours...</>
                    ) : (
                      <>
                        Faire un don maintenant <Heart className="ml-3 h-6 w-6" fill="currentColor" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Paiement sécurisé via Stripe • Protection des données
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}