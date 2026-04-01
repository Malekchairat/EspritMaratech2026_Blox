import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ScreenReaderToolbar } from "./components/ScreenReaderToolbar";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { AIChatBot } from "./components/AIChatBot";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import Home from "./pages/Home";
import CaseDetail from "./pages/CaseDetail";
import CreateCase from "./pages/CreateCase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminInfluencers from "./pages/AdminInfluencers";
import AssociationDashboard from "./pages/AssociationDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import AssociationProfile from "./pages/AssociationProfile";
import SavedCases from "./pages/SavedCases";
import EditCase from "./pages/EditCase";
import Memberships from "./pages/Memberships";
import Meetings from "./pages/Meetings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { NeurodivergentProvider } from "./contexts/NeurodivergentContext";
import { HearingAccessibilityProvider } from "./contexts/HearingAccessibilityContext";
import { VisualAlertOverlay } from "./components/VisualAlertOverlay";
import { CaptionOverlay } from "./components/CaptionOverlay";
import { HearingAccessibilityPanel } from "./components/HearingAccessibilityPanel";
import { NeurodivergentPanel } from "./components/NeurodivergentPanel";
import { SignLanguageOverlay } from "./components/SignLanguageOverlay";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/case/:id" component={CaseDetail} />
      <Route path="/create-case" component={CreateCase} />
      <Route path="/edit-case/:id" component={EditCase} />
      <Route path="/dashboard/admin" component={AdminDashboard} />
      <Route path="/dashboard/admin/users" component={AdminUsers} />
      <Route path="/dashboard/admin/influencers" component={AdminInfluencers} />
      <Route path="/dashboard/association" component={AssociationDashboard} />
      <Route path="/dashboard/donor" component={DonorDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/feed" component={Feed} />
      <Route path="/discover" component={Discover} />
      <Route path="/association/:id" component={AssociationProfile} />
      <Route path="/saved-cases" component={SavedCases} />
      <Route path="/memberships" component={Memberships} />
      <Route path="/meetings" component={Meetings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <NeurodivergentProvider>
          <HearingAccessibilityProvider>
            <ThemeProvider
              defaultTheme="light"
              switchable
            >
              <TooltipProvider>
                <Toaster />
                <ScreenReaderToolbar />
                {/* Floating Assistants Container */}
                <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <VoiceAssistant />
                  <AIChatBot />
                </div>
                <KeyboardShortcuts />
                <VisualAlertOverlay />
                <CaptionOverlay />
                <SignLanguageOverlay />
                <Router />
              </TooltipProvider>
            </ThemeProvider>
          </HearingAccessibilityProvider>
        </NeurodivergentProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
