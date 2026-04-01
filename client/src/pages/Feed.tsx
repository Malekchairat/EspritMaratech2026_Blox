import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/social/PostCard";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Compass, Loader2, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function Feed() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const {
    data: posts,
    isLoading,
    refetch,
  } = trpc.socialPosts.feed.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-6">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-8 py-4 rounded-3xl mb-6 shadow">
              <Compass className="h-9 w-9 text-rose-500" />
              <span className="text-2xl font-semibold tracking-tight">Fil d'actualité</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-foreground mb-3">
              Ce qui se passe dans la communauté
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Découvrez les dernières publications de vos associations suivies
            </p>
          </div>

          {/* Feed Content */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                <p className="text-muted-foreground mt-4">Chargement du fil...</p>
              </div>
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-20 h-20 rounded-full bg-white/70 dark:bg-zinc-900/70 flex items-center justify-center mb-6">
                <Heart className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Votre fil est vide</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Suivez des associations pour voir leurs publications apparaître ici.
              </p>
              <Link href="/discover">
                <Button size="lg" className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700">
                  Découvrir des associations
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}