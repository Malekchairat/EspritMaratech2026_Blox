import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2, Eye, EyeOff, AlertCircle, ScanFace, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { validateEmail } from "@/lib/validation";
import { FaceCamera } from "@/components/FaceCamera";

export default function Login() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [faceCameraOpen, setFaceCameraOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const redirectToDashboard = (role: string) => {
    const path = role === "admin" ? "/dashboard/admin"
      : role === "association" ? "/dashboard/association"
      : "/";
    navigate(path);
  };

  // Check for error from Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = t(`validation.email.${emailErr}`);
    if (!password) errors.password = t("validation.password.required");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.error });
        } else {
          setError(data.error || t("auth.errorConnection"));
        }
        return;
      }
      // Set user in cache immediately so protected pages don't redirect back to login
      utils.auth.me.setData(undefined, data.user as any);
      utils.auth.me.invalidate();
      setLoginSuccess(true);
      setTimeout(() => redirectToDashboard(data.user?.role), 1200);
    } catch {
      setError(t("auth.errorServer"));
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = useCallback(async (descriptor: number[]) => {
    setFaceCameraOpen(false);
    setError("");
    setFaceIdLoading(true);
    try {
      const res = await fetch("/api/auth/face/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ descriptor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Visage non reconnu.");
        return;
      }
      utils.auth.me.setData(undefined, data.user as any);
      utils.auth.me.invalidate();
      setLoginSuccess(true);
      setTimeout(() => redirectToDashboard(data.user?.role), 1200);
    } catch {
      setError("Erreur lors de l'authentification faciale.");
    } finally {
      setFaceIdLoading(false);
    }
  }, [utils, navigate]);

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
        
        {/* Overlay content */}
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
            Chaque connexion compte
          </div>
        </div>

        {/* Subtle floating hearts (optional, light) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className="absolute h-8 w-8 text-white animate-float"
              fill="currentColor"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 1.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Language Switcher */}
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* Mobile branding (visible only on small screens) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <Heart className="h-14 w-14 text-rose-500 mb-4" fill="currentColor" />
            <h1 className="text-4xl font-bold tracking-tighter">{t("common.appName")}</h1>
          </div>

          <Card className="border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-2 text-center pb-8">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {t("auth.loginTitle")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("auth.loginSubtitle")}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit} noValidate>
              <CardContent className="space-y-6">
                {loginSuccess && (
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800 p-5 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 animate-bounce" />
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">Connexion réussie !</p>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">Redirection vers votre espace...</p>
                  </div>
                )}

                {error && !loginSuccess && (
                  <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive flex gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")} <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((p) => ({ ...p, email: "" }));
                        setError("");
                      }}
                      required
                      autoComplete="email"
                      disabled={loading || loginSuccess}
                      className={`h-12 rounded-2xl ${fieldErrors.email ? "border-destructive" : ""}`}
                    />
                    {email && validateEmail(email) === null && !fieldErrors.email && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    )}
                    <VoiceInputButton
                      onResult={(text) => setEmail(text.replace(/\s+/g, "").toLowerCase())}
                      disabled={loading || loginSuccess}
                      className="absolute right-12 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")} <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: "" }));
                        setError("");
                      }}
                      required
                      autoComplete="current-password"
                      disabled={loading || loginSuccess}
                      className={`h-12 rounded-2xl pr-20 ${fieldErrors.password ? "border-destructive" : ""}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      disabled={loading || loginSuccess}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                    <VoiceInputButton
                      onResult={(text) => setPassword(text.replace(/\s+/g, ""))}
                      disabled={loading || loginSuccess}
                      className="absolute right-12 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
                  
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-5 pt-2 pb-10">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                  disabled={loading || faceIdLoading || loginSuccess}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : loginSuccess ? (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      Connecté !
                    </>
                  ) : (
                    t("auth.loginButton")
                  )}
                </Button>

                <div className="relative w-full my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/30 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground">
                    <span className="bg-white/70 dark:bg-zinc-900/70 px-4">ou</span>
                  </div>
                </div>

                {/* Face Login */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFaceCameraOpen(true)}
                  disabled={loading || faceIdLoading || loginSuccess}
                  className="w-full h-14 rounded-2xl border-2 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                >
                  {faceIdLoading ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <ScanFace className="mr-3 h-5 w-5" />
                  )}
                  Reconnaissance faciale
                </Button>

                <FaceCamera
                  open={faceCameraOpen}
                  onClose={() => setFaceCameraOpen(false)}
                  onCapture={handleFaceLogin}
                  title="Connexion faciale"
                  description="Regardez la caméra pour vous connecter"
                />

                <GoogleAuthButton mode="login" disabled={loading || faceIdLoading || loginSuccess} />

                <p className="text-center text-sm text-muted-foreground pt-4">
                  Pas encore de compte ?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">
                    Créer un compte
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            En vous connectant, vous rejoignez une communauté solidaire
          </p>
        </div>
      </div>
    </div>
  );
}