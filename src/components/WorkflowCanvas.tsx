import React, { useEffect, useRef, useState } from 'react';
import { N8nWorkflow } from '../types';
import { AlertCircle, FileCode, Loader2, AlertTriangle } from 'lucide-react';

interface WorkflowCanvasProps {
  workflow: N8nWorkflow;
  onWorkflowChange?: (workflow: N8nWorkflow) => void;
  readOnly?: boolean;
  className?: string;
}

// Validate workflow structure with enhanced error reporting
const validateWorkflow = (wf: N8nWorkflow): { valid: boolean; error?: string; warnings?: string[] } => {
    const warnings: string[] = [];
    
    if (!wf) {
      return { valid: false, error: 'Workflow is null or undefined' };
    }
    
    if (!wf.nodes || !Array.isArray(wf.nodes) || wf.nodes.length === 0) {
      return { valid: false, error: 'Workflow must have at least one node' };
    }

    if (!wf.connections || typeof wf.connections !== 'object') {
      return { valid: false, error: 'Workflow must have a connections object' };
    }

    // Validate nodes have required fields
    for (let i = 0; i < wf.nodes.length; i++) {
      const node = wf.nodes[i];
      if (!node.id && !node.name) {
        return { valid: false, error: `Node at index ${i} must have either an id or name` };
      }
      if (!node.type) {
        return { valid: false, error: `Node '${node.name || node.id || 'unnamed'}' must have a type` };
      }
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        return { valid: false, error: `Node '${node.name || node.id || 'unnamed'}' must have a valid position array [x, y]` };
      }
      
      // Check for potential issues
      if (node.name && node.name.includes(' ')) {
        warnings.push(`Node '${node.name}' contains spaces which may cause connection issues`);
      }
      if (!node.id && node.name) {
        warnings.push(`Node '${node.name}' has no explicit id, using name as fallback`);
      }
    }

    // Validate connections structure
    // n8n-demo expects connections in format: { [nodeId]: { main: [[{node, type, index}]] } }
    const nodeNames = new Set(wf.nodes.map(n => n.name).filter(Boolean));
    const nodeIds = new Set(wf.nodes.map(n => n.id).filter(Boolean));
    
    for (const [nodeKey, connection] of Object.entries(wf.connections)) {
      if (!connection || typeof connection !== 'object') {
        return { valid: false, error: `Invalid connection structure for node '${nodeKey}'` };
      }
      if (!connection.main || !Array.isArray(connection.main)) {
        return { valid: false, error: `Connection for node '${nodeKey}' must have a main array` };
      }
      
      // Check if the connection key references a valid node
      if (!nodeNames.has(nodeKey) && !nodeIds.has(nodeKey)) {
        warnings.push(`Connection key '${nodeKey}' does not match any node name or id`);
      }
      
      // Validate connection targets
      for (let outputIndex = 0; outputIndex < connection.main.length; outputIndex++) {
        const outputConnections = connection.main[outputIndex];
        if (!Array.isArray(outputConnections)) {
          warnings.push(`Connection main[${outputIndex}] for node '${nodeKey}' is not an array`);
          continue;
        }
        
        for (let connIndex = 0; connIndex < outputConnections.length; connIndex++) {
          const conn = outputConnections[connIndex];
          if (!conn || typeof conn !== 'object') {
            warnings.push(`Invalid connection at main[${outputIndex}][${connIndex}] for node '${nodeKey}'`);
            continue;
          }
          
          const targetNodeRef = conn.node || (conn as any).nodeId;
          if (!targetNodeRef) {
            warnings.push(`Connection at main[${outputIndex}][${connIndex}] for node '${nodeKey}' has no target node reference`);
            continue;
          }
          
          if (!nodeNames.has(targetNodeRef) && !nodeIds.has(targetNodeRef)) {
            warnings.push(`Connection target '${targetNodeRef}' at main[${outputIndex}][${connIndex}] for node '${nodeKey}' does not match any node`);
          }
        }
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

// Normalize workflow format for n8n-demo component with enhanced debugging
const normalizeWorkflow = (wf: N8nWorkflow): any => {
    const normalized = JSON.parse(JSON.stringify(wf));
    
    // Debug: Log original structure
    if (process.env.NODE_ENV === 'development') {
      console.log('=== WORKFLOW NORMALIZATION DEBUG ===');
      console.log('Original nodes count:', normalized.nodes?.length || 0);
      console.log('Original connections keys:', Object.keys(normalized.connections || {}));
    }
    
    // Ensure all nodes have required fields
    normalized.nodes = normalized.nodes.map((node: any, index: number) => {
      // Ensure node has an id
      if (!node.id) {
        node.id = node.name || `node-${index}`;
      }
      
      // Ensure node has a name
      if (!node.name) {
        node.name = node.id;
      }
      
      // Ensure position is valid
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        node.position = [index * 250, 100];
      }
      
      // Ensure typeVersion exists
      if (node.typeVersion === undefined) {
        node.typeVersion = 1;
      }
      
      return node;
    });

    // Create comprehensive node mapping
    const nodeNameMap = new Map<string, string>();
    const nodeIdMap = new Map<string, string>();
    normalized.nodes.forEach((node: any) => {
      if (node.id) {
        nodeNameMap.set(node.id, node.name);
        nodeIdMap.set(node.id, node.id);
      }
      if (node.name) {
        nodeNameMap.set(node.name, node.name);
        nodeIdMap.set(node.name, node.id);
      }
    });
    
    // Debug: Log node mappings
    if (process.env.NODE_ENV === 'development') {
      console.log('Node mappings:', {
        byId: Object.fromEntries(nodeIdMap),
        byName: Object.fromEntries(nodeNameMap)
      });
    }

    // Normalize connections structure with robust error handling
    const normalizedConnections: Record<string, any> = {};
    
    for (const [key, conn] of Object.entries(normalized.connections)) {
      try {
        // Find the source node by ID or name
        const sourceNode = normalized.nodes.find((n: any) => n.id === key || n.name === key);
        const sourceNodeName = sourceNode?.name || nodeNameMap.get(key) || key;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Processing connection key '${key}' -> source node: '${sourceNodeName}'`);
        }
        
        if (!conn || typeof conn !== 'object' || !('main' in conn)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid connection structure for key '${key}', creating empty connection`);
          }
          normalizedConnections[sourceNodeName] = { main: [] };
          continue;
        }
        
        const connWithMain = conn as { main?: any[] };
        
        // Ensure connection has main array
        if (!connWithMain.main || !Array.isArray(connWithMain.main)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Connection for '${sourceNodeName}' has invalid main array, creating empty`);
          }
          normalizedConnections[sourceNodeName] = { main: [] };
          continue;
        }
        
        // Normalize each connection in main array
        const normalizedMain = connWithMain.main.map((outputConnections: any, outputIndex: number) => {
          if (!Array.isArray(outputConnections)) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Connection main[${outputIndex}] for '${sourceNodeName}' is not an array, skipping`);
            }
            return [];
          }
          
          return outputConnections.map((connection: any, connIndex: number) => {
            if (!connection || typeof connection !== 'object') {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`Invalid connection at main[${outputIndex}][${connIndex}] for '${sourceNodeName}', skipping`);
              }
              return null;
            }
            
            // Handle multiple possible target node reference fields
            const targetNodeRef = connection.node || (connection as any).nodeId || connection.target;
            
            if (!targetNodeRef) {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`Connection at main[${outputIndex}][${connIndex}] for '${sourceNodeName}' has no target, skipping`);
              }
              return null;
            }
            
            // Find the target node by ID or name
            const targetNode = normalized.nodes.find((n: any) => 
              n.id === targetNodeRef || n.name === targetNodeRef
            );
            
            // Use the node name (n8n-demo expects names, not IDs)
            const targetNodeName = targetNode?.name || nodeNameMap.get(targetNodeRef) || targetNodeRef;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`  Connection: '${sourceNodeName}' -> '${targetNodeName}' (ref: '${targetNodeRef}')`);
            }
            
            // Ensure connection has required fields
            return {
              node: targetNodeName,
              type: connection.type || 'main',
              index: typeof connection.index === 'number' ? connection.index : 0
            };
          }).filter((c: any) => c && c.node); // Filter out invalid connections
        });
        
        normalizedConnections[sourceNodeName] = { main: normalizedMain };
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Normalized connection for '${sourceNodeName}':`, normalizedMain);
        }
        
      } catch (error) {
        console.error(`Error processing connection key '${key}':`, error);
        normalizedConnections[key] = { main: [] };
      }
    }

    normalized.connections = normalizedConnections;
    
    // Debug: Log final structure
    if (process.env.NODE_ENV === 'development') {
      console.log('Final normalized connections:', normalized.connections);
      console.log('=== END WORKFLOW NORMALIZATION DEBUG ===');
    }

    return normalized;
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowChange,
  readOnly = false,
  className,
}) => {
  const componentRef = useRef<HTMLElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [isComponentLoaded, setIsComponentLoaded] = useState(false);
  const [workflowUpdateCounter, setWorkflowUpdateCounter] = useState(0);

  // Convert workflow to JSON string for n8n-demo component
  const workflowJsonString = React.useMemo(() => {
    console.log('=== WORKFLOW CANVAS DEBUG ===');
    console.log('Input workflow:', workflow);
    
    try {
      // Temporarily bypass validation to test
      const normalized = normalizeWorkflow(workflow);
      console.log('Normalized workflow:', normalized);
      
      const jsonString = JSON.stringify(normalized, null, 2);
      console.log('Final JSON string length:', jsonString.length);
      console.log('=== END WORKFLOW CANVAS DEBUG ===');
      
      // Set error to false to test display
      setHasError(false);
      setErrorMessage('');
      
      return jsonString;
    } catch (e) {
      console.error('Failed to stringify workflow:', e);
      setErrorMessage(e instanceof Error ? e.message : 'Failed to process workflow');
      setHasError(true);
      return '';
    }
  }, [workflow]);

  const isValidWorkflow = React.useMemo(() => {
    try {
      const validation = validateWorkflow(workflow);
      return validation.valid;
    } catch {
      return false;
    }
  }, [workflow]);

  // Clear warnings when workflow becomes valid
  React.useEffect(() => {
    if (isValidWorkflow && warnings.length > 0) {
      const validation = validateWorkflow(workflow);
      if (validation.warnings) {
        setWarnings(validation.warnings);
      } else {
        setWarnings([]);
      }
    }
  }, [workflow, isValidWorkflow]);

  // Load the n8n-demo component with polyfills
  useEffect(() => {
    const loadComponent = async () => {
      // Check if component is already defined
      if (customElements.get('n8n-demo')) {
        setIsComponentLoaded(true);
        return;
      }

      try {
        // Intercept and suppress n8n-preview-service errors
        const originalFetch = window.fetch;
        window.fetch = function(input: any, init?: any) {
          if (typeof input === 'string' && input.includes('n8n-preview-service.internal.n8n.cloud')) {
            console.warn('Suppressing n8n-preview-service call (expected in demo mode)');
            return Promise.resolve(new Response('{}', { status: 200 }));
          }
          return originalFetch.apply(this, [input, init]);
        };

        // Add global error handler for n8n-preview-service errors
        const errorHandler = (event: ErrorEvent) => {
          if (event.message && event.message.includes('n8n-preview-service')) {
            console.warn('Suppressing n8n-preview-service error (expected in demo mode)');
            event.preventDefault();
          }
        };
        window.addEventListener('error', errorHandler);

        // Load the web component polyfills and the n8n-demo component sequentially
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2.0.0/webcomponents-loader.js';
        script1.type = 'application/javascript';
        script1.crossOrigin = 'anonymous';

        const script2 = document.createElement('script');
        script2.src = 'https://www.unpkg.com/lit@2.0.0-rc.2/polyfill-support.js';
        script2.type = 'application/javascript';
        script2.crossOrigin = 'anonymous';

        const script3 = document.createElement('script');
        script3.type = 'module';
        script3.crossOrigin = 'anonymous';
        script3.src = 'https://cdn.jsdelivr.net/npm/@n8n_io/n8n-demo-component@latest/n8n-demo.bundled.js';

        const waitLoad = (el: HTMLScriptElement): Promise<void> => {
          return new Promise((resolve, reject) => {
            el.addEventListener('load', () => resolve(), { once: true });
            el.addEventListener('error', () => reject(new Error(`Failed to load ${el.src}`)), { once: true });
          });
        };

        document.head.appendChild(script1);
        await waitLoad(script1);

        document.head.appendChild(script2);
        await waitLoad(script2);

        document.head.appendChild(script3);
        await waitLoad(script3);

        await customElements.whenDefined('n8n-demo');
        setIsComponentLoaded(true);
        
        // Restore original fetch and clean up event listener
        window.fetch = originalFetch;
        window.removeEventListener('error', errorHandler);
      } catch (error) {
        console.error('Failed to load n8n-demo component:', error);
        setHasError(true);
        setErrorMessage('Failed to load workflow visualizer component');
      }
    };

    loadComponent();
  }, []);

  // Update workflow when it changes or component loads
  useEffect(() => {
    if (!isComponentLoaded || !componentRef.current) return;

    setHasError(false);
    setErrorMessage('');

    if (!isValidWorkflow) {
      setHasError(true);
      setErrorMessage('Invalid workflow format');
      return;
    }

    if (!workflowJsonString) {
      setHasError(true);
      setErrorMessage('Failed to process workflow');
      return;
    }

    try {
      // Listen for errors from the n8n-demo component
      const errorHandler = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.error) {
          setHasError(true);
          setErrorMessage(customEvent.detail.error || 'Failed to render workflow');
        }
      };

      componentRef.current.addEventListener('error', errorHandler);

      // Give the component time to render
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (componentRef.current && typeof (componentRef.current as any).fitToView === 'function') {
            try {
              (componentRef.current as any).fitToView();
            } catch (e) {
              console.error('Error calling fitToView:', e);
              setHasError(true);
              setErrorMessage('Failed to initialize workflow view');
            }
          }
        }, 100);
      });

      return () => {
        if (componentRef.current) {
          componentRef.current.removeEventListener('error', errorHandler);
        }
      };
    } catch (e) {
      console.error("Error updating n8n-demo component:", e);
      setHasError(true);
      setErrorMessage(e instanceof Error ? e.message : 'Failed to load workflow');
    }
  }, [workflowJsonString, isValidWorkflow, isComponentLoaded, workflowUpdateCounter]);

  return (
    <div className={`workflow-canvas ${className || ''}`} style={{ width: '100%', height: '100%' }}>
      <div className="w-full h-full bg-gradient-to-br from-[#0e1117] via-[#0d1117] to-[#0e1117] overflow-hidden relative border border-slate-800/50 rounded-2xl shadow-2xl shadow-black/40 flex flex-col group">
        <div className="flex-1 min-h-0 n8n-viewer-container relative z-10">
        {/* Warnings display */}
        {isComponentLoaded && isValidWorkflow && warnings.length > 0 && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="bg-gradient-to-br from-amber-900/95 to-amber-950/95 backdrop-blur-xl border border-amber-700/50 rounded-2xl p-4 shadow-2xl shadow-amber-900/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-amber-300 mb-2">Workflow loaded with warnings</h4>
                  <ul className="text-xs text-amber-200/90 space-y-1">
                    {warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0 mt-1.5"></span>
                        <span className="leading-relaxed">{warning}</span>
                      </li>
                    ))}
                    {warnings.length > 3 && (
                      <li className="text-amber-300/70 font-medium">
                        ...and {warnings.length - 3} more warnings
                      </li>
                    )}
                  </ul>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <FileCode className="w-3 h-3" />
                    {showCode ? 'Hide' : 'View'} details
                  </button>
                </div>
                <button
                  onClick={() => setWarnings([])}
                  className="p-1 text-amber-400/70 hover:text-amber-300 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isComponentLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0e1117] to-[#0d1117] flex flex-col items-center justify-center p-8 z-20">
            <div className="relative mb-6">
              <Loader2 className="w-10 h-10 text-orange-400 animate-spin drop-shadow-[0_0_12px_rgba(251,146,60,0.5)]" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-orange-500/20 rounded-full animate-ping"></div>
            </div>
            <p className="text-sm text-slate-300 font-medium">Loading n8n workflow visualizer...</p>
            <div className="mt-4 flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {/* Workflow visualization */}
        {isComponentLoaded && isValidWorkflow && workflowJsonString && (
          React.createElement('n8n-demo', {
            key: `workflow-${workflowUpdateCounter}-${workflow.id || workflow.name || 'default'}`,
            ref: componentRef,
            workflow: workflowJsonString,
            className: 'w-full h-full block'
          } as any)
        )}
        
        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0e1117] to-[#0d1117] flex flex-col items-center justify-center p-8 z-20">
            <div className="bg-gradient-to-br from-red-900/30 to-red-950/20 border border-red-900/40 rounded-2xl p-6 mb-6 max-w-2xl shadow-2xl shadow-red-900/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-sm font-black text-red-300">Could not load workflow preview</h3>
              </div>
              <p className="text-xs text-red-200/90 mb-4 leading-relaxed font-medium">
                {errorMessage || 'Invalid JSON'}
              </p>
              
              {/* Debug info */}
              <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-300 mb-2">Debug Info:</p>
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(workflow, null, 2)}
                </pre>
              </div>
              
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                You can still view the code and paste it into n8n.
              </p>
              <button
                onClick={() => setShowCode(!showCode)}
                className="group text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FileCode className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                {showCode ? 'Hide' : 'View'} the code
              </button>
            </div>
            
            {showCode && (
              <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/50 rounded-2xl p-5 max-w-2xl w-full max-h-96 overflow-auto shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(workflow, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating UI indicators */}
      {!hasError && isComponentLoaded && isValidWorkflow && (
        <div className="absolute bottom-5 left-5 z-10 pointer-events-none flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 px-4 py-2 rounded-2xl text-[10px] text-slate-300 font-black uppercase tracking-widest shadow-2xl shadow-black/40 flex items-center gap-2.5 group hover:scale-105 transition-transform duration-200">
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
            Native Engine Active
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default WorkflowCanvas;
