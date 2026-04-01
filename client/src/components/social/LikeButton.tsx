import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LikeButtonProps {
  postId: number;
  initialLiked?: boolean;
  initialCount?: number;
  isAuthenticated?: boolean;
}

export function LikeButton({ postId, initialLiked = false, initialCount = 0, isAuthenticated = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const toggleMutation = trpc.socialLikes.toggle.useMutation({
    onMutate: () => {
      setLiked(prev => !prev);
      setCount(prev => liked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setLiked(prev => !prev);
      setCount(prev => liked ? prev + 1 : prev - 1);
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) return;
    toggleMutation.mutate({ postId });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={!isAuthenticated}
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-red-500 transition-colors",
        liked && "text-red-500"
      )}
    >
      <Heart
        className={cn("h-5 w-5 transition-all", liked && "fill-current scale-110")}
      />
      <span className="text-sm font-medium">{count}</span>
    </Button>
  );
}
