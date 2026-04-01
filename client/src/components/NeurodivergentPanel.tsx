import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  useNeurodivergent,
  type CalmPalette,
  type ContentDensity,
  type PresetProfile,
  type SensoryLevel,
  type UIComplexity,
} from "@/contexts/NeurodivergentContext";
import {
  Brain,
  Check,
  Eye,
  Focus,
  Layout,
  Palette,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function NeurodivergentPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting, applyPreset, resetSettings } = useNeurodivergent();

  const presetOptions: { value: PresetProfile; label: string; description: string }[] = [
    {
      value: "none",
      label: t("nd.presetNone", "Aucun"),
      description: t("nd.presetNoneDesc", "Paramètres par défaut"),
    },
    {
      value: "calm-focus",
      label: t("nd.presetCalmFocus", "Concentration calme"),
      description: t("nd.presetCalmFocusDesc", "Couleurs douces, animations réduites, indicateurs de focus"),
    },
    {
      value: "low-stimulation",
      label: t("nd.presetLowStim", "Faible stimulation"),
      description: t("nd.presetLowStimDesc", "Minimal, vert apaisant, mise en page aérée"),
    },
    {
      value: "minimal-sensory",
      label: t("nd.presetMinimalSensory", "Sensoriel minimal"),
      description: t("nd.presetMinimalSensoryDesc", "Monochrome, aucune décoration, interface simplifiée"),
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("nd.panelAriaLabel", "Préférences neuro-sensorielles")}
          title={t("nd.panelTitle", "Profil sensoriel")}
        >
          <Brain className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t("nd.title", "Profil sensoriel")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "nd.description",
              "Personnalisez l'interface pour une expérience calme et prévisible. Vos préférences sont sauvegardées automatiquement.",
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* ── Preset Profiles ── */}
          <section>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t("nd.presets", "Profils prédéfinis")}
            </h3>
            <div className="grid gap-2">
              {presetOptions.map((p) => (
                <Card
                  key={p.value}
                  className={`cursor-pointer transition-colors ${
                    settings.activePreset === p.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                  onClick={() => applyPreset(p.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      applyPreset(p.value);
                    }
                  }}
                  aria-pressed={settings.activePreset === p.value}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    {settings.activePreset === p.value && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* ── Sensory Level ── */}
          <section>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {t("nd.sensoryLevel", "Niveau sensoriel")}
            </h3>
            <Select
              value={settings.sensoryLevel}
              onValueChange={(v) => updateSetting("sensoryLevel", v as SensoryLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  {t("nd.sensoryDefault", "Normal")}
                </SelectItem>
                <SelectItem value="low">
                  {t("nd.sensoryLow", "Réduit — moins d'ombres et d'effets")}
                </SelectItem>
                <SelectItem value="minimal">
                  {t("nd.sensoryMinimal", "Minimal — interface plate et silencieuse")}
                </SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* ── Calm Palette ── */}
          <section>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t("nd.calmPalette", "Palette apaisante")}
            </h3>
            <Select
              value={settings.calmPalette}
              onValueChange={(v) => updateSetting("calmPalette", v as CalmPalette)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t("nd.paletteDefault", "Par défaut")}</SelectItem>
                <SelectItem value="calm-blue">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-300 inline-block" />
                    {t("nd.paletteCalmBlue", "Bleu calme")}
                  </span>
                </SelectItem>
                <SelectItem value="calm-green">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-300 inline-block" />
                    {t("nd.paletteCalmGreen", "Vert apaisant")}
                  </span>
                </SelectItem>
                <SelectItem value="calm-warm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-200 inline-block" />
                    {t("nd.paletteCalmWarm", "Tons chauds doux")}
                  </span>
                </SelectItem>
                <SelectItem value="monochrome">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-400 inline-block" />
                    {t("nd.paletteMonochrome", "Monochrome")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* ── Content Density ── */}
          <section>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t("nd.contentDensity", "Densité du contenu")}
            </h3>
            <Select
              value={settings.contentDensity}
              onValueChange={(v) => updateSetting("contentDensity", v as ContentDensity)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">{t("nd.densityCompact", "Compact")}</SelectItem>
                <SelectItem value="comfortable">{t("nd.densityComfortable", "Confortable")}</SelectItem>
                <SelectItem value="spacious">{t("nd.densitySpacious", "Aéré — plus d'espace")}</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* ── UI Complexity ── */}
          <section>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("nd.uiComplexity", "Complexité de l'interface")}
            </h3>
            <Select
              value={settings.uiComplexity}
              onValueChange={(v) => updateSetting("uiComplexity", v as UIComplexity)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t("nd.complexityFull", "Complète")}</SelectItem>
                <SelectItem value="simplified">{t("nd.complexitySimplified", "Simplifiée — éléments essentiels")}</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <Separator />

          {/* ── Toggle Switches ── */}
          <section className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Focus className="h-4 w-4" />
              {t("nd.toggles", "Options supplémentaires")}
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nd-reduced-interactions" className="font-medium text-sm">
                  {t("nd.reducedInteractions", "Interactions réduites")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("nd.reducedInteractionsDesc", "Désactive les animations au survol et au clic")}
                </p>
              </div>
              <Switch
                id="nd-reduced-interactions"
                checked={settings.reducedInteractions}
                onCheckedChange={(v) => updateSetting("reducedInteractions", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nd-hide-decorative" className="font-medium text-sm">
                  {t("nd.hideDecorative", "Masquer le décoratif")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("nd.hideDecorativeDesc", "Cache les dégradés, ombres et illustrations non essentielles")}
                </p>
              </div>
              <Switch
                id="nd-hide-decorative"
                checked={settings.hideDecorative}
                onCheckedChange={(v) => updateSetting("hideDecorative", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nd-predictable-layout" className="font-medium text-sm">
                  {t("nd.predictableLayout", "Mise en page prévisible")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("nd.predictableLayoutDesc", "Désactive les carrousels et la réorganisation automatique")}
                </p>
              </div>
              <Switch
                id="nd-predictable-layout"
                checked={settings.predictableLayout}
                onCheckedChange={(v) => updateSetting("predictableLayout", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nd-focus-highlight" className="font-medium text-sm">
                  {t("nd.focusHighlight", "Indicateur de focus visible")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("nd.focusHighlightDesc", "Anneau de focus proéminent sur l'élément actif")}
                </p>
              </div>
              <Switch
                id="nd-focus-highlight"
                checked={settings.focusHighlight}
                onCheckedChange={(v) => updateSetting("focusHighlight", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nd-dyslexia-font" className="font-medium text-sm">
                  {t("nd.dyslexiaFont", "Police dyslexie")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("nd.dyslexiaFontDesc", "Utilise OpenDyslexic pour une meilleure lisibilité")}
                </p>
              </div>
              <Switch
                id="nd-dyslexia-font"
                checked={settings.dyslexiaFont}
                onCheckedChange={(v) => updateSetting("dyslexiaFont", v)}
              />
            </div>
          </section>
        </div>

        <SheetFooter>
          <Button variant="outline" className="gap-2" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4" />
            {t("nd.reset", "Réinitialiser")}
          </Button>
          <SheetClose asChild>
            <Button>{t("common.close", "Fermer")}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
