import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { NeurodivergentPanel } from "@/components/NeurodivergentPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Edit,
  Moon,
  Plus,
  Sun,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Link2,
  Unlink,
  Instagram,
  Youtube,
  Globe,
  Upload,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type InfluencerType = "influencer" | "sponsor";

interface InfluencerFormData {
  name: string;
  type: InfluencerType;
  photo: string;
  socialLinks: string;
  solidarityMessage: string;
  isApproved: boolean;
}

const emptyForm: InfluencerFormData = {
  name: "",
  type: "influencer",
  photo: "",
  socialLinks: JSON.stringify({ instagram: "", youtube: "", twitter: "", tiktok: "", website: "" }),
  solidarityMessage: "",
  isApproved: false,
};

interface SocialLinksObj {
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}

function parseSocialLinks(raw: string | null | undefined): SocialLinksObj {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default function AdminInfluencers() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InfluencerFormData>({ ...emptyForm });

  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");

  const [linkCaseId, setLinkCaseId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: allInfluencers, isLoading } = trpc.influencers.list.useQuery();
  const { data: allCases } = trpc.cases.list.useQuery();
  const { data: linkedCaseIds } = trpc.influencers.getLinkedCaseIds.useQuery(
    { influencerId: selectedId ?? 0 },
    { enabled: !!selectedId && showLinkDialog }
  );

  const createMutation = trpc.influencers.create.useMutation({
    onSuccess: () => {
      utils.influencers.list.invalidate();
      setShowCreateDialog(false);
      toast.success(t("influencer.created", "Influenceur créé avec succès"));
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.influencers.update.useMutation({
    onSuccess: () => {
      utils.influencers.list.invalidate();
      setShowEditDialog(false);
      toast.success(t("influencer.updated", "Influenceur mis à jour"));
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.influencers.delete.useMutation({
    onSuccess: () => {
      utils.influencers.list.invalidate();
      setShowDeleteDialog(false);
      toast.success(t("influencer.deleted", "Influenceur supprimé"));
    },
    onError: (err) => toast.error(err.message),
  });

  const linkMutation = trpc.influencers.linkToCase.useMutation({
    onSuccess: () => {
      utils.influencers.getLinkedCaseIds.invalidate({ influencerId: selectedId ?? 0 });
      toast.success(t("influencer.linked", "Cas lié avec succès"));
      setLinkCaseId("");
    },
    onError: (err) => toast.error(err.message),
  });

  const unlinkMutation = trpc.influencers.unlinkFromCase.useMutation({
    onSuccess: () => {
      utils.influencers.getLinkedCaseIds.invalidate({ influencerId: selectedId ?? 0 });
      toast.success(t("influencer.unlinked", "Lien retiré"));
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
        <div className="text-center">
          <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{t("common.accessDenied")}</p>
        </div>
      </div>
    );
  }

  function buildSocialLinks(): string {
    const links: SocialLinksObj = {};
    if (socialInstagram) links.instagram = socialInstagram;
    if (socialYoutube) links.youtube = socialYoutube;
    if (socialTwitter) links.twitter = socialTwitter;
    if (socialTiktok) links.tiktok = socialTiktok;
    if (socialWebsite) links.website = socialWebsite;
    return JSON.stringify(links);
  }

  function openCreate() {
    setFormData({ ...emptyForm });
    setSocialInstagram(""); setSocialYoutube(""); setSocialTwitter(""); setSocialTiktok(""); setSocialWebsite("");
    setShowCreateDialog(true);
  }

  function openEdit(inf: any) {
    const links = parseSocialLinks(inf.socialLinks);
    setSelectedId(inf.id);
    setFormData({
      name: inf.name,
      type: inf.type,
      photo: inf.photo || "",
      socialLinks: inf.socialLinks || "",
      solidarityMessage: inf.solidarityMessage || "",
      isApproved: inf.isApproved,
    });
    setSocialInstagram(links.instagram || "");
    setSocialYoutube(links.youtube || "");
    setSocialTwitter(links.twitter || "");
    setSocialTiktok(links.tiktok || "");
    setSocialWebsite(links.website || "");
    setShowEditDialog(true);
  }

  function openDelete(id: number) {
    setSelectedId(id);
    setShowDeleteDialog(true);
  }

  function openLink(id: number) {
    setSelectedId(id);
    setLinkCaseId("");
    setShowLinkDialog(true);
  }

  function handleCreate() {
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      photo: formData.photo || undefined,
      socialLinks: buildSocialLinks(),
      solidarityMessage: formData.solidarityMessage || undefined,
      isApproved: formData.isApproved,
    });
  }

  function handleUpdate() {
    if (!selectedId) return;
    updateMutation.mutate({
      id: selectedId,
      name: formData.name,
      type: formData.type,
      photo: formData.photo || null,
      socialLinks: buildSocialLinks(),
      solidarityMessage: formData.solidarityMessage || null,
      isApproved: formData.isApproved,
    });
  }

  function handleToggleApproval(inf: any) {
    updateMutation.mutate({
      id: inf.id,
      isApproved: !inf.isApproved,
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, photo: data.url }));
        toast.success(t("influencer.photoUploaded", "Photo uploadée"));
      }
    } catch {
      toast.error(t("influencer.uploadError", "Erreur d'upload"));
    } finally {
      setUploading(false);
    }
  }

  const linkedCases = allCases?.filter((c: any) => linkedCaseIds?.includes(c.id)) ?? [];
  const unlinkedCases = allCases?.filter((c: any) => !linkedCaseIds?.includes(c.id)) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/dashboard/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow">
                <Star className="h-8 w-8 text-rose-500" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t("influencer.management", "Gestion des Influenceurs / Sponsors")}
                </h1>
                <p className="text-sm text-muted-foreground">Solidarité • Visibilité • Impact</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NeurodivergentPanel />
            <AccessibilityMenu />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container max-w-7xl mx-auto px-6 space-y-8">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold text-foreground">
                {allInfluencers?.length ?? 0}{" "}
                <span className="text-muted-foreground text-xl font-normal">
                  {t("influencer.total", "influenceurs / sponsors")}
                </span>
              </p>
            </div>
            <Button onClick={openCreate} size="lg" className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              {t("influencer.add", "Ajouter un influenceur / sponsor")}
            </Button>
          </div>

          {/* Main Card */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/50 dark:border-white/10 hover:bg-transparent">
                    <TableHead className="w-20">Photo</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Réseaux</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        Chargement des influenceurs...
                      </TableCell>
                    </TableRow>
                  ) : !allInfluencers?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <Star className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">{t("influencer.empty", "Aucun influenceur ou sponsor")}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allInfluencers.map((inf: any) => {
                      const links = parseSocialLinks(inf.socialLinks);
                      return (
                        <TableRow key={inf.id} className="hover:bg-white/70 dark:hover:bg-zinc-950/70 transition-all border-b border-white/30 dark:border-white/10">
                          <TableCell>
                            <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-zinc-800">
                              {inf.photo && <AvatarImage src={inf.photo} alt={inf.name} />}
                              <AvatarFallback className="bg-gradient-to-br from-rose-400 to-purple-500 text-white font-semibold">
                                {inf.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{inf.name}</TableCell>
                          <TableCell>
                            <Badge variant={inf.type === "sponsor" ? "default" : "secondary"} className="rounded-full">
                              {inf.type === "sponsor" ? "Sponsor" : "Influenceur"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={inf.isApproved ? "default" : "outline"}
                              className={inf.isApproved ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : ""}
                            >
                              {inf.isApproved ? "Approuvé" : "En attente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {links.instagram && <Instagram className="h-5 w-5 text-pink-500" />}
                              {links.youtube && <Youtube className="h-5 w-5 text-red-500" />}
                              {links.website && <Globe className="h-5 w-5 text-blue-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleApproval(inf)}
                                className="hover:bg-emerald-100 dark:hover:bg-emerald-950"
                              >
                                {inf.isApproved ? (
                                  <XCircle className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openLink(inf.id)}>
                                <Link2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(inf)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDelete(inf.id)} className="hover:bg-red-100 dark:hover:bg-red-950">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create & Edit Dialogs */}
      {[
        { open: showCreateDialog, setOpen: setShowCreateDialog, title: "Ajouter un Influenceur / Sponsor", onSubmit: handleCreate, loading: createMutation.isPending },
        { open: showEditDialog, setOpen: setShowEditDialog, title: "Modifier l'Influenceur / Sponsor", onSubmit: handleUpdate, loading: updateMutation.isPending },
      ].map((dlg, i) => (
        <Dialog key={i} open={dlg.open} onOpenChange={dlg.setOpen}>
          <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/50 dark:border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl">{dlg.title}</DialogTitle>
              <DialogDescription>Renseignez les informations de l'influenceur ou sponsor</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'influenceur ou sponsor"
                  className="rounded-2xl"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as InfluencerType }))}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="influencer">Influenceur</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <Label>Photo / Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.photo && (
                    <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-zinc-800">
                      <AvatarImage src={formData.photo} />
                    </Avatar>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-2xl">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Envoi en cours..." : "Uploader une photo"}
                  </Button>
                </div>
              </div>

              {/* Solidarity Message */}
              <div className="space-y-2">
                <Label>Message de solidarité</Label>
                <Textarea
                  value={formData.solidarityMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, solidarityMessage: e.target.value }))}
                  placeholder="Message optionnel de soutien à la communauté..."
                  rows={4}
                  className="rounded-3xl resize-y"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label>Réseaux sociaux</Label>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    <Input value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/..." className="rounded-2xl" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Youtube className="h-5 w-5 text-red-500" />
                    <Input value={socialYoutube} onChange={e => setSocialYoutube(e.target.value)} placeholder="https://youtube.com/..." className="rounded-2xl" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">𝕏</span>
                    <Input value={socialTwitter} onChange={e => setSocialTwitter(e.target.value)} placeholder="https://x.com/..." className="rounded-2xl" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">♪</span>
                    <Input value={socialTiktok} onChange={e => setSocialTiktok(e.target.value)} placeholder="https://tiktok.com/..." className="rounded-2xl" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <Input value={socialWebsite} onChange={e => setSocialWebsite(e.target.value)} placeholder="https://example.com" className="rounded-2xl" />
                  </div>
                </div>
              </div>

              {/* Approval */}
              <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-800/50 p-4 rounded-3xl">
                <input
                  type="checkbox"
                  id="isApproved"
                  checked={formData.isApproved}
                  onChange={(e) => setFormData(prev => ({ ...prev, isApproved: e.target.checked }))}
                  className="h-5 w-5 accent-rose-500"
                />
                <Label htmlFor="isApproved" className="cursor-pointer">Approuvé (visible publiquement sur le site)</Label>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => dlg.setOpen(false)} className="rounded-2xl">Annuler</Button>
              <Button onClick={dlg.onSubmit} disabled={!formData.name || dlg.loading} className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600">
                {dlg.loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

      {/* Delete Alert */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet influenceur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les liens avec les cas seront également supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-2xl"
              onClick={() => selectedId && deleteMutation.mutate({ id: selectedId })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Cases Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Associer à des cas</DialogTitle>
            <DialogDescription>Gérez les liens entre cet influenceur et les cas solidaires</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Linked Cases */}
            <div>
              <h4 className="font-medium mb-3 text-sm uppercase tracking-widest text-muted-foreground">Cas actuellement liés</h4>
              {linkedCases.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun cas lié pour le moment</p>
              ) : (
                <div className="space-y-2">
                  {linkedCases.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between bg-white/70 dark:bg-zinc-800/70 p-4 rounded-2xl">
                      <span className="font-medium">{c.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectedId && unlinkMutation.mutate({ influencerId: selectedId, caseId: c.id })}
                        className="text-destructive hover:bg-red-100 dark:hover:bg-red-950"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Link */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3 text-sm uppercase tracking-widest text-muted-foreground">Ajouter un nouveau cas</h4>
              <div className="flex gap-3">
                <Select value={linkCaseId} onValueChange={setLinkCaseId}>
                  <SelectTrigger className="rounded-2xl flex-1">
                    <SelectValue placeholder="Sélectionner un cas" />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedCases.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedId && linkCaseId && linkMutation.mutate({ influencerId: selectedId, caseId: parseInt(linkCaseId) })}
                  disabled={!linkCaseId || linkMutation.isPending}
                  className="rounded-2xl"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Lier
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)} className="rounded-2xl">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}