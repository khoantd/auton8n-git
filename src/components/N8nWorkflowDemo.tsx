import { useEffect, useRef, useState } from 'react';

// Default height for the embedded n8n canvas on desktop-sized viewports.
// This is intentionally kept moderate so that on small devices (e.g. iPhone X)
// the demo doesn't overflow the modal and remains visible without excessive scrolling.
const DEFAULT_DEMO_HEIGHT_PX = 380;

interface N8nWorkflowDemoProps {
    workflowJson: string;
    className?: string;
    /** Fixed height for the demo container (px). Omit or pass undefined to fill the parent (height: 100%). */
    height?: number;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'n8n-demo': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { workflow?: string }, HTMLElement>;
        }
    }
}

/** Max time to wait for the n8n-demo script to load before showing fallback */
const N8N_DEMO_LOAD_TIMEOUT_MS = 10000;

type DemoState = 'loading' | 'ready' | 'error';

/**
 * Root cause of "n8n demo not working":
 * The <n8n-demo> custom element is registered by an external script in index.html
 * (n8n-demo.bundled.js from CDN). That script is type="module", so it runs async.
 * When the modal opens, React mounts this component and checks customElements.get('n8n-demo').
 * If the script hasn't finished loading yet (or failed to load), the element is undefined
 * and the demo area stays empty. Fix: wait via customElements.whenDefined('n8n-demo')
 * and show a visible loading/error fallback when the script never loads.
 */
export const N8nWorkflowDemo = ({ workflowJson, className, height }: N8nWorkflowDemoProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<DemoState>('loading');

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;
        let teardownResize: (() => void) | undefined;
        setState('loading');

        const applySizeToDemo = (demoEl: HTMLElement, host: HTMLDivElement) => {
            const w = host.offsetWidth;
            const h = host.offsetHeight;
            demoEl.style.width = `${w}px`;
            demoEl.style.height = `${h}px`;
            // Let the WC/canvas react to size change (e.g. Lit reactive updates or internal ResizeObserver)
            window.dispatchEvent(new Event('resize'));
        };

        const initDemo = (): (() => void) | undefined => {
            if (cancelled || !containerRef.current) return undefined;
            const container = containerRef.current;
            container.innerHTML = '';
            const demoElement = document.createElement('n8n-demo');

            // Core workflow data
            demoElement.setAttribute('workflow', workflowJson);
            (demoElement as unknown as { workflow?: string }).workflow = workflowJson;
            demoElement.setAttribute('data-n8n-demo', 'true');

            // UX improvements:
            // - collapseformobile=false: show the diagram immediately on small screens
            //   instead of the "Show workflow" gate that hides the canvas.
            // - tidyup: auto-layout the nodes so the workflow is centered / visible
            //   even on narrow mobile viewports.
            demoElement.setAttribute('collapseformobile', 'false');
            demoElement.setAttribute('tidyup', '');
            Object.assign((demoElement as HTMLElement).style, {
                position: 'absolute',
                inset: '0',
                width: '100%',
                height: '100%',
                display: 'block',
                minWidth: '0',
                minHeight: '400px',
                boxSizing: 'border-box',
            });
            container.appendChild(demoElement);
            setState('ready');

            // Set explicit pixel dimensions so the internal canvas fits the host (avoids % not propagating)
            applySizeToDemo(demoElement as HTMLElement, container);
            resizeObserver = new ResizeObserver(() => {
                if (containerRef.current && container.contains(demoElement)) {
                    applySizeToDemo(demoElement as HTMLElement, containerRef.current);
                }
            });
            resizeObserver.observe(container);

            return () => {
                resizeObserver?.disconnect();
                resizeObserver = null;
            };
        };

        if (customElements.get('n8n-demo')) {
            teardownResize = initDemo();
            return () => {
                cancelled = true;
                teardownResize?.();
                if (containerRef.current) containerRef.current.innerHTML = '';
            };
        }

        const timeoutId = setTimeout(() => {
            if (cancelled) return;
            if (customElements.get('n8n-demo')) {
                teardownResize = initDemo();
            } else {
                console.warn(
                    'N8nWorkflowDemo: n8n-demo script did not load in time. Check network or that index.html loads n8n-demo.bundled.js.'
                );
                setState('error');
            }
        }, N8N_DEMO_LOAD_TIMEOUT_MS);

        void customElements.whenDefined('n8n-demo').then(() => {
            if (cancelled) return;
            clearTimeout(timeoutId);
            teardownResize = initDemo();
        });

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            teardownResize?.();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [workflowJson]);

    const fillContainer = height == null;
    const containerStyle: React.CSSProperties = {
        width: '100%',
        ...(fillContainer
            ? { height: '100%', minHeight: 320 }
            : { height: `${height}px`, minHeight: '320px' }),
        background: state === 'ready' ? undefined : '#f5f5f5',
        position: 'relative',
    };

    return (
        <div
            className={className ? `${className} n8n-demo-container` : 'n8n-demo-container'}
            style={containerStyle}
            data-embed="workflow"
        >
            <div
                ref={containerRef}
                className="n8n-demo-container__host"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
            />
            {state === 'loading' && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm"
                    aria-live="polite"
                >
                    Loading workflow preview…
                </div>
            )}
            {state === 'error' && (
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground"
                    aria-live="polite"
                >
                    <p>Workflow preview couldn’t load. The demo script may be blocked or slow.</p>
                    <p>Copy the workflow JSON and import it in n8n to view and run the workflow.</p>
                </div>
            )}
        </div>
    );
};
