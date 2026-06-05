import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  /** Optional low-res thumbnail shown until the full image decodes. */
  thumbSrc?: string | null;
  /** Aspect ratio class (Tailwind) for the wrapper — prevents CLS. */
  ratioClassName?: string;
  /** Set to "eager" for above-the-fold LCP images. Defaults to "lazy". */
  loading?: "lazy" | "eager";
  fallback?: React.ReactNode;
}

/**
 * Lazy-loaded image with optional blurred thumbnail placeholder.
 * - `loading="lazy"` + `decoding="async"` keeps off-screen images cheap.
 * - Reserves space with `ratioClassName` to prevent layout shift.
 * - Fades the full image in once decoded.
 */
export function LazyImage({
  src,
  thumbSrc,
  alt,
  ratioClassName,
  className,
  loading = "lazy",
  fallback,
  onLoad,
  ...rest
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-xs text-muted-foreground", ratioClassName, className)}>
        {fallback ?? "No image"}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", ratioClassName)}>
      {thumbSrc && (
        <img
          src={thumbSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 h-full w-full object-cover blur-sm scale-105 transition-opacity duration-500",
            loaded ? "opacity-0" : "opacity-100",
          )}
          loading="lazy"
          decoding="async"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        // @ts-expect-error — fetchpriority is valid HTML, not in older React types
        fetchpriority={loading === "eager" ? "high" : "auto"}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn(
          "relative h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        {...rest}
      />
    </div>
  );
}