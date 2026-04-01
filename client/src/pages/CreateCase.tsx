import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation } from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import { Heart, AlertCircle, Check, Sparkles, ImagePlus, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { validateTitle, validateDescription, validateUrl, validateAmount } from "@/lib/validation";

export default function CreateCase() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    coverImage: "",
    cha9a9aLink: "",
    targetAmount: "",
    isUrgent: false,
    associationId: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validFields, setValidFields] = useState({
    title: false,
    description: false,
    cha9a9aLink: false,
    targetAmount: false,
    coverImage: false,
  });
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: allUsers } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });
  const associations = allUsers?.filter((u: any) => u.role === "association") ?? [];

  const createCaseMutation = trpc.cases.create.useMutation({
    onSuccess: () => {
      toast.success(t("createCase.success"));
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`${t("auth.errorConnection")}: ${error.message}`);
    },
  });

  const clearFieldError = (field: string) => {
    setFieldErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCoverUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setFormData((p) => ({ ...p, coverImage: url }));
      setValidFields((p) => ({ ...p, coverImage: true }));
      clearFieldError("coverImage");
    } catch {
      toast.error("Erreur lors du téléchargement de l'image");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const titleErr = validateTitle(formData.title);
    if (titleErr) errors.title = t(`validation.field.${titleErr}`);

    const descErr = validateDescription(formData.description);
    if (descErr) errors.description = t(`validation.field.${descErr === "tooShort" ? "descriptionTooShort" : descErr}`);

    if (!formData.category) errors.category = t("validation.field.required");

    const linkErr = validateUrl(formData.cha9a9aLink);
    if (linkErr) errors.cha9a9aLink = t(`validation.field.${linkErr}`);

    const amountErr = validateAmount(formData.targetAmount);
    if (amountErr) errors.targetAmount = t(`validation.field.${amountErr}`);

    if (user?.role === "admin" && !formData.associationId) {
      errors.associationId = t("createCase.selectAssociationRequired");
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(t("createCase.fillRequired"));
      return;
    }

    try {
      await createCaseMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        coverImage: formData.coverImage || undefined,
        cha9a9aLink: formData.cha9a9aLink,
        targetAmount: parseInt(formData.targetAmount),
        isUrgent: formData.isUrgent,
        ...(user?.role === "admin" && formData.associationId ? { associationId: parseInt(formData.associationId) } : {}),
      });
    } catch (error) {
      console.error("Error creating case:", error);
    }
  };

  // Access check
  if (isAuthenticated && user && user.role !== "association" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("common.accessDenied")}</h2>
          <p className="text-muted-foreground mb-6">{t("createCase.onlyAssociations")}</p>
          <Button asChild size="lg" className="rounded-2xl">
            <Link href="/">{t("common.backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("common.loginRequired")}</h2>
          <p className="text-muted-foreground mb-6">{t("createCase.mustBeAssociation")}</p>
          <Button asChild size="lg" className="rounded-2xl">
            <Link href="/login">{t("auth.loginButton")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const categoryKeys = ["health", "disability", "children", "education", "renovation", "emergency"] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 py-3 rounded-3xl mb-6 shadow">
              <Sparkles className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold">Créer un cas solidaire</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter mb-3">Publier une nouvelle cause</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Chaque histoire compte. Racontez-la avec cœur.
            </p>
          </div>

          <Card className="border border-white/50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-8 pt-10 text-center">
              <CardTitle className="text-3xl font-bold">Détails du cas</CardTitle>
              <CardDescription className="text-base mt-2">
                Remplissez les informations ci-dessous pour publier votre appel à solidarité
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex justify-between items-center">
                    Titre du cas <span className="text-destructive">*</span>
                    {validFields.title && (
                      <span className="text-emerald-600 text-sm flex items-center gap-1">
                        <Check className="h-4 w-4" /> Valide
                      </span>
                    )}
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Soutien médical pour Amina"
                    value={formData.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, title: value });
                      clearFieldError("title");
                      setValidFields((p) => ({ ...p, title: value.trim().length >= 5 && value.trim().length <= 100 }));
                    }}
                    className={`h-12 rounded-2xl ${validFields.title ? "border-emerald-500 focus-visible:ring-emerald-500" : fieldErrors.title ? "border-destructive" : ""}`}
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex justify-between items-center">
                    Description détaillée <span className="text-destructive">*</span>
                    {validFields.description && (
                      <span className="text-emerald-600 text-sm flex items-center gap-1">
                        <Check className="h-4 w-4" /> {formData.description.length} caractères
                      </span>
                    )}
                  </Label>
                  <Textarea
                    id="description"
                    rows={7}
                    placeholder="Décrivez la situation avec compassion et clarté..."
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, description: value });
                      clearFieldError("description");
                      setValidFields((p) => ({ ...p, description: value.trim().length >= 50 }));
                    }}
                    className={`rounded-3xl resize-y min-h-[140px] ${validFields.description ? "border-emerald-500 focus-visible:ring-emerald-500" : fieldErrors.description ? "border-destructive" : ""}`}
                  />
                  {fieldErrors.description ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 caractères • Soyez précis et émouvant
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Catégorie <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value });
                      clearFieldError("category");
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Choisissez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`categories.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.category && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.category}
                    </p>
                  )}
                </div>

                {/* Association (Admin only) */}
                {user?.role === "admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="associationId">
                      Association concernée <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.associationId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, associationId: value });
                        clearFieldError("associationId");
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-2xl">
                        <SelectValue placeholder="Sélectionner une association" />
                      </SelectTrigger>
                      <SelectContent>
                        {associations.map((assoc: any) => (
                          <SelectItem key={assoc.id} value={String(assoc.id)}>
                            {assoc.name || assoc.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.associationId && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.associationId}
                      </p>
                    )}
                  </div>
                )}

                {/* Cha9a9a Link */}
                <div className="space-y-2">
                  <Label htmlFor="cha9a9aLink" className="flex justify-between items-center">
                    Lien Cha9a9a <span className="text-destructive">*</span>
                    {validFields.cha9a9aLink && (
                      <span className="text-emerald-600 text-sm flex items-center gap-1">
                        <Check className="h-4 w-4" /> URL valide
                      </span>
                    )}
                  </Label>
                  <Input
                    id="cha9a9aLink"
                    type="url"
                    placeholder="https://cha9a9a.tn/donate/..."
                    value={formData.cha9a9aLink}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, cha9a9aLink: value });
                      clearFieldError("cha9a9aLink");
                      try {
                        const url = new URL(value);
                        setValidFields((p) => ({ ...p, cha9a9aLink: url.protocol === "http:" || url.protocol === "https:" }));
                      } catch {
                        setValidFields((p) => ({ ...p, cha9a9aLink: false }));
                      }
                    }}
                    className={`h-12 rounded-2xl ${validFields.cha9a9aLink ? "border-emerald-500 focus-visible:ring-emerald-500" : fieldErrors.cha9a9aLink ? "border-destructive" : ""}`}
                  />
                  {fieldErrors.cha9a9aLink && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.cha9a9aLink}
                    </p>
                  )}
                </div>

                {/* Target Amount */}
                <div className="space-y-2">
                  <Label htmlFor="targetAmount" className="flex justify-between items-center">
                    Montant cible (TND) <span className="text-destructive">*</span>
                    {validFields.targetAmount && (
                      <span className="text-emerald-600 text-sm flex items-center gap-1">
                        <Check className="h-4 w-4" /> Valide
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="targetAmount"
                      type="number"
                      min="1"
                      placeholder="5000"
                      value={formData.targetAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, targetAmount: value });
                        clearFieldError("targetAmount");
                        const amount = parseInt(value);
                        setValidFields((p) => ({ ...p, targetAmount: !isNaN(amount) && amount > 0 }));
                      }}
                      className={`h-12 rounded-2xl text-lg font-medium ${validFields.targetAmount ? "border-emerald-500 focus-visible:ring-emerald-500" : fieldErrors.targetAmount ? "border-destructive" : ""}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">TND</span>
                  </div>
                  {fieldErrors.targetAmount && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.targetAmount}
                    </p>
                  )}
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>Image de couverture (optionnel)</Label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  {formData.coverImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/50 shadow group">
                      <img
                        src={formData.coverImage}
                        alt="Prévisualisation"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((p) => ({ ...p, coverImage: "" }));
                          setValidFields((p) => ({ ...p, coverImage: false }));
                          if (coverInputRef.current) coverInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute bottom-2 right-2 text-xs px-3 py-1.5 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={coverUploading}
                      className="w-full h-36 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-500 transition-colors flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 bg-white/40 dark:bg-zinc-900/40"
                    >
                      {coverUploading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-rose-500 border-r-transparent" />
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8" />
                          <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
                          <span className="text-xs">JPG, PNG, WebP — max 10 Mo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Urgent Checkbox */}
                <div className="flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 p-5 rounded-3xl border border-white/50 dark:border-white/10">
                  <Checkbox
                    id="isUrgent"
                    checked={formData.isUrgent}
                    onCheckedChange={(checked) => setFormData({ ...formData, isUrgent: !!checked })}
                  />
                  <Label htmlFor="isUrgent" className="cursor-pointer text-base font-medium">
                    Marquer ce cas comme urgent
                  </Label>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={createCaseMutation.isPending}
                    className="flex-1 h-14 text-lg font-semibold rounded-3xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 shadow-xl"
                  >
                    {createCaseMutation.isPending ? "Publication en cours..." : "Publier le cas solidaire"}
                  </Button>
                  <Button type="button" variant="outline" asChild className="h-14 rounded-3xl">
                    <Link href="/">Annuler</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}