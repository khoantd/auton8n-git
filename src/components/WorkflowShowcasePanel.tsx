import type { Workflow } from "@/components/WorkflowCard";

interface WorkflowShowcasePanelProps {
    workflow: Workflow;
    type: 'instructions' | 'video';
}

export const WorkflowShowcasePanel = ({ workflow, type }: WorkflowShowcasePanelProps) => {
    if (type === 'instructions' && workflow.instructions) {
        return (
            <div className="bg-green-100 dark:bg-green-950/40 border-2 border-green-300 dark:border-green-600 rounded-lg p-4 sm:p-6 pb-6 sm:pb-8 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-green-800 dark:text-green-200">Try It Out!</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-green-900/90 dark:prose-p:text-green-100/90">
                    <div
                        className="text-sm text-green-900/95 dark:text-green-100/95 whitespace-pre-wrap [&_strong]:text-green-900 dark:[&_strong]:text-green-100 [&_code]:bg-green-200/60 dark:[&_code]:bg-green-800/50 [&_code]:text-green-900 dark:[&_code]:text-green-100 [&_code]:px-1 [&_code]:rounded [&_br]:block"
                        dangerouslySetInnerHTML={{ __html: workflow.instructions }}
                    />
                </div>
            </div>
        );
    }

    if (type === 'video' && workflow.videoUrl) {
        return (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2">
                    <span className="font-semibold">Video Tutorial</span>
                </div>
                <div className="aspect-video">
                    <iframe
                        src={workflow.videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        );
    }

    return null;
};
