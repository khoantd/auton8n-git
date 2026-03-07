import { useEffect, useState } from 'react';

interface UseN8nDemoReturn {
  loaded: boolean;
  error: string | null;
  loading: boolean;
}

export const useN8nDemo = (): UseN8nDemoReturn => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if n8n-demo is already loaded
    if (window.customElements && window.customElements.get('n8n-demo')) {
      setLoaded(true);
      setLoading(false);
      return;
    }

    // Load n8n-demo script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@n8n_io/n8n-demo-component@latest/n8n-demo.bundled.js';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.async = true;
    
    script.onload = () => {
      // Wait a bit for the component to register
      setTimeout(() => {
        if (window.customElements && window.customElements.get('n8n-demo')) {
          setLoaded(true);
          setError(null);
        } else {
          setError('n8n-demo component failed to register');
        }
        setLoading(false);
      }, 100);
    };

    script.onerror = () => {
      setError('Failed to load n8n-demo script');
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return { loaded, error, loading };
};

// Type declaration for n8n-demo component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'n8n-demo': any;
    }
  }
}
