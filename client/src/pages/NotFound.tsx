import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Home, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function NotFound() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
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
          
          <h1 className="text-5xl font-bold tracking-tighter mb-4">
            {t("common.appName", "Universelle Cellule Ariana")}
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Rejoignez une communauté qui change des vies
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-sm">
            <span className="text-rose-300">❤️</span>
            Chaque connexion compte
          </div>
        </div>
      </div>

      {/* Right Side - 404 Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          {/* Language Switcher */}
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <Heart className="h-14 w-14 text-rose-500 mb-4" fill="currentColor" />
            <h1 className="text-4xl font-bold tracking-tighter">{t("common.appName", "Universelle Cellule Ariana")}</h1>
          </div>

          <Card className="border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-100 dark:bg-rose-900/30 rounded-full scale-125 animate-pulse" />
                  <AlertCircle className="relative h-20 w-20 text-rose-500" />
                </div>
              </div>

              <h2 className="text-7xl font-bold text-foreground mb-3 tracking-tighter">404</h2>
              
              <h3 className="text-3xl font-semibold text-foreground mb-4">
                {t("notFound.title", "Page non trouvée")}
              </h3>

              <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto">
                {t("notFound.description", "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.")}
              </p>

              <Button
                onClick={handleGoHome}
                size="lg"
                className="h-14 px-10 text-lg font-semibold rounded-2xl shadow-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-[0.985] transition-all"
              >
                <Home className="mr-3 h-5 w-5" />
                {t("notFound.goHome", "Retour à l'accueil")}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            En cas de problème persistant, contactez notre support
          </p>
        </div>
      </div>
    </div>
  );
}