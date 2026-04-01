import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { HearingAccessibilityPanel } from "@/components/HearingAccessibilityPanel";
import { NeurodivergentPanel } from "@/components/NeurodivergentPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useTheme } from "@/contexts/ThemeContext";
import { Heart, Moon, Sun, Plus, LayoutDashboard, UserCircle, Rss, Compass, Bookmark, Video, LogOut, Users, PenSquare } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export function Navigation() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header role="banner" className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              {t("common.appName")}
            </span>
          </Link>

          {/* Main nav links — visible on md+ */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && (
              <>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Link href="/feed">
                    <Rss className="h-4 w-4 mr-1.5" />
                    {t("social.feed")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Link href="/discover">
                    <Compass className="h-4 w-4 mr-1.5" />
                    {t("social.discover")}
                  </Link>
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/discover">
                  <Compass className="h-4 w-4 mr-1.5" />
                  {t("social.discover")}
                </Link>
              </Button>
            )}
          </nav>
        </div>

        {/* Right: Utilities + User */}
        <div className="flex items-center gap-1.5">
          {/* Compact utility buttons */}
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={t("common.toggleTheme")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Accessibility grouped in one dropdown-like area */}
          <div className="hidden sm:flex items-center gap-1.5">
            <HearingAccessibilityPanel />
            <NeurodivergentPanel />
            <AccessibilityMenu />
          </div>

          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <NotificationsBell />

              {/* New Case CTA — prominent */}
              {(user?.role === "association" || user?.role === "admin") && (
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/create-case">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {t("common.newCase")}
                  </Link>
                </Button>
              )}

              {/* User profile dropdown — consolidates all user actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 gap-2 px-2 hover:bg-accent">
                    <Avatar className="h-6 w-6">
                      {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || ""} />}
                      <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                      {user?.name || t("profile.title")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/dashboard/${user?.role === "admin" ? "admin" : user?.role === "association" ? "association" : "donor"}`}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {t("common.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">
                      <UserCircle className="h-4 w-4 mr-2" />
                      {t("profile.title")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Donor-specific menu items */}
                  {user?.role === "donor" && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/saved-cases">
                          <Bookmark className="h-4 w-4 mr-2" />
                          {t("savedCases.title")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/memberships">
                          <Users className="h-4 w-4 mr-2" />
                          My Memberships
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/meetings">
                          <Video className="h-4 w-4 mr-2" />
                          Meetings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* Association-specific menu items */}
                  {user?.role === "association" && (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/association/${user.id}`}>
                          <PenSquare className="h-4 w-4 mr-2" />
                          My Page
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/memberships">
                          <Users className="h-4 w-4 mr-2" />
                          Members
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/meetings">
                          <Video className="h-4 w-4 mr-2" />
                          Host Meetings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* Mobile-only nav items */}
                  <div className="md:hidden">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/feed">
                        <Rss className="h-4 w-4 mr-2" />
                        {t("social.feed")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/discover">
                        <Compass className="h-4 w-4 mr-2" />
                        {t("social.discover")}
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("common.register", "Register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
