import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Trash2, FileText, Users, Video, Heart, MessageCircle, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

const typeIcon: Record<string, React.ReactNode> = {
  new_post: <MessageCircle className="h-4 w-4 text-blue-500" />,
  new_case: <Heart className="h-4 w-4 text-rose-500" />,
  new_meeting: <Video className="h-4 w-4 text-purple-500" />,
  membership_approved: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  membership_rejected: <XCircle className="h-4 w-4 text-red-500" />,
  case_approved: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  case_rejected: <XCircle className="h-4 w-4 text-red-500" />,
  post_liked: <Heart className="h-4 w-4 text-rose-500" />,
  post_commented: <MessageCircle className="h-4 w-4 text-blue-500" />,
  new_follower: <UserPlus className="h-4 w-4 text-indigo-500" />,
};

export function NotificationsBell() {
  const utils = trpc.useUtils();

  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // poll every 30s
  });

  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const deleteNotif = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-rose-500" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Tout lire
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto bg-white dark:bg-zinc-900">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-zinc-400">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${!n.isRead ? "bg-rose-50/60 dark:bg-rose-950/20" : ""}`}
              >
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {typeIcon[n.type] ?? <Bell className="h-4 w-4 text-zinc-400" />}
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (!n.isRead) markRead.mutate({ notificationId: n.id });
                  }}
                >
                  {n.link ? (
                    <Link href={n.link} className="block">
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                    </Link>
                  ) : (
                    <>
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                    </>
                  )}
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>

                {/* Unread dot + delete */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 mt-1" />
                  )}
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotif.mutate({ notificationId: n.id });
                    }}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3 w-3 text-zinc-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
