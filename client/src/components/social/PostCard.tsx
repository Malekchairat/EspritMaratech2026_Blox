import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "./LikeButton";
import { ImageGallery } from "./ImageGallery";
import { CommentSection } from "./CommentSection";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface PostData {
  id: number;
  associationId: number;
  content: string;
  type: string;
  videoUrl?: string | null;
  createdAt: string | Date;
  authorName: string | null;
  authorAvatar: string | null;
  images: { id: number; imageUrl: string; displayOrder: number }[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

interface PostCardProps {
  post: PostData;
  currentUserId?: number;
  isAuthenticated?: boolean;
  showComments?: boolean;
}

export function PostCard({ post, currentUserId, isAuthenticated = false, showComments = false }: PostCardProps) {
  const { t } = useTranslation();
  const [commentsOpen, setCommentsOpen] = useState(showComments);

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

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      photo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      event: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      activity: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={styles[type] || ""}>{t(`social.postType.${type}`)}</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Link href={`/association/${post.associationId}`}>
            <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              {post.authorAvatar && <AvatarImage src={post.authorAvatar} alt={post.authorName || ""} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {post.authorName?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/association/${post.associationId}`}>
              <p className="text-sm font-semibold hover:underline cursor-pointer truncate">
                {post.authorName || t("common.noName")}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="pb-3 space-y-3">
        <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

        {post.videoUrl && (
          <div className="rounded-lg overflow-hidden border bg-black">
            <video
              src={post.videoUrl}
              controls
              preload="metadata"
              className="w-full max-h-[500px] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {post.images.length > 0 && (
          <ImageGallery images={post.images} />
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex-col items-stretch gap-3 pt-0">
        <div className="flex items-center gap-2 border-t pt-3">
          <LikeButton
            postId={post.id}
            initialLiked={post.isLiked}
            initialCount={typeof post.likesCount === 'number' ? post.likesCount : Number(post.likesCount)}
            isAuthenticated={isAuthenticated}
          />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setCommentsOpen(prev => !prev)}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {typeof post.commentsCount === 'number' ? post.commentsCount : Number(post.commentsCount)}
            </span>
          </Button>
        </div>

        {commentsOpen && (
          <div className="border-t pt-3">
            <CommentSection
              postId={post.id}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
