import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, MoreVertical, Star, ShieldCheck, Download, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { logActivity } from "@/utils/activity";
import { useAuth } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { WorkflowPagination } from "@/components/WorkflowPagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiUrl } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

export const WorkflowManager = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        price: 0,
        price_vnd: null as number | null,
        is_pro: false,
        featured: false,
        author_name: "Admin",
        author_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
        cover_image: "",
        workflow_json: "",
    });

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const response = await fetch(apiUrl("/api/admin/workflows"));
            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore
                }
                throw new Error(message);
            }

            const json = await response.json() as { workflows: any[] };
            setWorkflows(json.workflows || []);
        } catch (error: any) {
            toast({
                title: "Error fetching workflows",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = async (workflow: any = null) => {
        if (workflow) {
            setEditingWorkflow(workflow);
            setFormData({
                title: workflow.title || "",
                description: workflow.description || "",
                category: workflow.category || "",
                price: workflow.price || 0,
                price_vnd: workflow.price_vnd ?? null,
                is_pro: workflow.is_pro || false,
                featured: workflow.featured || false,
                author_name: workflow.author_name || "Admin",
                author_avatar: workflow.author_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
                cover_image: workflow.cover_image || "",
                workflow_json: "",
            });
            setIsDialogOpen(true);
            setDialogLoading(true);
            try {
                const response = await fetch(apiUrl(`/api/admin/workflows/${workflow.id}`));
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const json = await response.json() as { workflow: any };
                setFormData(prev => ({ ...prev, workflow_json: json.workflow.workflow_json || "" }));
            } catch (error: any) {
                toast({ title: "Error loading workflow JSON", description: error.message, variant: "destructive" });
            } finally {
                setDialogLoading(false);
            }
        } else {
            setEditingWorkflow(null);
            setFormData({
                title: "",
                description: "",
                category: "",
                price: 0,
                price_vnd: null,
                is_pro: false,
                featured: false,
                author_name: "Admin",
                author_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
                cover_image: "",
                workflow_json: "",
            });
            setIsDialogOpen(true);
        }
    };

    const handlePriceChange = (value: string) => {
        const nextPrice = Number.isNaN(parseFloat(value)) ? 0 : parseFloat(value);
        setFormData((prev) => ({
            ...prev,
            price: nextPrice,
            // Automatically mark as Pro when a positive price is set,
            // but don't override manual Pro settings when clearing the price.
            is_pro: nextPrice > 0 && !prev.is_pro ? true : prev.is_pro,
        }));
    };

    const handleSave = async () => {
        const workflowJsonValue = formData.workflow_json.trim();
        if (workflowJsonValue) {
            try {
                JSON.parse(workflowJsonValue);
            } catch {
                toast({ title: "Invalid JSON", description: "Workflow JSON must be valid JSON.", variant: "destructive" });
                return;
            }
        }
        const body = { ...formData, workflow_json: workflowJsonValue || null };

        try {
            if (editingWorkflow) {
                const response = await fetch(apiUrl(`/api/admin/workflows/${editingWorkflow.id}`), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    let message = `HTTP ${response.status}`;
                    try {
                        const json = await response.json();
                        message = json?.error ?? message;
                    } catch {
                        // ignore
                    }
                    throw new Error(message);
                }

                if (user) {
                    await logActivity({
                        userId: user.id,
                        action: "update_workflow",
                        entityType: "workflow",
                        entityId: editingWorkflow.id,
                        description: `Updated workflow: ${formData.title}`,
                        metadata: formData
                    });
                }

                toast({ title: "Workflow updated successfully" });
            } else {
                const response = await fetch(apiUrl("/api/admin/workflows"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    let message = `HTTP ${response.status}`;
                    try {
                        const json = await response.json();
                        message = json?.error ?? message;
                    } catch {
                        // ignore
                    }
                    throw new Error(message);
                }

                const { workflow } = await response.json() as { workflow: any };

                if (user && workflow) {
                    await logActivity({
                        userId: user.id,
                        action: "create_workflow",
                        entityType: "workflow",
                        entityId: workflow.id,
                        description: `Created new workflow: ${formData.title}`,
                        metadata: formData
                    });
                }

                toast({ title: "Workflow created successfully" });
            }
            setIsDialogOpen(false);
            fetchWorkflows();
        } catch (error: any) {
            toast({
                title: "Error saving workflow",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            const response = await fetch(apiUrl(`/api/admin/workflows/${id}`), {
                method: "DELETE",
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const json = await response.json();
                    message = json?.error ?? message;
                } catch {
                    // ignore
                }
                throw new Error(message);
            }

            if (user) {
                await logActivity({
                    userId: user.id,
                    action: "delete_workflow",
                    entityType: "workflow",
                    entityId: id,
                    description: `Deleted workflow: ${title}`
                });
            }

            setWorkflows(workflows.filter(w => w.id !== id));
            toast({ title: "Workflow deleted" });
        } catch (error: any) {
            toast({
                title: "Error deleting workflow",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleSyncFromGitHub = async () => {
        if (!confirm("Sync workflows from khoantd/awesome-n8n-templates?\n\nExisting titles will be skipped. This may take a minute.")) return;
        setSyncing(true);
        try {
            const response = await fetch(apiUrl("/api/admin/workflows/sync-from-github"), {
                method: "POST",
            });
            const json = await response.json() as { inserted?: number; skipped?: number; errors?: { path: string; message: string }[]; error?: string };
            if (!response.ok) throw new Error(json.error ?? `HTTP ${response.status}`);
            const { inserted = 0, skipped = 0, errors = [] } = json;
            toast({
                title: `Sync complete — ${inserted} inserted, ${skipped} skipped`,
                description: errors.length > 0 ? `${errors.length} file(s) failed. Check console for details.` : undefined,
                variant: errors.length > 0 ? "destructive" : "default",
            });
            if (errors.length > 0) console.warn("[GitHub sync] errors:", errors);
            if (inserted > 0) fetchWorkflows();
        } catch (error: any) {
            toast({ title: "Sync failed", description: error.message, variant: "destructive" });
        } finally {
            setSyncing(false);
        }
    };

    const filteredWorkflows = workflows.filter(w =>
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedWorkflows,
        goToPage,
    } = usePagination({ items: filteredWorkflows, itemsPerPage: ITEMS_PER_PAGE });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10 h-10 bg-secondary/30"
                        placeholder="Search workflows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    className="gap-2 h-10"
                    onClick={handleSyncFromGitHub}
                    disabled={syncing}
                >
                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing…" : "Sync from GitHub"}
                </Button>
                <Button
                    className="gap-2 h-10 shadow-lg shadow-primary/20"
                    onClick={() => handleOpenDialog()}
                >
                    <Plus className="h-4 w-4" /> Add Workflow
                </Button>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>All Workflows</CardTitle>
                    <CardDescription>Manage your marketplace product listings.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/20 border-border/50">
                                <TableHead className="w-[300px]">Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Download</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        Loading workflows...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedWorkflows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        No workflows found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedWorkflows.map((workflow) => (
                                    <TableRow key={workflow.id} className="hover:bg-secondary/10 transition-colors border-border/50">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{workflow.title}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                                                    {workflow.description}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                                                {workflow.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {workflow.price && workflow.price > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-primary">${workflow.price}</span>
                                                    {workflow.price_vnd && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {Number(workflow.price_vnd).toLocaleString()} VND
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                        {workflow.is_pro ? "Pro" : "Paid"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Free</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {workflow.featured && (
                                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
                                                        <Star className="h-3 w-3 fill-yellow-500" /> Featured
                                                    </Badge>
                                                )}
                                                {workflow.is_pro && (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                                                        <ShieldCheck className="h-3 w-3" /> Pro
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {workflow.downloadable ? (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                                                    <Download className="h-3 w-3" /> Downloadable
                                                </Badge>
                                            ) : workflow.is_pro ? (
                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Pro – no file
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-muted-foreground gap-1">
                                                    No file
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem
                                                        className="gap-2"
                                                        onClick={() => handleOpenDialog(workflow)}
                                                    >
                                                        <Edit2 className="h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(workflow.id, workflow.title)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <div className="p-4 border-t border-border/50">
                        <WorkflowPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={goToPage}
                        />
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle>{editingWorkflow ? "Edit Workflow" : "Add New Workflow"}</DialogTitle>
                        <DialogDescription>
                            Enter the details for the marketplace workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input
                                id="title"
                                className="col-span-3"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Input
                                id="category"
                                className="col-span-3"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Textarea
                                id="description"
                                className="col-span-3 min-h-[100px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                className="col-span-3"
                                value={formData.price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price_vnd" className="text-right">Price (VND)</Label>
                            <Input
                                id="price_vnd"
                                type="number"
                                placeholder="Optional, e.g. 500000"
                                className="col-span-3"
                                value={formData.price_vnd ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        price_vnd: val === "" ? null : Math.round(Number(val)),
                                    }));
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cover_image" className="text-right">Cover Image</Label>
                            <Input
                                id="cover_image"
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                className="col-span-3"
                                value={formData.cover_image}
                                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="workflow_json" className="text-right pt-3">Workflow JSON</Label>
                            <div className="col-span-3 space-y-1">
                                <Textarea
                                    id="workflow_json"
                                    className="min-h-[100px] font-mono text-xs"
                                    placeholder='{"nodes": [], "connections": {}}'
                                    value={formData.workflow_json}
                                    disabled={dialogLoading}
                                    onChange={(e) => setFormData({ ...formData, workflow_json: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {dialogLoading ? "Loading…" : "Optional. Required for purchase download. Paste n8n workflow JSON or use the seed script later."}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Is Pro?</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch
                                    checked={formData.is_pro}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_pro: checked })}
                                />
                                <span className="text-sm text-muted-foreground">Requires Pro subscription or purchase</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Featured?</Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch
                                    checked={formData.featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                                />
                                <span className="text-sm text-muted-foreground">Display in featured section</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
