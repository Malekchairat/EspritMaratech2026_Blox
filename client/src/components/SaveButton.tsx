import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface SaveButtonProps {
  caseId: number;
  variant?: "icon" | "full";
  className?: string;
}

export function SaveButton({ caseId, variant = "icon", className }: SaveButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: isSaved, isLoading: checkLoading } = trpc.favorites.isFavorited.useQuery(
    { caseId },
    { retry: false, enabled: !!user }
  );

  const toggleMutation = trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      utils.favorites.isFavorited.invalidate({ caseId });
      utils.favorites.list.invalidate();
      utils.favorites.listWithCases.invalidate();
    },
    onError: () => {
      toast.error(t("savedCases.saveError") || "Erreur lors de la sauvegarde");
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggleMutation.mutate({ caseId });
  };

  const isLoading = checkLoading || toggleMutation.isPending;

  if (variant === "full") {
    return (
      <Button
        variant={isSaved ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || !user}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isSaved ? (
          <BookmarkCheck className="h-4 w-4 mr-2" />
        ) : (
          <Bookmark className="h-4 w-4 mr-2" />
        )}
        {isSaved ? t("savedCases.unsave") : t("savedCases.save")}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading || !user}
      className={className}
      title={isSaved ? t("savedCases.unsave") : t("savedCases.save")}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="h-4 w-4 text-primary" fill="currentColor" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  );
}
