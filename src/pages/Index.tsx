import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { WorkflowCard, Workflow } from "@/components/WorkflowCard";
import { FeaturedWorkflow } from "@/components/FeaturedWorkflow";
import { AdsAndHighlightsCarousel } from "@/components/AdsAndHighlightsCarousel";
import {
  adSlides as staticAdSlides,
  buildOrderedSlides,
  buildFallbackOrderedSlides,
  type CarouselSlide,
  type CarouselSlideRow,
} from "@/data/carouselSlides";
import { WorkflowDetailModal } from "@/components/WorkflowDetailModal";
import { WorkflowPagination } from "@/components/WorkflowPagination";
import { usePagination } from "@/hooks/usePagination";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 9;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselRows, setCarouselRows] = useState<CarouselSlideRow[]>([]);
  const [carouselLoaded, setCarouselLoaded] = useState(false);
  const [carouselError, setCarouselError] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workflows")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mappedWorkflows: Workflow[] = data.map((w: any) => ({
          id: w.id,
          title: w.title,
          description: w.description || "",
          author: {
            name: w.author_name || "Unknown",
            avatar: w.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.author_name || 'anon'}`,
          },
          category: w.category || "General",
          integrations: Array.isArray(w.integrations) ? w.integrations : [],
          views: w.views || 0,
          featured: w.featured,
          createdAt: w.created_at,
          isPro: w.is_pro,
          price: w.price,
          coverImage: w.cover_image,
          workflowJson: (() => {
            const raw = w.workflow_json ?? w.workflowJson;
            if (raw == null || raw === "") return undefined;
            return typeof raw === "string" ? raw : JSON.stringify(raw);
          })(),
          videoUrl: w.video_url,
          instructions: w.instructions,
        }));

        setWorkflows(mappedWorkflows);
      } catch (error) {
        console.error("Error fetching workflows:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  useEffect(() => {
    const fetchCarouselSlides = async () => {
      setCarouselLoaded(false);
      setCarouselError(false);
      try {
        const { data, error } = await supabase
          .from("carousel_slides")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error) throw error;
        setCarouselRows((data as CarouselSlideRow[]) ?? []);
      } catch {
        setCarouselError(true);
        setCarouselRows([]);
      } finally {
        setCarouselLoaded(true);
      }
    };

    fetchCarouselSlides();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const workflow of workflows) {
      if (workflow.category) {
        set.add(workflow.category);
      }
    }
    return Array.from(set).sort();
  }, [workflows]);

  const featuredWorkflows = useMemo(
    () =>
      workflows
        .filter((w) => w.featured)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 6),
    [workflows]
  );

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.integrations.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = activeCategory === null || workflow.category === activeCategory;
      const matchesFavorites = !showFavoritesOnly || isFavorite(workflow.id);

      return matchesSearch && matchesCategory && matchesFavorites && !workflow.featured;
    });
  }, [workflows, searchQuery, activeCategory, showFavoritesOnly, isFavorite]);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedWorkflows,
    goToPage,
  } = usePagination({ items: filteredWorkflows, itemsPerPage: ITEMS_PER_PAGE });

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setModalOpen(true);
  };

  const workflowById = useMemo(
    () => Object.fromEntries(workflows.map((w) => [w.id, w])),
    [workflows]
  );

  const carouselSlides: CarouselSlide[] = useMemo(() => {
    if (carouselRows.length > 0) return buildOrderedSlides(carouselRows, workflowById);
    return buildFallbackOrderedSlides(staticAdSlides, featuredWorkflows);
  }, [carouselRows, workflowById, featuredWorkflows]);

  const workflowCount = workflows.length * 636;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink/10 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
              <span className="text-primary">{workflowCount.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">Workflow</span>
              <br />
              <span className="text-foreground">Automation Templates</span>
            </h1>



            {/* Search */}
            <div className="mt-8 mb-8">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search apps, roles, usecases..."
              />
            </div>

            {/* Categories */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${showFavoritesOnly
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-primary" : ""}`} />
                Favorites
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Promo & Highlights Carousel */}
      {!searchQuery && !activeCategory && (
        <>
          {!carouselLoaded && (
            <section className="py-8" aria-label="Carousel loading">
              <div className="container mx-auto px-4">
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-48 min-w-[85%] md:min-w-[45%] lg:min-w-[30%] rounded-xl bg-muted/50 animate-pulse"
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
          {carouselLoaded && carouselError && (
            <section className="py-4" aria-live="polite">
              <div className="container mx-auto px-4 text-center">
                <p className="text-sm text-muted-foreground">Featured content is temporarily unavailable.</p>
              </div>
            </section>
          )}
          {carouselLoaded && !carouselError && carouselSlides.length > 0 && (
            <AdsAndHighlightsCarousel slides={carouselSlides} onWorkflowClick={handleWorkflowClick} />
          )}
        </>
      )}

      {/* Featured Section */}
      {featuredWorkflows.length > 0 && !searchQuery && !activeCategory && (
        <section className="py-8" aria-labelledby="featured-heading">
          <div className="container mx-auto px-4">
            <h2 id="featured-heading" className="text-xl md:text-2xl font-semibold mb-6">
              <span className="text-foreground">Newcomer</span>{" "}
              <span className="text-muted-foreground">essentials: learn by doing</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  aria-label={`Open ${workflow.title}`}
                  onClick={() => handleWorkflowClick(workflow)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleWorkflowClick(workflow);
                    }
                  }}
                >
                  <FeaturedWorkflow workflow={workflow} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Workflow Grid */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground animate-pulse">Discovery premium workflows...</p>
            </div>
          ) : paginatedWorkflows.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {paginatedWorkflows.map((workflow, index) => (
                  <div key={workflow.id} onClick={() => handleWorkflowClick(workflow)}>
                    <WorkflowCard
                      workflow={workflow}
                      index={index}
                      isFavorite={isFavorite(workflow.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                ))}
              </div>

              <WorkflowPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No workflows found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                }}
                className="mt-4 text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Workflow Detail Modal */}
      <WorkflowDetailModal
        workflow={selectedWorkflow}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;
