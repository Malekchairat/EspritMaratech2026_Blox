import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import {
  Heart, Users, BarChart3, CheckCircle, XCircle,
  AlertCircle, Shield, Star, Pencil, Trash2, Search,
  ChevronDown, ChevronUp, Save, X, FileText,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/TranslatedText";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const { data: allCases, isLoading: casesLoading } = trpc.cases.list.useQuery({ includeAll: true });
  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, { retry: false });

  const updateStatusMutation = trpc.admin.updateCaseStatus.useMutation();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  const deleteCaseMutation = trpc.admin.deleteCase.useMutation();
  const updateCaseMutation = trpc.admin.updateCaseAdmin.useMutation();
  const utils = trpc.useUtils();

  const [caseSearch, setCaseSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string; description: string; targetAmount: string; isUrgent: boolean; category: string;
  }>({ title: "", description: "", targetAmount: "", isUrgent: false, category: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50 dark:from-zinc-950 dark:to-zinc-950">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("common.accessDenied")}</h2>
          <p className="text-muted-foreground mb-6">{t("admin.onlyAdmins")}</p>
          <Button asChild>
            <Link href="/">{t("common.backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingCases = allCases?.filter(c => c.status === "pending") ?? [];
  const approvedCases = allCases?.filter(c => c.status === "approved") ?? [];

  const handleStatusChange = async (caseId: number, status: "approved" | "rejected") => {
    try {
      await updateStatusMutation.mutateAsync({ caseId, status });
      toast.success(status === "approved" ? t("admin.caseApproved") : t("admin.caseRejected"));
      await utils.cases.list.invalidate();
      await utils.admin.listUsers.invalidate();
    } catch {
      toast.error(t("admin.updateError"));
    }
  };

  const handleRoleChange = async (userId: number, role: "donor" | "association" | "admin") => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
      toast.success(t("admin.roleUpdated"));
      await utils.admin.listUsers.invalidate();
    } catch {
      toast.error(t("admin.roleUpdateError"));
    }
  };

  const handleDeleteCase = async (caseId: number) => {
    try {
      await deleteCaseMutation.mutateAsync({ caseId });
      toast.success("Cas supprimé avec succès");
      setConfirmDeleteId(null);
      await utils.cases.list.invalidate();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const startEdit = (c: { id: number; title: string; description: string; targetAmount: number; isUrgent: boolean; category: string }) => {
    setEditingCaseId(c.id);
    setEditForm({ title: c.title, description: c.description, targetAmount: String(c.targetAmount), isUrgent: c.isUrgent, category: c.category });
  };

  const handleSaveEdit = async () => {
    if (!editingCaseId) return;
    try {
      await updateCaseMutation.mutateAsync({
        caseId: editingCaseId,
        title: editForm.title,
        description: editForm.description,
        targetAmount: parseInt(editForm.targetAmount) || 0,
        isUrgent: editForm.isUrgent,
        category: editForm.category as any,
      });
      toast.success("Cas mis à jour avec succès");
      setEditingCaseId(null);
      await utils.cases.list.invalidate();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  };

  const filteredCases = (allCases ?? []).filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(caseSearch.toLowerCase());
    const matchesFilter = caseFilter === "all" || c.status === caseFilter;
    return matchesSearch && matchesFilter;
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      association: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      donor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={variants[role] || ""}>{t(`roles.${role}`)}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-10">
        <div className="container max-w-7xl mx-auto px-6 space-y-10">
          {/* Hero Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 py-2 rounded-2xl mb-4 shadow">
              <Heart className="h-8 w-8 text-rose-500" fill="currentColor" />
              <span className="text-xl font-semibold text-foreground">Administration</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-foreground">
              Tableau de bord Admin
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-md">
              Gérez les cas, les utilisateurs et l’impact de votre communauté
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-foreground">{allCases?.length ?? 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">{t("admin.totalCases")}</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-rose-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-yellow-600">{pendingCases.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">{t("admin.pending")}</p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-green-600">{approvedCases.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">{t("admin.approved")}</p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-blue-600">{allUsers?.length ?? 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">{t("admin.users")}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Cases */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <AlertCircle className="h-7 w-7 text-yellow-500" />
                {t("admin.pendingApproval")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("admin.pendingApprovalDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {casesLoading ? (
                <p className="text-muted-foreground py-8 text-center">{t("common.loading")}</p>
              ) : pendingCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  {t("admin.noPending")}
                </div>
              ) : (
                <div className="space-y-5">
                  {pendingCases.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col md:flex-row md:items-start justify-between gap-5 p-6 border rounded-3xl bg-white/70 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-lg truncate">
                            <TranslatedText text={c.title} />
                          </h3>
                          {c.isUrgent && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mb-4">
                          <TranslatedText text={c.description} />
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{t(`categories.${c.category}`)}</Badge>
                          <span className="text-sm text-muted-foreground self-center">
                            {c.targetAmount.toLocaleString()} {t("common.currency")}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 md:justify-end shrink-0">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/edit-case/${c.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t("editCase.editButton")}
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusChange(c.id, "approved")}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("admin.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(c.id, "rejected")}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("admin.reject")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-7 w-7 text-blue-500" />
                {t("admin.userManagement")}
              </CardTitle>
              <CardDescription>{t("admin.userManagementDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  {allUsers?.length ?? 0} {t("admin.users")}
                </p>
                <Button asChild>
                  <Link href="/dashboard/admin/users">
                    {t("admin.manageUsers", "Gérer les utilisateurs")}
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {allUsers?.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-5 border rounded-2xl bg-white/60 dark:bg-zinc-950/60 hover:bg-white dark:hover:bg-zinc-900 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                        {u.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold">{u.name || t("common.noName")}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div>{getRoleBadge(u.role)}</div>
                  </div>
                ))}

                {allUsers && allUsers.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-4">
                    +{allUsers.length - 5} autres utilisateurs
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cases Management */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <FileText className="h-7 w-7 text-rose-500" />
                Gestion des cas
              </CardTitle>
              <CardDescription>Modifier ou supprimer tous les cas existants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Rechercher un cas..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setCaseFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        caseFilter === f
                          ? "bg-rose-500 text-white shadow"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : "Refusés"}
                      {" "}
                      <span className="opacity-70">
                        ({f === "all" ? (allCases?.length ?? 0) : (allCases?.filter(c => c.status === f).length ?? 0)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cases List */}
              {casesLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Aucun cas trouvé</div>
              ) : (
                <div className="space-y-3">
                  {filteredCases.map((c) => (
                    <div key={c.id} className="border rounded-2xl bg-white/60 dark:bg-zinc-950/60 overflow-hidden">
                      {/* Row */}
                      <div className="flex items-start gap-4 p-4">
                        {c.coverImage && (
                          <img src={c.coverImage} alt="" className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={`text-xs border-0 ${statusColors[c.status] ?? ""}`}>{c.status}</Badge>
                            <Badge variant="outline" className="text-xs">{t(`categories.${c.category}`)}</Badge>
                            {c.isUrgent && <Badge className="text-xs bg-rose-500 text-white border-0">Urgent</Badge>}
                          </div>
                          <p className="font-semibold text-sm truncate">
                            <TranslatedText text={c.title} />
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Objectif: {c.targetAmount.toLocaleString()} {t("common.currency")} · Collecté: {c.currentAmount.toLocaleString()} {t("common.currency")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-8 px-2"
                            onClick={() => editingCaseId === c.id ? setEditingCaseId(null) : startEdit(c)}
                          >
                            {editingCaseId === c.id ? <ChevronUp className="h-4 w-4" /> : <><Pencil className="h-3.5 w-3.5 mr-1" />Modifier</>}
                          </Button>
                          {confirmDeleteId === c.id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="destructive" className="h-8 rounded-xl px-2 text-xs" onClick={() => handleDeleteCase(c.id)} disabled={deleteCaseMutation.isPending}>
                                Confirmer
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 rounded-xl px-2" onClick={() => setConfirmDeleteId(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl" onClick={() => setConfirmDeleteId(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Edit form — inline expand */}
                      {editingCaseId === c.id && (
                        <div className="border-t px-4 py-4 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Titre</Label>
                              <Input value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} className="h-9 rounded-xl text-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Objectif (TND)</Label>
                              <Input type="number" value={editForm.targetAmount} onChange={(e) => setEditForm(p => ({ ...p, targetAmount: e.target.value }))} className="h-9 rounded-xl text-sm" />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">Description</Label>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                                rows={3}
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Catégorie</Label>
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))}
                                className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                {["health","disability","children","education","renovation","emergency"].map(cat => (
                                  <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                              <input type="checkbox" id={`urgent-${c.id}`} checked={editForm.isUrgent} onChange={(e) => setEditForm(p => ({ ...p, isUrgent: e.target.checked }))} className="h-4 w-4 rounded" />
                              <Label htmlFor={`urgent-${c.id}`} className="text-sm cursor-pointer">Urgent</Label>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditingCaseId(null)}>
                              <X className="h-4 w-4 mr-1" /> Annuler
                            </Button>
                            <Button size="sm" className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white border-0" onClick={handleSaveEdit} disabled={updateCaseMutation.isPending}>
                              <Save className="h-4 w-4 mr-1" /> Enregistrer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Influencer / Sponsor Section */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Star className="h-7 w-7 text-amber-500" />
                {t("influencer.management", "Gestion des Influenceurs / Sponsors")}
              </CardTitle>
              <CardDescription>
                {t("influencer.managementDesc", "Gérez les influenceurs et sponsors solidaires liés aux cas")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild className="rounded-2xl">
                <Link href="/dashboard/admin/influencers">
                  {t("influencer.manageInfluencers", "Gérer les influenceurs")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}