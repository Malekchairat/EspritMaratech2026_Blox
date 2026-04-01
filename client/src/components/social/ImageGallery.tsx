import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: { id: number; imageUrl: string; displayOrder: number }[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
      <img
        src={sorted[currentIndex].imageUrl}
        alt={`Image ${currentIndex + 1}`}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />

      {sorted.length > 1 && (
        <>
          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {currentIndex < sorted.length - 1 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={() => setCurrentIndex(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Dots indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  i === currentIndex
                    ? "bg-white scale-110"
                    : "bg-white/50 hover:bg-white/75"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
