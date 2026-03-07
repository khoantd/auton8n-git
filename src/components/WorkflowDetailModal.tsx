import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Bot, FileText, Mail, Database, Zap, Globe, MessageSquare, Calendar, Download, Copy, Eye, ShoppingCart, CheckCircle2 } from "lucide-react";
import type { Workflow } from "@/components/WorkflowCard";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { N8nWorkflowDemo } from "@/components/N8nWorkflowDemo";

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

interface WorkflowDetailModalProps {
  workflow: Workflow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { useSubscription } from "@/contexts/SubscriptionContext";

export const WorkflowDetailModal = ({ workflow, open, onOpenChange }: WorkflowDetailModalProps) => {
  const { session } = useAuth();
  const { addToCart } = useCart();
  const { ownedWorkflowIds, isPro } = useSubscription();
  const navigate = useNavigate();

  const isOwned = workflow ? ownedWorkflowIds.includes(workflow.id) || (workflow.isPro && isPro) : false;

  const defaultCoverImage = "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=80";
  const coverImage = workflow?.coverImage || defaultCoverImage;

  if (!workflow) return null;

  const handleDownload = () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to download workflows.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Simulate download
    const workflowData = JSON.stringify(workflow, null, 2);
    const blob = new Blob([workflowData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow.title.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Workflow downloaded",
      description: "The workflow template has been downloaded to your device.",
    });
  };

  const handlePurchase = () => {
    if (!workflow) return;

    addToCart({
      id: `wf-${workflow.id}`,
      name: workflow.title,
      price: workflow.price || 0,
      description: "Individual Workflow License",
    });

    // Simulate successful purchase in this demo context if user clicks through
    // For now we just add it to cart. The "owned" state would normally be set after payment.
    toast({
      title: "Added to cart",
      description: "Complete checkout to own this workflow forever.",
    });
  };

  const handleCopyLink = () => {
    if (!workflow.workflowJson) {
      toast({
        title: "Workflow JSON not available",
        description: "This workflow does not have JSON data to copy.",
        variant: "destructive",
      });
      return;
    }
    let jsonToCopy = workflow.workflowJson;
    try {
      jsonToCopy = JSON.stringify(JSON.parse(workflow.workflowJson), null, 2);
    } catch {
      // fall back to raw string
    }
    navigator.clipboard.writeText(jsonToCopy);
    toast({
      title: "Workflow JSON copied",
      description: "Workflow JSON has been copied to clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex !flex-col !gap-0 bg-card border-border overflow-hidden rounded-none sm:rounded-lg !p-4 sm:!p-6 !w-screen sm:!w-[95vw] !max-w-none sm:!max-w-2xl !h-[100dvh] sm:!h-[90vh] !max-h-[100dvh] sm:!max-h-[90vh] !inset-0 sm:!inset-auto !left-0 sm:!left-[50%] !top-0 sm:!top-[50%] !translate-x-0 sm:!translate-x-[-50%] !translate-y-0 sm:!translate-y-[-50%]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="category">{workflow.category}</Badge>
            {workflow.featured && <Badge variant="default">Featured</Badge>}
            {workflow.isPro && (
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                PRO
              </Badge>
            )}
            {isOwned && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                OWNED
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground pr-8">
            {workflow.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm sm:text-base mt-2">
            {workflow.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-6 pr-1">
        {/* Cover Image */}
        <div className="relative w-full h-36 sm:h-48 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden border border-border -mt-2">
          <img
            src={coverImage}
            alt={workflow.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultCoverImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Workflow preview only (no Quick Start / instructions panel) */}
        <>
          {workflow.workflowJson ? (
            <div className="n8n-demo-container relative flex-1 min-h-[280px] sm:min-h-[400px] rounded-lg sm:rounded-xl border border-border my-3 sm:my-4 overflow-hidden bg-secondary/30 flex flex-col">
              <N8nWorkflowDemo
                workflowJson={workflow.workflowJson}
                className="w-full h-full min-h-[280px] sm:min-h-[400px]"
              />
            </div>
          ) : (
            <div className="relative rounded-lg sm:rounded-xl bg-secondary/50 border border-border p-4 sm:p-8 my-3 sm:my-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                {workflow.integrations.map((integration, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border"
                  >
                    <span className="text-primary">
                      {integrationIcons[integration] || <Zap className="h-4 w-4" />}
                    </span>
                    <span className="text-sm text-foreground">{integration}</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              </div>
            </div>
          )}
        </>

        {/* Stats - clear separation from tab content so "Setup:" and stats don't collide */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-3 sm:py-4 mt-3 sm:mt-4 border-y border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{workflow.views.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{workflow.integrations.length} integrations</span>
          </div>
        </div>

        {/* Author - prevent avatar from overlapping text */}
        <div className="flex items-start gap-3 sm:gap-4 py-3 sm:py-4">
          <img
            src={workflow.author.avatar}
            alt={workflow.author.name}
            className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-secondary object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Created by</p>
            <p className="font-medium text-foreground truncate">{workflow.author.name}</p>
          </div>
        </div>

        {/* Actions - enough top spacing so buttons don't overlap "3. Send a POST..."; wrap and avoid truncation */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 sm:pt-6 mt-2 min-w-0 pr-10 sm:pr-8">
          {(!workflow.isPro || isOwned) ? (
            <Button onClick={handleDownload} className="gap-2 min-w-0 sm:flex-1">
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Download Workflow</span>
            </Button>
          ) : (
            <Button onClick={handlePurchase} className="gap-2 min-w-0 sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <ShoppingCart className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Purchase for ${workflow.price?.toFixed(2)}</span>
            </Button>
          )}
          {isOwned && (
            <Button variant="outline" onClick={handleCopyLink} className="gap-2 flex-shrink-0 whitespace-nowrap">
              <Copy className="h-4 w-4" />
              Copy JSON
            </Button>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
