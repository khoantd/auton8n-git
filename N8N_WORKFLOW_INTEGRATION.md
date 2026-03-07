# N8N Workflow Visualization Integration

This document explains how to display N8N workflows using the n8n demo library in this React TypeScript project.

## Overview

The integration uses the official `@n8n_io/n8n-demo-component` web component to render interactive workflow graphs. The implementation includes:

- **WorkflowGraph Component**: A React wrapper around the n8n-demo web component
- **Type Definitions**: TypeScript interfaces for N8N workflow data structures
- **Sample Data**: Example workflows for testing and demonstration
- **Demo Page**: Interactive page to showcase different workflow patterns

## Key Components

### 1. Types (`src/types.ts`)

Defines the TypeScript interfaces for N8N workflows:

```typescript
export interface N8nNode {
  parameters: Record<string, any>;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  id?: string;
}

export interface N8nConnection {
  main: {
    node: string;
    type: string;
    index: number;
  }[][];
}

export interface N8nWorkflow {
  nodes: N8nNode[];
  connections: Record<string, N8nConnection>;
  active?: boolean;
  settings?: Record<string, any>;
  id?: string | number;
  name?: string;
}
```

### 2. WorkflowGraph Component (`src/components/WorkflowGraph.tsx`)

The main component that handles n8n workflow visualization:

**Features:**
- Loads n8n-demo web component from CDN
- Validates and normalizes workflow data
- Handles loading states and error cases
- Provides fallback JSON view on errors
- Auto-fits workflow to view

**Key Functions:**
- `validateWorkflow()`: Ensures workflow has required structure
- `normalizeWorkflow()`: Converts data to n8n-demo expected format
- Dynamic script loading for web components

### 3. Sample Workflows (`src/data/sampleWorkflows.ts`)

Contains example workflows demonstrating different patterns:

- **Simple HTTP Request**: Basic 3-node workflow
- **Data Processing Pipeline**: Conditional branching
- **Database Sync**: Scheduled automation

## Usage

### Basic Usage

```typescript
import WorkflowGraph from '@/components/WorkflowGraph';
import { N8nWorkflow } from '@/types';

const MyComponent = () => {
  const workflow: N8nWorkflow = {
    name: "My Workflow",
    nodes: [
      {
        id: "1",
        name: "Start",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [240, 300],
        parameters: {}
      },
      // ... more nodes
    ],
    connections: {
      "Start": {
        main: [
          [
            {
              node: "Next Node",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    }
  };

  return <WorkflowGraph workflow={workflow} />;
};
```

### Integration with Existing Workflow Data

The `WorkflowDetailModal` component shows how to convert existing workflow data to N8N format:

```typescript
const convertToN8nWorkflow = (workflow: Workflow): N8nWorkflow => {
  const nodes = workflow.integrations.map((integration, index) => ({
    id: `node-${index + 1}`,
    name: integration,
    type: `n8n-nodes-base.${integration.toLowerCase().replace(/\s+/g, '')}`,
    typeVersion: 1,
    position: [index * 250, 100] as [number, number],
    parameters: {}
  }));

  // Create connections between nodes
  const connections: Record<string, any> = {};
  for (let i = 0; i < nodes.length - 1; i++) {
    connections[nodes[i].name] = {
      main: [
        [
          {
            node: nodes[i + 1].name,
            type: 'main',
            index: 0
          }
        ]
      ]
    };
  }

  return {
    name: workflow.title,
    nodes,
    connections,
    active: false
  };
};
```

## Demo Page

Visit `/demo` to see the interactive workflow visualization demo. The page includes:

- Workflow selector with multiple examples
- Real-time visualization switching
- Workflow information display
- Usage instructions

## Dependencies

The integration requires:

- `d3`: For n8n-demo component (added to package.json)
- Web component polyfills (loaded dynamically)
- n8n-demo component (loaded from CDN)

## Implementation Details

### Web Component Loading

The n8n-demo component is loaded dynamically with proper polyfills:

```typescript
// Load polyfills and component sequentially
const script1 = document.createElement('script');
script1.src = 'https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2.0.0/webcomponents-loader.js';

const script2 = document.createElement('script');
script2.src = 'https://www.unpkg.com/lit@2.0.0-rc.2/polyfill-support.js';

const script3 = document.createElement('script');
script3.type = 'module';
script3.src = 'https://cdn.jsdelivr.net/npm/@n8n_io/n8n-demo-component@latest/n8n-demo.bundled.js';
```

### Error Handling

The component includes comprehensive error handling:

- Workflow validation before rendering
- Shadow DOM error detection
- Fallback JSON display
- User-friendly error messages

### Performance Considerations

- Component memoization for workflow stringification
- Efficient connection mapping
- Proper cleanup on component unmount
- Debounced resize handling

## Troubleshooting

### Common Issues

1. **Blank Visualization**: Check browser console for script loading errors
2. **Invalid Workflow**: Ensure all nodes have required fields (id, name, type, position)
3. **Connection Errors**: Verify connection format uses node names (not IDs)
4. **Performance Issues**: Large workflows may need optimization

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see:
- Normalized workflow data
- Connection mappings
- Component loading status

## Future Enhancements

- Workflow editing capabilities
- Export/import functionality
- Real-time collaboration
- Custom node types
- Performance analytics

## References

- [n8n Documentation](https://docs.n8n.io/)
- [n8n-demo Component](https://github.com/n8n-io/n8n-demo-component)
- [Web Components Standards](https://www.webcomponents.org/)
