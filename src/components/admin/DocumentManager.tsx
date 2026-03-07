import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // uses schema "app" (documents)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, MoreVertical, FileText } from "lucide-react";
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

const ITEMS_PER_PAGE = 10;

export const DocumentManager = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        section: "General",
        content: "",
        order: 0
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .order("section", { ascending: true })
                .order("order", { ascending: true });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error: any) {
            toast({
                title: "Error fetching documents",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (doc: any = null) => {
        if (doc) {
            setEditingDocument(doc);
            setFormData({
                title: doc.title || "",
                slug: doc.slug || "",
                section: doc.section || "General",
                content: doc.content || "",
                order: doc.order || 0
            });
        } else {
            setEditingDocument(null);
            setFormData({
                title: "",
                slug: "",
                section: "General",
                content: "",
                order: 0
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingDocument) {
                const { error } = await supabase
                    .from("documents")
                    .update(formData)
                    .eq("id", editingDocument.id);
                if (error) throw error;

                if (user) {
                    await logActivity({
                        userId: user.id,
                        action: "update_document",
                        entityType: "document",
                        entityId: editingDocument.id,
                        description: `Updated document: ${formData.title}`,
                        metadata: formData
                    });
                }

                toast({ title: "Document updated successfully" });
            } else {
                const { data, error } = await supabase
                    .from("documents")
                    .insert([formData])
                    .select()
                    .single();

                if (error) throw error;

                if (user && data) {
                    await logActivity({
                        userId: user.id,
                        action: "create_document",
                        entityType: "document",
                        entityId: data.id,
                        description: `Created new document: ${formData.title}`,
                        metadata: formData
                    });
                }

                toast({ title: "Document created successfully" });
            }
            setIsDialogOpen(false);
            fetchDocuments();
        } catch (error: any) {
            toast({
                title: "Error saving document",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            const { error } = await supabase
                .from("documents")
                .delete()
                .eq("id", id);

            if (error) throw error;

            if (user) {
                await logActivity({
                    userId: user.id,
                    action: "delete_document",
                    entityType: "document",
                    entityId: id,
                    description: `Deleted document: ${title}`
                });
            }

            setDocuments(documents.filter(d => d.id !== id));
            toast({ title: "Document deleted" });
        } catch (error: any) {
            toast({
                title: "Error deleting document",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const filteredDocuments = documents.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedDocuments,
        goToPage,
    } = usePagination({ items: filteredDocuments, itemsPerPage: ITEMS_PER_PAGE });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10 h-10 bg-secondary/30"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    className="gap-2 h-10 shadow-lg shadow-primary/20"
                    onClick={() => handleOpenDialog()}
                >
                    <Plus className="h-4 w-4" /> Add Document
                </Button>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Documentation Pages</CardTitle>
                    <CardDescription>Manage your help guides and API references.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/20 border-border/50">
                                <TableHead className="w-[250px]">Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Section</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        Loading documents...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedDocuments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        No documents found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDocuments.map((doc) => (
                                    <TableRow key={doc.id} className="hover:bg-secondary/10 transition-colors border-border/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span>{doc.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                                                /{doc.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal border-border/50">
                                                {doc.section}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-mono text-muted-foreground">#{doc.order}</span>
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
                                                        onClick={() => handleOpenDialog(doc)}
                                                    >
                                                        <Edit2 className="h-4 w-4" /> Edit Content
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(doc.id, doc.title)}
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
                <DialogContent className="sm:max-w-[700px] bg-background/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle>{editingDocument ? "Edit Document" : "Add New Document"}</DialogTitle>
                        <DialogDescription>
                            Create or update documentation content.
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
                            <Label htmlFor="slug" className="text-right">Slug</Label>
                            <Input
                                id="slug"
                                className="col-span-3"
                                placeholder="e.g. getting-started"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="section" className="text-right">Section</Label>
                            <Input
                                id="section"
                                className="col-span-3"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order" className="text-right">Order</Label>
                            <Input
                                id="order"
                                type="number"
                                className="col-span-3"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="content" className="text-right">Content (Markdown)</Label>
                            <Textarea
                                id="content"
                                className="col-span-3 min-h-[250px] font-mono"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
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
