import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { UserPlus, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface FollowButtonProps {
  associationId: number;
  initialFollowing?: boolean;
  isAuthenticated?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FollowButton({
  associationId,
  initialFollowing = false,
  isAuthenticated = false,
  variant = "default",
  size = "sm",
}: FollowButtonProps) {
  const { t } = useTranslation();
  const [following, setFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const utils = trpc.useUtils();

  // Query the actual following status from server on mount
  const { data: isFollowingData } = trpc.socialFollows.isFollowing.useQuery(
    { associationId },
    {
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Sync state when query result comes back
  useEffect(() => {
    if (isFollowingData !== undefined) {
      setFollowing(isFollowingData);
      setIsInitialized(true);
    }
  }, [isFollowingData]);

  // Sync state when initialFollowing prop changes (before query result)
  useEffect(() => {
    if (!isInitialized) {
      setFollowing(initialFollowing);
    }
  }, [initialFollowing, isInitialized]);

  const toggleMutation = trpc.socialFollows.toggle.useMutation({
    onMutate: async () => {
      // Optimistically update UI
      const previousFollowing = following;
      setFollowing(!previousFollowing);
      setIsLoading(true);
      
      // Return previous state in case we need to rollback
      return { previousFollowing };
    },
    onSuccess: (data) => {
      // Confirm server state
      setFollowing(data.following);
      setIsLoading(false);
      
      // Invalidate related queries to ensure sync
      utils.socialFollows.isFollowing.invalidate({ associationId });
      utils.socialFollows.followersCount.invalidate();
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousFollowing !== undefined) {
        setFollowing(context.previousFollowing);
      }
      setIsLoading(false);
    },
  });

  const handleClick = () => {
    if (!isAuthenticated || isLoading || toggleMutation.isPending) return;
    toggleMutation.mutate({ associationId });
  };

  return (
    <Button
      variant={following ? "outline" : variant}
      size={size}
      onClick={handleClick}
      disabled={!isAuthenticated || isLoading || toggleMutation.isPending}
      className="gap-1.5"
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" />
          {t("social.following")}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {t("social.follow")}
        </>
      )}
    </Button>
  );
}
