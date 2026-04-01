import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Loader2,
  Moon,
  Save,
  ScanFace,
  Shield,
  Sun,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FaceCamera } from "@/components/FaceCamera";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";

export default function Profile() {
  const { t } = useTranslation();
  const { user, loading, isAuthenticated, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [validFields, setValidFields] = useState({ name: false, phone: false });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, uppercase: false, lowercase: false, digit: false, special: false,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceCreatedAt, setFaceCreatedAt] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceCameraOpen, setFaceCameraOpen] = useState(false);

  const loadFaceStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/face/status");
      if (res.ok) {
        const data = await res.json();
        setFaceRegistered(data.registered);
        setFaceCreatedAt(data.createdAt);
      }
    } catch {}
  }, []);

  useEffect(() => { if (isAuthenticated) loadFaceStatus(); }, [isAuthenticated, loadFaceStatus]);
  useEffect(() => {
    if (user) { setName(user.name || ""); setPhone(user.phone || ""); setBio(user.bio || ""); setIsDirty(false); }
  }, [user]);
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success(t("profile.profileUpdated")); setIsDirty(false); refresh(); },
    onError: (error) => { toast.error(error.message || t("profile.updateError")); },
  });

  const changePasswordMutation = trpc.profile.changePassword.useMutation({
    onSuccess: () => { toast.success(t("profile.passwordChanged")); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); },
    onError: (error) => { toast.error(error.message || t("profile.updateError")); },
  });

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: name || undefined, phone: phone || null, bio: bio || null });
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error(t("profile.passwordMismatch")); return; }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const updatePasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    });
  };

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setter(value);
    setIsDirty(true);
    if (field === "name") setValidFields((p) => ({ ...p, name: value.trim().length >= 2 }));
    else if (field === "phone") {
      const phoneRegex = /^(\+216)?[0-9]{8}$/;
      setValidFields((p) => ({ ...p, phone: !value || phoneRegex.test(value.replace(/\s/g, "")) }));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      updateProfileMutation.mutate({ avatar: url });
    } catch { toast.error(t("profile.updateError")); }
    finally { setAvatarUploading(false); if (avatarInputRef.current) avatarInputRef.current.value = ""; }
  };

  const handleFaceCapture = useCallback(async (descriptor: number[]) => {
    setFaceLoading(true);
    setFaceCameraOpen(false);
    try {
      const res = await fetch("/api/auth/face/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor, label: "Mon visage" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) { toast.error("Ce visage est déjà enregistré pour un autre compte."); return; }
        toast.error(data.error || "Enregistrement échoué."); return;
      }
      toast.success("Reconnaissance faciale configurée avec succès !");
      loadFaceStatus();
    } catch { toast.error("Erreur lors de l'enregistrement."); }
    finally { setFaceLoading(false); }
  }, [loadFaceStatus]);

  const handleDeleteFace = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/face/delete", { method: "DELETE" });
      if (res.ok) { toast.success("Reconnaissance faciale supprimée."); setFaceRegistered(false); setFaceCreatedAt(null); }
      else toast.error("Erreur lors de la suppression.");
    } catch { toast.error("Erreur de connexion."); }
  }, []);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };
  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin": return "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-700 dark:text-red-300 border border-red-300/50 dark:border-red-700/50";
      case "association": return "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/50 dark:border-purple-700/50";
      default: return "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-700/50";
    }
  };

  // ── Shared token classes (mirrors AssociationProfile card system) ──
  const sectionCard = "rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl";
  const inputCls = "h-12 rounded-2xl bg-white/70 dark:bg-zinc-800/70 border-white/60 dark:border-zinc-700/60 focus-visible:ring-rose-500/40";
  const primaryBtn = "h-12 rounded-2xl font-semibold bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg shadow-rose-500/20 transition-all duration-200";
  const sectionIcon = (colorCls: string) => `p-2.5 rounded-xl bg-gradient-to-br ${colorCls} border`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl border border-white/50 dark:border-white/10">
            <Heart className="h-10 w-10 text-rose-500 animate-pulse" fill="currentColor" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isEmailAccount = user.loginMethod === "email";
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;
  const strengthColor = strengthScore <= 1 ? "from-rose-400 to-rose-500" : strengthScore <= 2 ? "from-orange-400 to-orange-500" : strengthScore <= 3 ? "from-yellow-400 to-yellow-500" : "from-emerald-400 to-teal-500";
  const strengthLabel = strengthScore <= 1 ? "Très faible" : strengthScore <= 2 ? "Faible" : strengthScore <= 3 ? "Moyen" : "Fort";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">

      {/* ── Sticky Header — mirrors AssociationProfile exactly ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2.5">
              <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
              <span className="font-semibold text-xl tracking-tight">Mon Profil</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <LanguageSwitcher />
            <AccessibilityMenu />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-16">

        {/* ── Hero Profile Card — negative overlap like AssociationProfile ── */}
        <div className={`relative -mt-px mb-8 ${sectionCard} p-8 sm:p-10`}>
          {/* Top gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500" />

          <div className="flex flex-col md:flex-row gap-8 items-start mt-2">
            {/* Avatar — large ring style like AssociationProfile */}
            <div className="relative group flex-shrink-0">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 shadow-xl shadow-rose-500/20">
                <Avatar
                  className="h-28 w-28 sm:h-36 sm:w-36 cursor-pointer border-4 border-white dark:border-zinc-900"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name || ""} />}
                  <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-950 dark:to-purple-950 text-rose-600 dark:text-rose-400">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Streak badge */}
              {user?.streakCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-white dark:bg-zinc-900 rounded-full px-2 py-0.5 text-xs font-bold shadow-lg border border-orange-200 dark:border-orange-800 z-10"
                  style={{ color: "#ef4444" }}
                >
                  🔥{user.streakCount}
                </span>
              )}
              {/* Hover camera overlay */}
              <div
                className="absolute inset-1.5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUploading
                  ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                  : <Camera className="h-7 w-7 text-white" />
                }
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* User info + stats — mirrors AssociationProfile layout */}
            <div className="flex-1 space-y-6 pt-2">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-4xl font-bold tracking-tighter">{user.name || t("common.noName")}</h1>
                  <Badge className={`${getRoleBadgeStyle(user.role)} text-sm px-4 py-1 rounded-full font-semibold`}>
                    {t(`profile.roles.${user.role}`)}
                  </Badge>
                </div>
                <p className="mt-2 text-base text-muted-foreground">{user.email}</p>
                {user.bio && (
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl">{user.bio}</p>
                )}
              </div>

              {/* Stats row — matches AssociationProfile grid exactly */}
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/60 dark:border-zinc-700/40">
                  <div className="text-3xl font-bold text-foreground">
                    {user?.streakCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    🔥 Série
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/60 dark:border-zinc-700/40">
                  <div className="text-3xl font-bold text-foreground">{(user as any).donationCount || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Dons</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/60 dark:border-zinc-700/40">
                  <div className="text-3xl font-bold text-foreground">{(user as any).followingCount || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Abonnements</div>
                </div>
              </div>

              {/* Member since pill — mirrors AssociationProfile badge style */}
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-white/50 dark:border-zinc-700/50 px-4 py-2 rounded-full text-sm text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 text-rose-400" fill="currentColor" />
                  Membre depuis {formatDate(user.createdAt)}
                </div>
                {faceRegistered && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-full text-sm text-emerald-700 dark:text-emerald-300">
                    <ScanFace className="h-3.5 w-3.5" />
                    Face ID actif
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section divider — same as AssociationProfile ── */}
        <div className="flex items-center justify-center gap-3 my-8">
          <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
          <span className="uppercase tracking-widest text-xs font-semibold text-muted-foreground">
            Paramètres du compte
          </span>
        </div>

        {/* ── Cards stack ── */}
        <div className="space-y-6">

          {/* ── Personal Information ── */}
          <div className={sectionCard}>
            <div className="px-8 pt-8 pb-0 flex items-center gap-4">
              <div className={`${sectionIcon("from-rose-500/10 to-purple-500/10 border-rose-200/50 dark:border-rose-800/30")}`}>
                <UserIcon className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{t("profile.personalInfo")}</h2>
                <p className="text-sm text-muted-foreground">{t("profile.personalInfoDesc")}</p>
              </div>
            </div>

            <div className="px-8 py-6">
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center justify-between">
                    <span>{t("profile.name")}</span>
                    {validFields.name && name && (
                      <span className="text-emerald-500 text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valide
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="name" value={name}
                      onChange={handleFieldChange(setName, "name")}
                      placeholder={t("profile.namePlaceholder")}
                      className={`${inputCls} ${validFields.name && name ? "border-emerald-400 focus-visible:ring-emerald-400/40 pr-10" : ""}`}
                    />
                    {validFields.name && name && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </div>

                {/* Email read-only */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t("profile.email")}</Label>
                  <Input value={user.email || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center justify-between">
                    <span>{t("profile.phone")}</span>
                    {validFields.phone && phone && (
                      <span className="text-emerald-500 text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valide
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone" value={phone} type="tel"
                      onChange={handleFieldChange(setPhone, "phone")}
                      placeholder={t("profile.phonePlaceholder")}
                      className={`${inputCls} ${validFields.phone && phone ? "border-emerald-400 focus-visible:ring-emerald-400/40 pr-10" : ""}`}
                    />
                    {validFields.phone && phone && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-sm font-medium">{t("profile.bio")}</Label>
                  <textarea
                    id="bio" value={bio} rows={4}
                    onChange={handleFieldChange(setBio, "bio")}
                    placeholder={t("profile.bioPlaceholder")}
                    className="flex w-full rounded-2xl border border-white/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/70 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 resize-none transition-all"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!isDirty || updateProfileMutation.isPending}
                    className={`${primaryBtn} px-8 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {updateProfileMutation.isPending
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("profile.saving")}</>
                      : <><Save className="h-4 w-4 mr-2" />{t("common.save")}</>
                    }
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Account Information ── */}
          <div className={sectionCard}>
            <div className="px-8 pt-8 pb-0 flex items-center gap-4">
              <div className={`${sectionIcon("from-purple-500/10 to-indigo-500/10 border-purple-200/50 dark:border-purple-800/30")}`}>
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{t("profile.accountInfo")}</h2>
                <p className="text-sm text-muted-foreground">{t("profile.accountInfoDesc")}</p>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Shield className="h-4 w-4 text-rose-500" />,
                    label: t("profile.role"),
                    value: (
                      <Badge className={`${getRoleBadgeStyle(user.role)} text-xs font-semibold px-3 py-0.5 rounded-full mt-0.5`}>
                        {t(`profile.roles.${user.role}`)}
                      </Badge>
                    ),
                  },
                  {
                    icon: <KeyRound className="h-4 w-4 text-purple-500" />,
                    label: t("profile.loginMethod"),
                    value: <span className="font-semibold capitalize text-sm">{user.loginMethod || "—"}</span>,
                  },
                  {
                    icon: <Calendar className="h-4 w-4 text-rose-400" />,
                    label: t("profile.memberSince"),
                    value: <span className="font-semibold text-sm">{formatDate(user.createdAt)}</span>,
                  },
                  {
                    icon: <Clock className="h-4 w-4 text-purple-400" />,
                    label: t("profile.lastLogin"),
                    value: <span className="font-semibold text-sm">{formatDateTime(user.lastSignedIn)}</span>,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-white/50 dark:bg-zinc-800/40 border border-white/60 dark:border-zinc-700/40 hover:bg-white/70 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <div className="mt-0.5 p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 shadow-sm border border-white/50 dark:border-zinc-700/50">
                      {item.icon}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Security / Password ── */}
          <div className={sectionCard}>
            <div className="px-8 pt-8 pb-0 flex items-center gap-4">
              <div className={`${sectionIcon("from-rose-500/10 to-orange-500/10 border-rose-200/50 dark:border-rose-800/30")}`}>
                <KeyRound className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{t("profile.security")}</h2>
                <p className="text-sm text-muted-foreground">{t("profile.securityDesc")}</p>
              </div>
            </div>

            <div className="px-8 py-6">
              {isEmailAccount ? (
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  {/* Current password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">{t("profile.currentPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-sm font-medium">{t("profile.newPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); updatePasswordStrength(e.target.value); }}
                        placeholder="••••••••"
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength indicator */}
                    {newPassword && (
                      <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-zinc-700/50 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Force du mot de passe</p>
                          <span className={`text-xs font-bold bg-gradient-to-r ${strengthColor} bg-clip-text text-transparent`}>
                            {strengthLabel}
                          </span>
                        </div>
                        {/* Progress bar segments */}
                        <div className="flex gap-1.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strengthScore ? `bg-gradient-to-r ${strengthColor}` : "bg-muted-foreground/15"}`}
                            />
                          ))}
                        </div>
                        {/* Requirement checks */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { key: "length", label: "8+ caractères" },
                            { key: "uppercase", label: "Majuscule" },
                            { key: "lowercase", label: "Minuscule" },
                            { key: "digit", label: "Chiffre" },
                          ].map(({ key, label }) => {
                            const ok = passwordStrength[key as keyof typeof passwordStrength];
                            return (
                              <div key={key} className={`flex items-center gap-2 transition-colors ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${ok ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-500" : "border-muted-foreground/30"}`}>
                                  {ok && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <span>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center justify-between">
                      <span>{t("profile.confirmPassword")}</span>
                      {confirmPassword && newPassword === confirmPassword && (
                        <span className="text-emerald-500 text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Identiques
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputCls} ${
                          confirmPassword && newPassword === confirmPassword
                            ? "border-emerald-400 focus-visible:ring-emerald-400/40 pr-10"
                            : confirmPassword && newPassword !== confirmPassword
                            ? "border-rose-400 focus-visible:ring-rose-400/40"
                            : ""
                        }`}
                      />
                      {confirmPassword && newPassword === confirmPassword && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-rose-500 flex items-center gap-1.5 mt-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {t("profile.passwordMismatch")}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || changePasswordMutation.isPending}
                      className={`${primaryBtn} px-8 disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {changePasswordMutation.isPending
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("profile.saving")}</>
                        : <><KeyRound className="h-4 w-4 mr-2" />{t("profile.changePassword")}</>
                      }
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/50 dark:bg-zinc-800/40 border border-white/60 dark:border-zinc-700/40">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("profile.oauthPasswordNote")}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Face Recognition ── */}
          <div className={sectionCard}>
            <div className="px-8 pt-8 pb-0 flex items-center gap-4">
              <div className={`${sectionIcon("from-purple-500/10 to-rose-500/10 border-purple-200/50 dark:border-purple-800/30")}`}>
                <ScanFace className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">Reconnaissance faciale</h2>
                <p className="text-sm text-muted-foreground">Connectez-vous instantanément via la caméra de votre PC.</p>
              </div>
            </div>

            <div className="px-8 py-6">
              {faceRegistered ? (
                <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50">
                      <ScanFace className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Reconnaissance faciale active</p>
                      {faceCreatedAt && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Configuré le {new Date(faceCreatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFaceCameraOpen(true)}
                      disabled={faceLoading}
                      className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Recalibrer
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={handleDeleteFace}
                      className="rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-10 px-6 rounded-2xl border-2 border-dashed border-purple-200/60 dark:border-purple-700/30 bg-gradient-to-br from-rose-50/40 to-purple-50/40 dark:from-rose-950/10 dark:to-purple-950/10">
                  <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 shadow-lg border border-white/60 dark:border-zinc-700/40">
                    <ScanFace className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-base font-semibold">Aucune reconnaissance faciale configurée</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Configurez votre visage pour vous connecter rapidement via la caméra.
                    </p>
                  </div>
                  <Button
                    onClick={() => setFaceCameraOpen(true)}
                    disabled={faceLoading}
                    className={`${primaryBtn} px-8`}
                  >
                    {faceLoading
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />En cours...</>
                      : <><Camera className="h-4 w-4 mr-2" />Configurer la reconnaissance faciale</>
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Face Camera Dialog */}
      <FaceCamera
        open={faceCameraOpen}
        onClose={() => setFaceCameraOpen(false)}
        onCapture={handleFaceCapture}
      />

      {/* Footer — mirrors AssociationProfile separator style */}
      <footer className="border-t border-white/30 dark:border-white/5 py-6 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Heart className="h-3.5 w-3.5 text-rose-400" fill="currentColor" />
          {t("common.footer")}
        </div>
      </footer>
    </div>
  );
}