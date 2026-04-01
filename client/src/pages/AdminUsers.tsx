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
  Search,
  Shield,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type UserRole = "donor" | "association" | "admin";

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  bio: string;
}

const emptyForm: UserFormData = {
  name: "",
  email: "",
  role: "donor",
  phone: "",
  bio: "",
};

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { theme, toggleTheme } = useTheme();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);

  const { data: allUsers, isLoading } = trpc.admin.listUsers.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();

  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success(t("admin.userCreated", "Utilisateur créé avec succès"));
      utils.admin.listUsers.invalidate();
      setCreateOpen(false);
      setFormData(emptyForm);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success(t("admin.userUpdated", "Utilisateur mis à jour avec succès"));
      utils.admin.listUsers.invalidate();
      setEditOpen(false);
      setFormData(emptyForm);
      setSelectedUserId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success(t("admin.userDeleted", "Utilisateur supprimé avec succès"));
      utils.admin.listUsers.invalidate();
      setDeleteOpen(false);
      setSelectedUserId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("common.accessDenied")}</h2>
          <Button asChild>
            <Link href="/">{t("common.backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const filteredUsers = (allUsers ?? []).filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      association: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      donor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={variants[role] || ""}>{t(`roles.${role}`, role)}</Badge>;
  };

  const openEdit = (u: { id: number; name: string | null; email: string | null; role: string }) => {
    setSelectedUserId(u.id);
    setFormData({
      name: u.name || "",
      email: u.email || "",
      role: u.role as UserRole,
      phone: "",
      bio: "",
    });
    setEditOpen(true);
  };

  const openDelete = (userId: number) => {
    setSelectedUserId(userId);
    setDeleteOpen(true);
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedUserId) return;
    updateMutation.mutate({
      userId: selectedUserId,
      name: formData.name || undefined,
      email: formData.email || undefined,
      role: formData.role,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedUserId) return;
    deleteMutation.mutate({ userId: selectedUserId });
  };

  const userForm = (
    <div className="grid gap-6 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nom complet</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nom complet"
          className="rounded-2xl"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          className="rounded-2xl"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="role">Rôle</Label>
        <Select
          value={formData.role}
          onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
        >
          <SelectTrigger className="rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="donor">Donateur</SelectItem>
            <SelectItem value="association">Association</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+216 XX XXX XXX"
          className="rounded-2xl"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio / Description</Label>
        <Input
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Description courte..."
          className="rounded-2xl"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm">
        <div className="container flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/dashboard/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow">
                <Users className="h-8 w-8 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
                <p className="text-sm text-muted-foreground">Administrer les membres de la communauté</p>
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
            <div className="hidden sm:block text-sm text-muted-foreground pl-4 border-l">
              {user?.name}
            </div>
            <Button variant="outline" onClick={logout} className="rounded-2xl">
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container max-w-7xl mx-auto px-6 space-y-10">
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 rounded-2xl"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-12 w-full sm:w-52 rounded-2xl">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="donor">Donateur</SelectItem>
                  <SelectItem value="association">Association</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setFormData(emptyForm);
                setCreateOpen(true);
              }}
              size="lg"
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 shadow-lg h-12 px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter un utilisateur
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-5xl font-bold text-foreground">{allUsers?.length ?? 0}</div>
                <p className="text-muted-foreground mt-2">Utilisateurs totaux</p>
              </CardContent>
            </Card>
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-5xl font-bold text-blue-600">
                  {allUsers?.filter((u) => u.role === "association").length ?? 0}
                </div>
                <p className="text-muted-foreground mt-2">Associations</p>
              </CardContent>
            </Card>
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-5xl font-bold text-green-600">
                  {allUsers?.filter((u) => u.role === "donor").length ?? 0}
                </div>
                <p className="text-muted-foreground mt-2">Donateurs</p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-7 w-7 text-blue-500" />
                Liste des Utilisateurs
              </CardTitle>
              <CardDescription className="text-base">
                Gérez les utilisateurs, modifiez les rôles et supprimez des comptes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-16 text-muted-foreground">Chargement des utilisateurs...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-16 text-muted-foreground">Aucun utilisateur trouvé</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-white/50 dark:border-white/10">
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-white/70 dark:hover:bg-zinc-950/70 transition-all">
                          <TableCell className="font-mono text-sm text-muted-foreground">{u.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {u.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="font-medium">{u.name || "Sans nom"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(u)}
                                className="hover:bg-rose-100 dark:hover:bg-rose-950"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {u.id !== user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDelete(u.id)}
                                  className="hover:bg-red-100 dark:hover:bg-red-950 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create & Edit Dialogs */}
      {[
        { open: createOpen, setOpen: setCreateOpen, title: "Ajouter un utilisateur", onSubmit: handleCreate, loading: createMutation.isPending, buttonText: "Créer l'utilisateur" },
        { open: editOpen, setOpen: setEditOpen, title: "Modifier l'utilisateur", onSubmit: handleUpdate, loading: updateMutation.isPending, buttonText: "Enregistrer les modifications" },
      ].map((dlg, index) => (
        <Dialog key={index} open={dlg.open} onOpenChange={dlg.setOpen}>
          <DialogContent className="max-w-md rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/50">
            <DialogHeader>
              <DialogTitle className="text-2xl">{dlg.title}</DialogTitle>
              <DialogDescription>
                {index === 0 ? "Créer un nouveau compte utilisateur" : "Modifier les informations de l'utilisateur"}
              </DialogDescription>
            </DialogHeader>
            {userForm}
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => dlg.setOpen(false)} className="rounded-2xl">
                Annuler
              </Button>
              <Button onClick={dlg.onSubmit} disabled={dlg.loading} className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600">
                {dlg.loading ? "Enregistrement..." : dlg.buttonText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-2xl"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}