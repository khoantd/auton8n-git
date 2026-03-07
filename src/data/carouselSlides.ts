import type { Workflow } from "@/components/WorkflowCard";

// ─── Static types (frontend) ────────────────────────────────────────────────

export interface AdSlide {
  id: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
}

// ─── Ordered carousel slide (single list from backend) ────────────────────────

export type CarouselSlide =
  | { kind: "ad"; data: AdSlide; adIndex: number }
  | { kind: "highlight"; data: Workflow };

// ─── Database row type (mirrors app.carousel_slides) ────────────────────────

export interface CarouselSlideRow {
  id: string;
  created_at: string;
  slide_type: "ad" | "highlight";
  sort_order: number;
  // Ad fields
  title: string | null;
  description: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  // Highlight field
  workflow_id: string | null;
}

// ─── Static default ad slides (used as fallback when DB is empty) ────────────

export const adSlides: AdSlide[] = [
  {
    id: "pro-workflows",
    headline: "Pro workflows, ready to use",
    description:
      "Download and deploy in minutes. Built by automation experts, battle-tested in production.",
    ctaLabel: "Browse workflows",
    ctaHref: "#workflows",
  },
  {
    id: "start-automating",
    headline: "Start automating in minutes",
    description:
      "Instantly import any workflow into n8n. Save hours every week with a single click.",
    ctaLabel: "Get started",
    ctaHref: "#workflows",
  },
  {
    id: "join-automators",
    headline: "Join thousands of automators",
    description:
      "Community-built templates for every use case. Marketing, DevOps, AI, and more.",
    ctaLabel: "Explore templates",
    ctaHref: "#workflows",
  },
];

// ─── Build ordered slides from backend rows (preserves sort_order) ─────────────

export function buildOrderedSlides(
  rows: CarouselSlideRow[],
  workflowById: Record<string, Workflow>
): CarouselSlide[] {
  let adIndex = 0;
  const out: CarouselSlide[] = [];
  for (const r of rows) {
    if (r.slide_type === "ad") {
      out.push({
        kind: "ad",
        data: {
          id: r.id,
          headline: r.title ?? "",
          description: r.description ?? "",
          ctaLabel: r.cta_label ?? "",
          ctaHref: r.cta_href ?? "#",
          imageUrl: r.image_url ?? undefined,
        },
        adIndex: adIndex++,
      });
    } else if (r.slide_type === "highlight" && r.workflow_id) {
      const w = workflowById[r.workflow_id];
      if (w) out.push({ kind: "highlight", data: w });
    }
  }
  return out;
}

/** Fallback when DB has no rows: interleave static ad slides with highlight workflows (ad0, hl0, ad1, hl1, …). */
export function buildFallbackOrderedSlides(
  adSlides: AdSlide[],
  highlightWorkflows: Workflow[]
): CarouselSlide[] {
  const out: CarouselSlide[] = [];
  const maxLen = Math.max(adSlides.length, highlightWorkflows.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < adSlides.length) out.push({ kind: "ad", data: adSlides[i], adIndex: i });
    if (i < highlightWorkflows.length) out.push({ kind: "highlight", data: highlightWorkflows[i] });
  }
  return out;
}
