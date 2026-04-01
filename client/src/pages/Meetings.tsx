import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import {
  Video,
  VideoOff,
  Plus,
  Calendar,
  Clock,
  Users,
  Building2,
  Radio,
  PlayCircle,
  XCircle,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useCallback } from "react";

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: any }> = {
  scheduled: {
    label: "Scheduled",
    cls: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Calendar,
  },
  live: {
    label: "Live Now",
    cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse",
    icon: Radio,
  },
  ended: {
    label: "Ended",
    cls: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: VideoOff,
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: XCircle,
  },
};

function JitsiMeetFrame({ roomName, displayName, onClose }: { roomName: string; displayName: string; onClose: () => void }) {
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinConfig.enabled=false`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-red-500" />
          <span className="font-semibold text-white">Live Meeting</span>
          <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-white hover:bg-zinc-800"
            onClick={() => window.open(jitsiUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button variant="destructive" size="sm" onClick={onClose}>
            Leave Meeting
          </Button>
        </div>
      </div>
      <iframe
        src={jitsiUrl}
        className="flex-1 w-full border-0"
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        title="Jitsi Meeting"
      />
    </div>
  );
}

function CreateMeetingDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [membersOnly, setMembersOnly] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(50);

  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setDuration(60);
      setMembersOnly(true);
      setMaxParticipants(50);
      onCreated();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 rounded-2xl">
          <Plus className="h-4 w-4" />
          Schedule New Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Video className="h-6 w-6 text-rose-500" />
            Planifier une réunion
          </DialogTitle>
          <DialogDescription>
            Créez une visioconférence Jitsi pour vos membres
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Titre de la réunion</Label>
            <Input
              placeholder="Ex: Réunion mensuelle de la communauté"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optionnelle)</Label>
            <Textarea
              placeholder="Que va-t-on discuter ?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-3xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date et heure</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div>
                <Label className="text-sm font-medium">Réservé aux membres</Label>
                <p className="text-xs text-muted-foreground">Restreindre aux adhérents</p>
              </div>
              <Switch checked={membersOnly} onCheckedChange={setMembersOnly} />
            </div>

            <div className="space-y-2">
              <Label>Participants maximum</Label>
              <Input
                type="number"
                min={2}
                max={200}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-2xl">
            Annuler
          </Button>
          <Button
            onClick={() =>
              createMutation.mutate({
                title,
                description: description || undefined,
                scheduledAt,
                duration,
                membersOnly,
                maxParticipants,
              })
            }
            disabled={!title || !scheduledAt || createMutation.isPending}
            className="rounded-2xl"
          >
            {createMutation.isPending ? "Création..." : "Planifier la réunion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Meetings() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [activeJitsi, setActiveJitsi] = useState<{ roomName: string } | null>(null);

  const isAssociation = user?.role === "association" || user?.role === "admin";

  const { data: myMeetings, refetch: refetchMy } = trpc.meetings.listByAssociation.useQuery(
    undefined,
    { retry: false, enabled: isAssociation }
  );

  const { data: upcomingMeetings, isLoading, refetch: refetchUpcoming } = trpc.meetings.upcoming.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const joinMutation = trpc.meetings.join.useMutation();
  const statusMutation = trpc.meetings.updateStatus.useMutation({
    onSuccess: () => {
      refetchMy();
      refetchUpcoming();
    },
  });
  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      refetchMy();
      refetchUpcoming();
    },
  });

  const handleJoinMeeting = useCallback((roomName: string, meetingId: number) => {
    joinMutation.mutate({ meetingId });
    setActiveJitsi({ roomName });
  }, [joinMutation]);

  const handleCloseMeeting = useCallback(() => {
    setActiveJitsi(null);
  }, []);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const isUpcoming = (date: string | Date) => new Date(date) > new Date();

  const renderMeetingCard = (meeting: any, showAssociation = false, canManage = false) => {
    const status = STATUS_STYLES[meeting.status] || STATUS_STYLES.scheduled;
    const StatusIcon = status.icon;

    return (
      <Card key={meeting.id} className="hover:shadow-xl transition-all duration-300 border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {showAssociation && meeting.associationAvatar && (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={meeting.associationAvatar} />
                  <AvatarFallback><Building2 className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg line-clamp-1">{meeting.title}</CardTitle>
                {showAssociation && (
                  <CardDescription className="truncate">{meeting.associationName}</CardDescription>
                )}
              </div>
            </div>

            <Badge className={status.cls}>
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {meeting.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(meeting.scheduledAt)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(meeting.scheduledAt)} • {meeting.duration} min
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Max {meeting.maxParticipants}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3 flex-wrap">
          {(meeting.status === "live" || (meeting.status === "scheduled" && !isUpcoming(meeting.scheduledAt))) && (
            <Button
              onClick={() => handleJoinMeeting(meeting.roomName, meeting.id)}
              className="bg-red-600 hover:bg-red-700 rounded-2xl"
            >
              <Video className="h-4 w-4 mr-2" />
              Rejoindre maintenant
            </Button>
          )}

          {meeting.status === "scheduled" && isUpcoming(meeting.scheduledAt) && (
            <Button variant="outline" disabled className="rounded-2xl">
              <Clock className="h-4 w-4 mr-2" />
              Commence le {formatDate(meeting.scheduledAt)}
            </Button>
          )}

          {canManage && (
            <>
              {meeting.status === "scheduled" && (
                <Button
                  variant="default"
                  onClick={() => statusMutation.mutate({ meetingId: meeting.id, status: "live" })}
                  className="rounded-2xl"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Lancer en direct
                </Button>
              )}

              {meeting.status === "live" && (
                <Button
                  variant="secondary"
                  onClick={() => statusMutation.mutate({ meetingId: meeting.id, status: "ended" })}
                  className="rounded-2xl"
                >
                  <VideoOff className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-red-100 dark:hover:bg-red-950 rounded-2xl"
                onClick={() => deleteMutation.mutate({ meetingId: meeting.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      {activeJitsi && (
        <JitsiMeetFrame
          roomName={activeJitsi.roomName}
          displayName={user?.name || "Participant"}
          onClose={handleCloseMeeting}
        />
      )}

      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-5xl font-bold tracking-tighter">Réunions & Événements</h1>
              <p className="text-muted-foreground mt-2">Connectez-vous en direct avec la communauté</p>
            </div>
            {isAssociation && <CreateMeetingDialog onCreated={() => refetchMy()} />}
          </div>

          {isAssociation ? (
            <Tabs defaultValue="my-meetings" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="my-meetings">Mes Réunions</TabsTrigger>
                <TabsTrigger value="upcoming">Réunions à venir (en tant que membre)</TabsTrigger>
              </TabsList>

              <TabsContent value="my-meetings">
                {!myMeetings || myMeetings.length === 0 ? (
                  <Card className="text-center py-16">
                    <CardContent>
                      <Video className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Aucune réunion planifiée</h3>
                      <p className="text-muted-foreground mb-6">Créez votre première réunion et invitez vos membres.</p>
                      <CreateMeetingDialog onCreated={() => refetchMy()} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myMeetings.map((m: any) => renderMeetingCard(m, false, true))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming">
                {!upcomingMeetings || upcomingMeetings.length === 0 ? (
                  <Card className="text-center py-16">
                    <CardContent>
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-2xl font-semibold mb-3">Aucune réunion à venir</h3>
                      <p className="text-muted-foreground">Rejoignez des associations pour voir leurs réunions ici.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingMeetings.map((m: any) => renderMeetingCard(m, true))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-rose-500" />
                Réunions à venir
              </h2>

              {isLoading ? (
                <div className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-rose-500" />
                  <p className="mt-6 text-muted-foreground">Chargement des réunions...</p>
                </div>
              ) : !upcomingMeetings || upcomingMeetings.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <Video className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold mb-3">Aucune réunion à venir</h3>
                    <p className="text-muted-foreground mb-6">Rejoignez des associations pour voir leurs événements.</p>
                    <Button asChild size="lg" className="rounded-2xl">
                      <Link href="/memberships">Découvrir les associations</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingMeetings.map((m: any) => renderMeetingCard(m, true))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}