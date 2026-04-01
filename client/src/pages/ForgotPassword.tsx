import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2, AlertCircle, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { VoiceInputButton } from "@/components/VoiceInputButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }

      setSent(true);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950 overflow-hidden">
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
            <div className="bg-white/90 dark:bg-zinc-900/90 p-5 rounded-3xl shadow-xl">
              <Heart className="h-16 w-16 text-rose-500" fill="currentColor" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tighter mb-4">Universelle Cellule Ariana</h1>
          <p className="text-xl text-white/90 mb-8">Rejoignez une communauté qui change des vies</p>
          
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-sm">
            <span className="text-rose-300">❤️</span>
            Chaque connexion compte
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Language Switcher */}
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <Heart className="h-14 w-14 text-rose-500 mb-4" fill="currentColor" />
            <h1 className="text-4xl font-bold tracking-tighter">Universelle Cellule Ariana</h1>
          </div>

          <Card className="border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
            {sent ? (
              <>
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-3xl">Lien envoyé !</CardTitle>
                  <CardDescription className="text-base mt-3">
                    Si un compte existe avec l'adresse <strong className="text-foreground">{email}</strong>,<br />
                    vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-5 text-sm text-blue-700 dark:text-blue-300 flex gap-3">
                    <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>Vérifiez votre boîte de réception et vos spams. Le lien expire dans 1 heure.</span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-8 pb-10">
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                      setError("");
                    }}
                  >
                    Renvoyer l'email
                  </Button>
                  <Link href="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la connexion
                  </Link>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl">Mot de passe oublié ?</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit} noValidate>
                  <CardContent className="px-8 space-y-6">
                    {error && (
                      <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive flex gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          required
                          autoComplete="email"
                          disabled={loading}
                          className="h-12 rounded-2xl text-base"
                          autoFocus
                        />
                        <VoiceInputButton
                          onResult={(text) => setEmail(text.replace(/\s+/g, "").toLowerCase())}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-4 px-8 pb-10">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-5 w-5" />
                          Envoyer le lien de réinitialisation
                        </>
                      )}
                    </Button>

                    <Link href="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Retour à la page de connexion
                    </Link>
                  </CardFooter>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}