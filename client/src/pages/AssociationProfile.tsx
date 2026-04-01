import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/social/PostCard";
import { FollowButton } from "@/components/social/FollowButton";
import { CreatePostDialog } from "@/components/social/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Moon,
  Sun,
  ArrowLeft,
  Loader2,
  Grid3X3,
  Users,
  Video,
  Crown,
  Clock,
  Heart,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";

export default function AssociationProfile() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const associationId = parseInt(id, 10);
  const isOwner = user?.id === associationId;

  const { data: profile, isLoading: profileLoading } =
    trpc.socialFollows.getAssociationProfile.useQuery(
      { associationId },
      { enabled: !isNaN(associationId) }
    );

  const { data: posts, isLoading: postsLoading } =
    trpc.socialPosts.listByAssociation.useQuery(
      { associationId },
      { enabled: !isNaN(associationId) }
    );

  const { data: isFollowing } = trpc.socialFollows.isFollowing.useQuery(
    { associationId },
    { enabled: isAuthenticated && !isNaN(associationId) }
  );

  const { data: followersCount } = trpc.socialFollows.followersCount.useQuery(
    { userId: associationId },
    { enabled: !isNaN(associationId) }
  );

  const { data: membershipStatus } = trpc.memberships.getStatus.useQuery(
    { associationId },
    { enabled: isAuthenticated && !isNaN(associationId) && !isOwner }
  );

  const { data: memberCount } = trpc.memberships.getMemberCount.useQuery(
    { associationId },
    { enabled: !isNaN(associationId) }
  );

  const utils = trpc.useUtils();

  const joinMembership = trpc.memberships.join.useMutation({
    onSuccess: () => {
      utils.memberships.getStatus.invalidate({ associationId });
      utils.memberships.getMemberCount.invalidate({ associationId });
    },
  });

  const leaveMembership = trpc.memberships.leave.useMutation({
    onSuccess: () => {
      utils.memberships.getStatus.invalidate({ associationId });
      utils.memberships.getMemberCount.invalidate({ associationId });
    },
  });

  if (isNaN(associationId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
        <p className="text-muted-foreground">{t("common.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="font-semibold text-xl tracking-tight">
              {profile?.name || "Association"}
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

      {profileLoading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        </div>
      ) : profile ? (
        <div className="max-w-4xl mx-auto px-6 pb-12">
          {/* Hero Profile Section */}
          <div className="relative -mt-8 mb-10 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-8 sm:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-8 ring-white dark:ring-zinc-900 shadow-xl">
                {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name || "Association"} />}
                <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-rose-400 to-purple-500 text-white">
                  {profile.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-6 pt-2">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl font-bold tracking-tighter">{profile.name}</h1>
                    <Badge variant="secondary" className="text-base px-4 py-1 rounded-full">
                      Association
                    </Badge>
                  </div>
                  {profile.bio && (
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold text-foreground">{posts?.length || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Publications</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground">{followersCount || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Abonnés</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-foreground">{memberCount || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Membres</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {isOwner ? (
                    <>
                      <CreatePostDialog />
                      <Button asChild variant="outline" size="lg" className="rounded-2xl">
                        <Link href="/meetings">
                          <Video className="h-5 w-5 mr-2" />
                          Réunions
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <FollowButton
                        associationId={associationId}
                        initialFollowing={isFollowing || false}
                        isAuthenticated={isAuthenticated}
                      />

                      {isAuthenticated && (
                        membershipStatus?.status === "approved" ? (
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-2xl gap-2"
                            onClick={() => leaveMembership.mutate({ associationId })}
                            disabled={leaveMembership.isPending}
                          >
                            <Crown className="h-5 w-5 text-amber-500" />
                            Membre ({membershipStatus.tier})
                          </Button>
                        ) : membershipStatus?.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-2xl gap-2 opacity-75 cursor-default"
                            disabled
                          >
                            <Clock className="h-5 w-5 text-yellow-500" />
                            Demande en cours
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="lg"
                            className="rounded-2xl gap-2"
                            onClick={() => joinMembership.mutate({ associationId })}
                            disabled={joinMembership.isPending}
                          >
                            <Users className="h-5 w-5" />
                            Rejoindre l'association
                          </Button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Posts Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
              <span className="uppercase tracking-widest text-sm font-semibold text-muted-foreground">
                Publications
              </span>
            </div>

            {postsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-9 w-9 animate-spin text-rose-500" />
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="text-center py-20">
                <Grid3X3 className="h-16 w-16 mx-auto text-muted-foreground/40 mb-6" />
                <p className="text-xl text-muted-foreground">Aucune publication pour le moment</p>
                {isOwner && (
                  <div className="mt-6">
                    <CreatePostDialog />
                  </div>
                )}
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
        </div>
      ) : (
        <div className="text-center py-32">
          <Users className="h-20 w-20 mx-auto text-muted-foreground/40 mb-6" />
          <p className="text-xl text-muted-foreground">{t("common.notFound")}</p>
        </div>
      )}
    </div>
  );
}