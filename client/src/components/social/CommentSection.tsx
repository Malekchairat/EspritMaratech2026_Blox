import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CommentSectionProps {
  postId: number;
  currentUserId?: number;
  isAuthenticated?: boolean;
}

export function CommentSection({ postId, currentUserId, isAuthenticated = false }: CommentSectionProps) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const utils = trpc.useUtils();

  const { data: comments, isLoading } = trpc.socialComments.listByPost.useQuery({ postId });

  const createMutation = trpc.socialComments.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      utils.socialComments.listByPost.invalidate({ postId });
    },
  });

  const deleteMutation = trpc.socialComments.delete.useMutation({
    onSuccess: () => {
      utils.socialComments.listByPost.invalidate({ postId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ postId, content: newComment.trim() });
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t("social.justNow");
    if (diffMin < 60) return t("social.minutesAgo", { count: diffMin });
    if (diffHr < 24) return t("social.hoursAgo", { count: diffHr });
    if (diffDay < 7) return t("social.daysAgo", { count: diffDay });
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Comment input */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("social.addComment")}
            className="flex-1"
            maxLength={1000}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                {comment.userAvatar && <AvatarImage src={comment.userAvatar} alt={comment.userName || ""} />}
                <AvatarFallback className="text-xs">
                  {comment.userName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold truncate">
                    {comment.userName || t("common.noName")}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">{comment.content}</p>
              </div>
              {currentUserId === comment.userId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => deleteMutation.mutate({ commentId: comment.id })}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          {t("social.noComments")}
        </p>
      )}
    </div>
  );
}
