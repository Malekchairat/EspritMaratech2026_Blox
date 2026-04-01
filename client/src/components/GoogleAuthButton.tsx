import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface GoogleAuthButtonProps {
  disabled?: boolean;
  /** Optional role to pass during registration (donor or association) */
  role?: string;
  /** "login" or "register" — determines the state param */
  mode?: "login" | "register";
}

/**
 * Google OAuth button – always visible.
 * Redirects to /api/auth/google/redirect which builds the Google consent URL.
 * No Google Identity Services SDK needed – uses server-side OAuth 2.0 redirect flow.
 */
export function GoogleAuthButton({
  disabled = false,
  role,
  mode = "login",
}: GoogleAuthButtonProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    // Build the redirect URL with state params
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (role) params.set("role", role);

    // Navigate to the server endpoint that redirects to Google
    window.location.href = `/api/auth/google/redirect?${params.toString()}`;
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t" />
        <span className="flex-shrink-0 mx-3 text-xs text-muted-foreground uppercase">
          {t("auth.orContinueWith", "Ou continuer avec")}
        </span>
        <div className="flex-grow border-t" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={disabled}
        onClick={handleClick}
      >
        {/* Google "G" logo SVG */}
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>
    </div>
  );
}
