import React, { useState, useEffect } from 'react';
import { fetchRepoContents, fetchWorkflowFile, normalizeWorkflow } from '@/services/githubService';
import { GithubItem, N8nWorkflow } from '@/types';
import { Folder, FileJson, ChevronRight, Loader2, Search, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface GithubWorkflowBrowserProps {
  onSelectWorkflow: (workflow: N8nWorkflow) => void;
  selectedWorkflow?: N8nWorkflow | null;
}

const GithubWorkflowBrowser: React.FC<GithubWorkflowBrowserProps> = ({ 
  onSelectWorkflow, 
  selectedWorkflow 
}) => {
  const [items, setItems] = useState<GithubItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  const loadFolder = async (path: string) => {
    setLoading(true);
    try {
      const data = await fetchRepoContents(path);
      setItems(data);
      setCurrentPath(path);
      setBreadcrumb(path ? path.split('/') : []);
    } catch (error) {
      console.error('Failed to load folder:', error);
      toast({
        title: "Error",
        description: "Failed to load repository contents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolder('');
  }, []);

  const handleItemClick = async (item: GithubItem) => {
    if (item.type === 'dir') {
      loadFolder(item.path);
    } else if (item.name.endsWith('.json')) {
      setLoading(true);
      try {
        if (!item.download_url) {
          throw new Error('No download URL available');
        }

        const rawWorkflow = await fetchWorkflowFile(item.download_url);
        if (rawWorkflow) {
          const normalized = normalizeWorkflow(rawWorkflow);
          if (normalized) {
            onSelectWorkflow(normalized);
            toast({
              title: "Success",
              description: `Loaded workflow: ${item.name}`
            });
          } else {
            toast({
              title: "Invalid Workflow",
              description: `"${item.name}" is not a valid n8n workflow format`,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Load Failed",
            description: `Failed to load workflow from "${item.name}"`,
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error('Failed to load workflow:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
          toast({
            title: "Invalid JSON",
            description: `"${item.name}" contains invalid JSON`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to load "${item.name}": ${errorMessage}`,
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = breadcrumb.slice(0, index + 1).join('/');
    loadFolder(newPath);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const isItemSelected = (item: GithubItem) => {
    return selectedWorkflow && item.type === 'file' && 
           item.name.endsWith('.json') && 
           loading === false;
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Github className="w-5 h-5" />
          <h2 className="text-lg font-semibold">GitHub Repository</h2>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 mb-3 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadFolder('')}
            className="h-6 px-2"
          >
            Root
          </Button>
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3 h-3" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBreadcrumbClick(index)}
                className="h-6 px-2"
              >
                {crumb}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileJson className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {search ? 'No items found matching your search' : 'This folder is empty'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Button
                key={item.path}
                variant={isItemSelected(item) ? "secondary" : "ghost"}
                className="w-full justify-start h-8 px-3"
                onClick={() => handleItemClick(item)}
                disabled={loading}
              >
                {item.type === 'dir' ? (
                  <Folder className="w-4 h-4 mr-2 text-blue-500" />
                ) : (
                  <FileJson className="w-4 h-4 mr-2 text-green-500" />
                )}
                <span className="truncate">{item.name}</span>
                {item.type === 'dir' && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>enescingoz/awesome-n8n-templates</span>
          <a 
            href="https://github.com/enescingoz/awesome-n8n-templates"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default GithubWorkflowBrowser;
