import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Camera, ScanFace, Upload, UserCircle, Building2 } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { validateEmail, validatePassword, validateName, getPasswordStrength } from "@/lib/validation";
import { FaceCamera } from "@/components/FaceCamera";

export default function Register() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const updateProfileMutation = trpc.profile.update.useMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("donor");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Face recognition post-registration state
  const [showFaceIdSetup, setShowFaceIdSetup] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<string>("donor");
  const [faceCameraOpen, setFaceCameraOpen] = useState(false);

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  // Password requirements checklist
  const pwChecks = useMemo(() => [
    { key: "length", ok: password.length >= 8, label: t("validation.password.min8Chars") },
    { key: "upper", ok: /[A-Z]/.test(password), label: t("validation.password.hasUppercase") },
    { key: "lower", ok: /[a-z]/.test(password), label: t("validation.password.hasLowercase") },
    { key: "digit", ok: /[0-9]/.test(password), label: t("validation.password.hasDigit") },
    { key: "special", ok: /[^A-Za-z0-9]/.test(password), label: t("validation.password.hasSpecial") },
  ], [password, t]);

  const redirectToDashboard = (roleVal: string) => {
    const path = roleVal === "admin" ? "/dashboard/admin"
      : roleVal === "association" ? "/dashboard/association"
      : "/";
    navigate(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors: Record<string, string> = {};

    // Validate all fields
    const nameErr = validateName(name);
    if (nameErr) errors.name = t(`validation.name.${nameErr}`);

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = t(`validation.email.${emailErr}`);

    const pwErr = validatePassword(password);
    if (pwErr) errors.password = t(`validation.password.${pwErr}`);

    if (!confirmPassword) {
      errors.confirmPassword = t("validation.password.required");
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t("auth.passwordMismatch");
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.error });
        } else {
          setError(data.error || t("auth.errorRegister"));
        }
        return;
      }

      // Upload avatar if selected
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append("image", avatarFile);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "same-origin",
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              await updateProfileMutation.mutateAsync({ avatar: uploadData.url });
            }
          }
        } catch {
          // Non-critical
        }
      }

      await utils.auth.me.invalidate();

      // Show Face ID setup step
      setRegisteredRole(data.user?.role || role);
      setShowFaceIdSetup(true);
      setLoading(false);
      return;
    } catch {
      setError(t("auth.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  const handleSetupFaceId = async (descriptor: number[]) => {
    setFaceCameraOpen(false);
    setFaceIdLoading(true);
    try {
      const response = await fetch("/api/auth/face/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ descriptor, label: "Mon visage" }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          setError(t("auth.faceAlreadyRegistered") || "Ce visage est déjà enregistré pour un autre compte");
          return;
        }
        setError(data.error || t("auth.errorServer"));
        return;
      }

      redirectToDashboard(registeredRole);
    } catch {
      setError(t("auth.errorServer"));
    } finally {
      setFaceIdLoading(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((p) => ({ ...p, [field]: "" }));
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-red-500";
    if (score === 1) return "bg-orange-500";
    if (score === 2) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Left Side - Charity Image */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/40 via-purple-600/30 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433"
          alt="Charity community helping hands"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 max-w-md text-center px-10 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/90 dark:bg-zinc-900/90 p-4 rounded-3xl shadow-xl">
              <Heart className="h-16 w-16 text-rose-500" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter mb-4">
            {t("common.appName")}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Rejoignez une communauté qui change des vies
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-sm">
            <span className="text-rose-300">❤️</span>
            Chaque adhésion compte
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-4">
          {/* Skip link */}
          <a
            href="#register-form"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Aller au formulaire d'inscription
          </a>

          {/* Language Switcher */}
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* Mobile branding (visible only on small screens) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-4">
            <Heart className="h-14 w-14 text-rose-500 mb-4" fill="currentColor" />
            <h1 className="text-4xl font-bold tracking-tighter">{t("common.appName")}</h1>
          </div>

        <Card className="border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl">
          {showFaceIdSetup ? (
            /* ── Face Recognition Setup Step ── */
            <>
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/20 animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Compte créé avec succès !</CardTitle>
                  <CardDescription className="text-base">
                    Configurez la reconnaissance faciale pour un accès instantané et sécurisé
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-4 hover:border-primary/60 transition-colors">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ScanFace className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">Reconnaissance faciale</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Utilisez votre caméra pour un accès rapide et sécurisé lors de vos prochaines connexions
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full h-11 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => setFaceCameraOpen(true)}
                  disabled={faceIdLoading}
                  aria-label="Configurer la reconnaissance faciale"
                >
                  {faceIdLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ScanFace className="h-5 w-5" aria-hidden="true" />
                  )}
                  {faceIdLoading ? "Configuration..." : "Configurer maintenant"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => redirectToDashboard(registeredRole)}
                  disabled={faceIdLoading}
                >
                  Passer cette étape
                </Button>

                <FaceCamera
                  open={faceCameraOpen}
                  onClose={() => setFaceCameraOpen(false)}
                  onCapture={handleSetupFaceId}
                  title="Enregistrer votre visage"
                  description="Regardez la caméra pour configurer la reconnaissance faciale"
                />
              </CardFooter>
            </>
          ) : (
          /* ── Registration Form ── */
          <>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t("auth.registerTitle")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("auth.registerSubtitle")}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate id="register-form" role="form" aria-label="Formulaire d'inscription">
            <CardContent className="space-y-5">
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg bg-destructive/10 border-2 border-destructive/30 p-4 text-sm text-destructive flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <Label className="text-sm font-medium">{t("auth.profilePhoto")}</Label>
                <div
                  className="relative group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      avatarInputRef.current?.click();
                    }
                  }}
                  aria-label="Choisir une photo de profil"
                >
                  <Avatar className="h-24 w-24 border-4 border-dashed border-muted-foreground/30 hover:border-primary transition-all duration-300 group-hover:scale-105">
                    {avatarPreview && <AvatarImage src={avatarPreview} alt="Aperçu de l'avatar" />}
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground">
                      {avatarPreview ? <Camera className="h-10 w-10" aria-hidden="true" /> : <Upload className="h-10 w-10" aria-hidden="true" />}
                    </AvatarFallback>
                  </Avatar>
                  {avatarPreview && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                    disabled={loading}
                    aria-label="Fichier de photo de profil"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  {t("auth.profilePhotoHint")}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                  {t("auth.fullName")}
                  <span className="text-destructive" aria-label="obligatoire">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t("auth.namePlaceholder")}
                      value={name}
                      onChange={(e) => { setName(e.target.value); clearFieldError("name"); setError(""); }}
                      required
                      autoComplete="name"
                      disabled={loading}
                      className={`
                        transition-all duration-300 pr-10
                        ${fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-2 focus-visible:ring-primary"}
                        ${!fieldErrors.name && name && validateName(name) === null ? "border-green-500" : ""}
                      `}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      aria-required="true"
                    />
                    {!fieldErrors.name && name && validateName(name) === null && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in zoom-in duration-300" aria-hidden="true" />
                    )}
                  </div>
                  <VoiceInputButton onResult={setName} disabled={loading} aria-label="Saisie vocale pour le nom" />
                </div>
                {fieldErrors.name && (
                  <p id="name-error" role="alert" className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                  {t("auth.email")}
                  <span className="text-destructive" aria-label="obligatoire">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); setError(""); }}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className={`
                        transition-all duration-300 pr-10
                        ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-2 focus-visible:ring-primary"}
                        ${!fieldErrors.email && email && validateEmail(email) === null ? "border-green-500" : ""}
                      `}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      aria-required="true"
                    />
                    {!fieldErrors.email && email && validateEmail(email) === null && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in zoom-in duration-300" aria-hidden="true" />
                    )}
                  </div>
                  <VoiceInputButton onResult={(text) => setEmail(text.replace(/\s+/g, "").toLowerCase())} disabled={loading} aria-label="Saisie vocale pour l'email" />
                </div>
                {fieldErrors.email && (
                  <p id="email-error" role="alert" className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label htmlFor="role" className="text-sm font-medium">{t("auth.iAm")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("donor")}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                      ${role === "donor"
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                      }
                    `}
                    aria-pressed={role === "donor"}
                    aria-label="S'inscrire en tant que donneur"
                  >
                    <UserCircle className={`h-8 w-8 mb-2 ${role === "donor" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                    <p className="font-semibold text-sm">{t("auth.donor")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("auth.donorHelp")}</p>
                    {role === "donor" && (
                      <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary animate-in zoom-in duration-300" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("association")}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                      ${role === "association"
                        ? "border-primary bg-primary/10 shadow-lg scale-105"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                      }
                    `}
                    aria-pressed={role === "association"}
                    aria-label="S'inscrire en tant qu'association"
                  >
                    <Building2 className={`h-8 w-8 mb-2 ${role === "association" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                    <p className="font-semibold text-sm">{t("auth.association")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("auth.associationHelp")}</p>
                    {role === "association" && (
                      <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary animate-in zoom-in duration-300" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1">
                  {t("auth.password")}
                  <span className="text-destructive" aria-label="obligatoire">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); setError(""); }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={loading}
                      className={`transition-all duration-300 pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-2 focus-visible:ring-primary"}`}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? "password-error password-strength" : password ? "password-strength" : undefined}
                      aria-required="true"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      disabled={loading}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                    </Button>
                  </div>
                  <VoiceInputButton onResult={(text) => setPassword(text.replace(/\s+/g, ""))} disabled={loading} aria-label="Saisie vocale pour le mot de passe" />
                </div>
                {fieldErrors.password && (
                  <p id="password-error" role="alert" className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {fieldErrors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {password && (
                  <div id="password-strength" className="space-y-3 pt-2" aria-live="polite">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${i < pwStrength.score ? getStrengthColor(pwStrength.score) : "bg-muted"}`}
                            role="progressbar"
                            aria-valuenow={i < pwStrength.score ? 100 : 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Barre de force ${i + 1} sur 4`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium min-w-[4.5rem] text-right" aria-label={`Force du mot de passe: ${t(`validation.password.strength.${pwStrength.label}`)}`}>
                        {t(`validation.password.strength.${pwStrength.label}`)}
                      </span>
                    </div>

                    {/* Requirements Checklist */}
                    <ul className="space-y-1.5 rounded-lg bg-muted/50 p-3" role="list" aria-label="Exigences du mot de passe">
                      {pwChecks.map((c) => (
                        <li key={c.key} className={`text-xs flex items-center gap-2 transition-colors ${c.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {c.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-current inline-block flex-shrink-0" aria-hidden="true" />
                          )}
                          <span>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-1">
                  {t("auth.confirmPassword")}
                  <span className="text-destructive" aria-label="obligatoire">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); setError(""); }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={loading}
                      className={`
                        transition-all duration-300 pr-10
                        ${fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-2 focus-visible:ring-primary"}
                        ${!fieldErrors.confirmPassword && confirmPassword && password === confirmPassword ? "border-green-500" : ""}
                      `}
                      aria-invalid={!!fieldErrors.confirmPassword}
                      aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                      aria-required="true"
                    />
                    {!fieldErrors.confirmPassword && confirmPassword && password === confirmPassword && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-in zoom-in duration-300" aria-hidden="true" />
                    )}
                  </div>
                  <VoiceInputButton onResult={(text) => setConfirmPassword(text.replace(/\s+/g, ""))} disabled={loading} aria-label="Saisie vocale pour la confirmation du mot de passe" />
                </div>
                {fieldErrors.confirmPassword && (
                  <p id="confirm-password-error" role="alert" className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                disabled={loading}
                aria-label={loading ? "Inscription en cours" : "S'inscrire"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>{t("auth.registering")}</span>
                  </>
                ) : (
                  t("auth.registerButton")
                )}
              </Button>

              <GoogleAuthButton mode="register" role={role} disabled={loading} />

              <p className="text-sm text-muted-foreground text-center pt-2">
                {t("auth.hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:text-primary/80 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1"
                  tabIndex={0}
                >
                  {t("auth.loginLink")}
                </Link>
              </p>
            </CardFooter>
          </form>
          </>
          )}
        </Card>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground animate-in fade-in duration-1000 delay-300">
            En créant un compte, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}
