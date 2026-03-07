import { Bot, Cpu, Database, Zap } from "lucide-react";
import type { Workflow } from "./WorkflowCard";

interface FeaturedWorkflowProps {
  workflow: Workflow;
}

export const FeaturedWorkflow = ({ workflow }: FeaturedWorkflowProps) => {
  const defaultCoverImage = "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=80";
  const coverImage = workflow.coverImage || defaultCoverImage;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-secondary/50 border border-border p-6 md:p-8 card-shadow hover:card-shadow-hover transition-all duration-300 cursor-pointer">
      {/* Glow effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Content */}
        <div className="flex-1">
          {/* Integrations */}
          <div className="flex items-center gap-2 mb-4">
            {workflow.integrations.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center h-9 w-9 rounded-lg bg-secondary text-muted-foreground"
              >
                <Bot className="h-4 w-4" />
              </div>
            ))}
            {workflow.integrations.length > 3 && (
              <div className="flex items-center justify-center h-9 px-3 rounded-lg bg-secondary text-sm text-muted-foreground">
                +{workflow.integrations.length - 3}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
            {workflow.title}
          </h3>

          {/* Author */}
          <div className="flex items-center gap-3">
            <img
              src={workflow.author.avatar}
              alt={workflow.author.name}
              className="h-8 w-8 rounded-full bg-secondary"
            />
            <span className="text-sm text-muted-foreground">{workflow.author.name}</span>
            <span className="ml-2 flex items-center gap-1 text-primary">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-medium">Verified</span>
            </span>
          </div>
        </div>

        {/* Visual representation */}
        <div className="relative flex-shrink-0 w-full md:w-72 h-40 rounded-xl overflow-hidden border border-border">
          <img
            src={coverImage}
            alt={workflow.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultCoverImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

          {/* Decorative dots */}
          <div className="absolute top-4 right-4 flex gap-1">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            <div className="h-2 w-2 rounded-full bg-primary/40" />
            <div className="h-2 w-2 rounded-full bg-primary/20" />
          </div>
        </div>
      </div>
    </article>
  );
};
