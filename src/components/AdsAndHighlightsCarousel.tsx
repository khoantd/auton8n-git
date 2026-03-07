import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Zap, Clock, Users } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Workflow } from "@/components/WorkflowCard";
import type { AdSlide, CarouselSlide } from "@/data/carouselSlides";

interface AdsAndHighlightsCarouselProps {
  slides: CarouselSlide[];
  onWorkflowClick: (workflow: Workflow) => void;
}

const AD_ICONS = [Zap, Clock, Users] as const;

const defaultCoverImage =
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=80";

function AdSlideCard({ slide, adIndex }: { slide: AdSlide; adIndex: number }) {
  const Icon = AD_ICONS[adIndex % AD_ICONS.length];

  return (
    <article className="group relative flex flex-col h-full rounded-xl card-gradient border border-border p-6 card-shadow hover:card-shadow-hover hover:border-primary/30 transition-colors duration-200 overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex-1">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 mb-4">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
          {slide.headline}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {slide.description}
        </p>
      </div>

      <a
        href={slide.ctaHref}
        className="inline-flex items-center gap-2 mt-6 self-start px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {slide.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}

function HighlightSlideCard({
  workflow,
  onClick,
}: {
  workflow: Workflow;
  onClick: (w: Workflow) => void;
}) {
  const coverImage = workflow.coverImage || defaultCoverImage;

  return (
    <article
      role="button"
      tabIndex={0}
      className="group relative flex flex-col h-full rounded-xl card-gradient border border-border card-shadow hover:card-shadow-hover hover:border-primary/30 transition-colors duration-200 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Open workflow: ${workflow.title}`}
      onClick={() => onClick(workflow)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(workflow);
        }
      }}
    >
      {/* Cover image */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden">
        <img
          src={coverImage}
          alt={workflow.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultCoverImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        {workflow.isPro && (
          <span className="absolute top-3 right-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider backdrop-blur-sm">
            Pro
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {workflow.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {workflow.description}
        </p>
        <div className="mt-auto flex items-center gap-2">
          <img
            src={workflow.author.avatar}
            alt={workflow.author.name}
            className="h-5 w-5 rounded-full bg-secondary"
          />
          <span className="text-xs text-muted-foreground truncate">
            {workflow.author.name}
          </span>
        </div>
      </div>
    </article>
  );
}

export const AdsAndHighlightsCarousel = ({
  slides,
  onWorkflowClick,
}: AdsAndHighlightsCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setSelectedIndex(embla.selectedScrollSnap());
    setScrollSnaps(embla.scrollSnapList());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  if (slides.length === 0) return null;

  return (
    <section className="py-8" aria-labelledby="promo-heading">
      <div className="container mx-auto px-4">
        <h2 id="promo-heading" className="text-xl md:text-2xl font-semibold mb-6">
          <span className="text-foreground">Featured</span>{" "}
          <span className="text-muted-foreground">offers and highlights</span>
        </h2>
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "start" }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem
                key={slide.kind === "ad" ? `ad-${slide.data.id}` : `hl-${slide.data.id}`}
                className="basis-[85%] md:basis-[45%] lg:basis-[30%]"
              >
                <div className="h-full">
                  {slide.kind === "ad" ? (
                    <AdSlideCard slide={slide.data} adIndex={slide.adIndex} />
                  ) : (
                    <HighlightSlideCard workflow={slide.data} onClick={onWorkflowClick} />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 z-10" />
          <CarouselNext className="right-2 z-10" />
        </Carousel>

        {/* Dot indicators */}
        {scrollSnaps.length > 1 && (
          <div
            className="flex justify-center gap-2 mt-5"
            role="tablist"
            aria-label="Carousel slide indicators"
          >
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === selectedIndex}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => api?.scrollTo(idx)}
                className={`h-1.5 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  idx === selectedIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
