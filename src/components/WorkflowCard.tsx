import { Bot, FileText, Mail, Database, Zap, Globe, MessageSquare, Calendar, Heart } from "lucide-react";

export interface Workflow {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  integrations: string[];
  views: number;
  featured?: boolean;
  isPro?: boolean;
  price?: number;
  coverImage?: string;
  workflowJson?: string; // n8n workflow JSON as string
  videoUrl?: string; // Tutorial video URL
  instructions?: string; // "Try It Out" instructions
  createdAt?: string;
}

const integrationIcons: Record<string, React.ReactNode> = {
  "OpenAI": <Bot className="h-4 w-4" />,
  "Google Sheets": <FileText className="h-4 w-4" />,
  "Gmail": <Mail className="h-4 w-4" />,
  "Slack": <MessageSquare className="h-4 w-4" />,
  "PostgreSQL": <Database className="h-4 w-4" />,
  "Webhook": <Zap className="h-4 w-4" />,
  "HTTP": <Globe className="h-4 w-4" />,
  "Google Calendar": <Calendar className="h-4 w-4" />,
};

interface WorkflowCardProps {
  workflow: Workflow;
  index?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const WorkflowCard = ({ workflow, index = 0, isFavorite = false, onToggleFavorite }: WorkflowCardProps) => {
  const displayedIntegrations = workflow.integrations.slice(0, 3);
  const remainingCount = workflow.integrations.length - 3;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(workflow.id);
  };

  const defaultCoverImage = "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=80";
  const coverImage = workflow.coverImage || defaultCoverImage;

  return (
    <article
      className="group relative rounded-xl card-gradient border border-border p-5 card-shadow hover:card-shadow-hover hover:border-primary/30 transition-all duration-300 cursor-pointer animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {workflow.featured && (
        <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      {/* Cover Image */}
      <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-secondary/50">
        <img
          src={coverImage}
          alt={workflow.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultCoverImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>

      {/* Favorite button - min 44px touch target for accessibility */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 z-10 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all duration-200 hover:scale-110"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-5 w-5 transition-colors duration-200 ${isFavorite
            ? "fill-primary text-primary"
            : "text-muted-foreground hover:text-primary"
            }`}
        />
      </button>

      {/* Integrations */}
      <div className="flex items-center gap-2 mb-4">
        {displayedIntegrations.map((integration, i) => (
          <div
            key={i}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/80 text-muted-foreground group-hover:text-foreground transition-colors"
            title={integration}
          >
            {integrationIcons[integration] || <Zap className="h-4 w-4" />}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center h-8 px-2 rounded-lg bg-secondary/80 text-sm text-muted-foreground">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors pr-8">
        {workflow.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {workflow.description}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <img
          src={workflow.author.avatar}
          alt={workflow.author.name}
          className="h-8 w-8 rounded-full bg-secondary"
        />
        <span className="text-sm text-muted-foreground">{workflow.author.name}</span>
        {workflow.featured && !workflow.isPro && (
          <span className="ml-auto text-xs text-primary font-medium">Featured</span>
        )}
        {workflow.isPro && (
          <span className="ml-auto inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
            Pro
          </span>
        )}
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent" />
      </div>
    </article>
  );
};
