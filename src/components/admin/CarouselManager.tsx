import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    LayoutList,
    Plus,
    Pencil,
    Trash2,
    ChevronUp,
    ChevronDown,
    LayoutDashboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CarouselSlideRow } from "@/data/carouselSlides";

type SlideWithWorkflowTitle = CarouselSlideRow & { workflow_title?: string };

const emptyAdForm = {
    title: "",
    description: "",
    cta_label: "",
    cta_href: "",
    image_url: "",
};

const emptyHighlightForm = {
    workflow_id: "",
};

export const CarouselManager = () => {
    const { toast } = useToast();
    const [slides, setSlides] = useState<SlideWithWorkflowTitle[]>([]);
    const [workflows, setWorkflows] = useState<{ id: string; title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [editingSlide, setEditingSlide] = useState<CarouselSlideRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [slideType, setSlideType] = useState<"ad" | "highlight">("ad");
    const [adForm, setAdForm] = useState(emptyAdForm);
    const [highlightForm, setHighlightForm] = useState(emptyHighlightForm);

    useEffect(() => {
        fetchSlides();
        fetchWorkflows();
    }, []);

    const fetchSlides = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("carousel_slides")
                .select("*")
                .order("sort_order", { ascending: true });

            if (error) throw error;

            // Resolve workflow titles for highlight slides
            const rows = (data as CarouselSlideRow[]) || [];
            const workflowIds = rows
                .filter((r) => r.slide_type === "highlight" && r.workflow_id)
                .map((r) => r.workflow_id as string);

            let titleMap: Record<string, string> = {};
            if (workflowIds.length > 0) {
                const { data: wfData } = await supabase
                    .from("workflows")
                    .select("id, title")
                    .in("id", workflowIds);
                for (const wf of wfData || []) {
                    titleMap[wf.id] = wf.title;
                }
            }

            setSlides(
                rows.map((r) => ({
                    ...r,
                    workflow_title: r.workflow_id ? titleMap[r.workflow_id] : undefined,
                }))
            );
        } catch (err: any) {
            toast({ title: "Error loading slides", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkflows = async () => {
        const { data } = await supabase
            .from("workflows")
            .select("id, title")
            .order("title", { ascending: true });
        setWorkflows(data || []);
    };

    const openAddDialog = () => {
        setEditingSlide(null);
        setSlideType("ad");
        setAdForm(emptyAdForm);
        setHighlightForm(emptyHighlightForm);
        setIsDialogOpen(true);
    };

    const openEditDialog = (slide: CarouselSlideRow) => {
        setEditingSlide(slide);
        setSlideType(slide.slide_type);
        if (slide.slide_type === "ad") {
            setAdForm({
                title: slide.title || "",
                description: slide.description || "",
                cta_label: slide.cta_label || "",
                cta_href: slide.cta_href || "",
                image_url: slide.image_url || "",
            });
        } else {
            setHighlightForm({ workflow_id: slide.workflow_id || "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        setDialogLoading(true);
        try {
            const maxOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.sort_order)) : -1;
            const payload: Partial<CarouselSlideRow> =
                slideType === "ad"
                    ? {
                          slide_type: "ad",
                          title: adForm.title.trim() || null,
                          description: adForm.description.trim() || null,
                          cta_label: adForm.cta_label.trim() || null,
                          cta_href: adForm.cta_href.trim() || null,
                          image_url: adForm.image_url.trim() || null,
                          workflow_id: null,
                          sort_order: editingSlide ? editingSlide.sort_order : maxOrder + 1,
                      }
                    : {
                          slide_type: "highlight",
                          workflow_id: highlightForm.workflow_id || null,
                          title: null,
                          description: null,
                          cta_label: null,
                          cta_href: null,
                          image_url: null,
                          sort_order: editingSlide ? editingSlide.sort_order : maxOrder + 1,
                      };

            if (editingSlide) {
                const { error } = await supabase
                    .from("carousel_slides")
                    .update(payload)
                    .eq("id", editingSlide.id);
                if (error) throw error;
                toast({ title: "Slide updated" });
            } else {
                const { error } = await supabase.from("carousel_slides").insert(payload);
                if (error) throw error;
                toast({ title: "Slide added" });
            }

            setIsDialogOpen(false);
            fetchSlides();
        } catch (err: any) {
            toast({ title: "Save failed", description: err.message, variant: "destructive" });
        } finally {
            setDialogLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from("carousel_slides").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Slide deleted" });
            setDeleteTarget(null);
            fetchSlides();
        } catch (err: any) {
            toast({ title: "Delete failed", description: err.message, variant: "destructive" });
        }
    };

    const moveSlide = async (index: number, direction: "up" | "down") => {
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= slides.length) return;

        const a = slides[index];
        const b = slides[swapIndex];

        try {
            await Promise.all([
                supabase
                    .from("carousel_slides")
                    .update({ sort_order: b.sort_order })
                    .eq("id", a.id),
                supabase
                    .from("carousel_slides")
                    .update({ sort_order: a.sort_order })
                    .eq("id", b.id),
            ]);
            fetchSlides();
        } catch (err: any) {
            toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
        }
    };

    const slideLabel = (slide: SlideWithWorkflowTitle) => {
        if (slide.slide_type === "ad") return slide.title || "(no title)";
        return slide.workflow_title || slide.workflow_id || "(no workflow)";
    };

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LayoutList className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>Carousel Manager</CardTitle>
                            <CardDescription className="mt-0.5">
                                Manage promotional ad slides and workflow highlights shown on the homepage.
                            </CardDescription>
                        </div>
                    </div>
                    <Button onClick={openAddDialog} className="gap-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Add slide
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <p className="text-muted-foreground text-sm py-8 text-center">Loading slides…</p>
                ) : slides.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <LayoutDashboard className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground">No carousel slides yet.</p>
                        <Button onClick={openAddDialog} variant="outline" className="gap-2 cursor-pointer">
                            <Plus className="h-4 w-4" />
                            Add first slide
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Title / Workflow</TableHead>
                                <TableHead className="hidden md:table-cell">CTA / Link</TableHead>
                                <TableHead className="w-36 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {slides.map((slide, idx) => (
                                <TableRow key={slide.id} className="hover:bg-secondary/30 transition-colors duration-200">
                                    <TableCell className="text-muted-foreground text-xs">{slide.sort_order}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                slide.slide_type === "ad"
                                                    ? "border-primary/30 text-primary"
                                                    : "border-purple-500/30 text-purple-400"
                                            }
                                        >
                                            {slide.slide_type === "ad" ? "Ad" : "Highlight"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{slideLabel(slide)}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                        {slide.slide_type === "ad"
                                            ? slide.cta_label
                                                ? `${slide.cta_label} → ${slide.cta_href || ""}`
                                                : "—"
                                            : slide.workflow_id || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Move slide up"
                                                disabled={idx === 0}
                                                onClick={() => moveSlide(idx, "up")}
                                                className="h-8 w-8 cursor-pointer hover:bg-secondary/50 transition-colors duration-200"
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Move slide down"
                                                disabled={idx === slides.length - 1}
                                                onClick={() => moveSlide(idx, "down")}
                                                className="h-8 w-8 cursor-pointer hover:bg-secondary/50 transition-colors duration-200"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Edit slide"
                                                onClick={() => openEditDialog(slide)}
                                                className="h-8 w-8 cursor-pointer hover:bg-secondary/50 transition-colors duration-200"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Delete slide"
                                                onClick={() => setDeleteTarget(slide.id)}
                                                className="h-8 w-8 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingSlide ? "Edit slide" : "Add slide"}</DialogTitle>
                        <DialogDescription>
                            {editingSlide
                                ? "Update the slide content below."
                                : "Choose a slide type and fill in the details."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Slide type selector (disabled when editing) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="slide-type">Slide type</Label>
                            <Select
                                value={slideType}
                                onValueChange={(v) => setSlideType(v as "ad" | "highlight")}
                                disabled={!!editingSlide}
                            >
                                <SelectTrigger id="slide-type" className="cursor-pointer">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ad" className="cursor-pointer">Ad – promotional message</SelectItem>
                                    <SelectItem value="highlight" className="cursor-pointer">Highlight – featured workflow</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {slideType === "ad" ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ad-title">Headline</Label>
                                    <Input
                                        id="ad-title"
                                        placeholder="Pro workflows, ready to use"
                                        value={adForm.title}
                                        onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ad-desc">Short copy</Label>
                                    <Textarea
                                        id="ad-desc"
                                        placeholder="Deploy in minutes. Built by automation experts…"
                                        rows={2}
                                        value={adForm.description}
                                        onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="cta-label">CTA label</Label>
                                        <Input
                                            id="cta-label"
                                            placeholder="Browse workflows"
                                            value={adForm.cta_label}
                                            onChange={(e) => setAdForm({ ...adForm, cta_label: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="cta-href">CTA link</Label>
                                        <Input
                                            id="cta-href"
                                            placeholder="#workflows"
                                            value={adForm.cta_href}
                                            onChange={(e) => setAdForm({ ...adForm, cta_href: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="image-url">Image URL (optional)</Label>
                                    <Input
                                        id="image-url"
                                        placeholder="https://…"
                                        value={adForm.image_url}
                                        onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1.5">
                                <Label htmlFor="workflow-select">Workflow</Label>
                                <Select
                                    value={highlightForm.workflow_id}
                                    onValueChange={(v) => setHighlightForm({ workflow_id: v })}
                                >
                                    <SelectTrigger id="workflow-select" className="cursor-pointer">
                                        <SelectValue placeholder="Select a workflow…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workflows.map((wf) => (
                                            <SelectItem key={wf.id} value={wf.id} className="cursor-pointer">
                                                {wf.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={dialogLoading}
                            className="cursor-pointer"
                        >
                            {dialogLoading ? "Saving…" : editingSlide ? "Save changes" : "Add slide"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete slide?</DialogTitle>
                        <DialogDescription>
                            This slide will be permanently removed from the carousel. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && handleDelete(deleteTarget)}
                            className="cursor-pointer"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
