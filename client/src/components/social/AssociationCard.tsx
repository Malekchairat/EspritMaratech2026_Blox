import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "./FollowButton";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface AssociationData {
  id: number;
  name: string | null;
  avatar: string | null;
  bio: string | null;
}

interface AssociationCardProps {
  association: AssociationData;
  isFollowing?: boolean;
  isAuthenticated?: boolean;
  followersCount?: number;
}

export function AssociationCard({
  association,
  isFollowing = false,
  isAuthenticated = false,
  followersCount,
}: AssociationCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Link href={`/association/${association.id}`}>
            <Avatar className="h-14 w-14 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              {association.avatar && <AvatarImage src={association.avatar} alt={association.name || ""} />}
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {association.name?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/association/${association.id}`}>
              <p className="font-semibold hover:underline cursor-pointer truncate">
                {association.name || t("common.noName")}
              </p>
            </Link>
            {association.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {association.bio}
              </p>
            )}
            {followersCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {followersCount} {t("social.followers")}
              </p>
            )}
          </div>
          <FollowButton
            associationId={association.id}
            initialFollowing={isFollowing}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </CardContent>
    </Card>
  );
}
