import type { N8nWorkflow, N8nNode, N8nConnection } from '../types';

// Node type mapping from old format to new n8n format
const NODE_TYPE_MAPPINGS: Record<string, string> = {
  // Core nodes
  'manualTrigger': 'n8n-nodes-base.manualTrigger',
  'webhook': 'n8n-nodes-base.webhook',
  'httpRequest': 'n8n-nodes-base.httpRequest',
  'code': 'n8n-nodes-base.code',
  'set': 'n8n-nodes-base.set',
  'if': 'n8n-nodes-base.if',
  'switch': 'n8n-nodes-base.switch',
  'merge': 'n8n-nodes-base.merge',
  'split': 'n8n-nodes-base.split',
  'function': 'n8n-nodes-base.function',
  'functionItem': 'n8n-nodes-base.functionItem',
  
  // Database nodes
  'mysql': 'n8n-nodes-base.mysql',
  'postgres': 'n8n-nodes-base.postgres',
  'mongodb': 'n8n-nodes-base.mongodb',
  
  // Communication nodes
  'emailSend': 'n8n-nodes-base.emailSend',
  'slack': 'n8n-nodes-base.slack',
  'discord': 'n8n-nodes-base.discord',
  'telegram': 'n8n-nodes-base.telegram',
  
  // Scheduling nodes
  'cron': 'n8n-nodes-base.cron',
  'interval': 'n8n-nodes-base.interval',
  'wait': 'n8n-nodes-base.wait',
  
  // Utility nodes
  'noOp': 'n8n-nodes-base.noOp',
  'stopAndError': 'n8n-nodes-base.stopAndError',
  'setWorkflowVariables': 'n8n-nodes-base.setWorkflowVariables',
  'getWorkflowVariables': 'n8n-nodes-base.getWorkflowVariables',
  
  // Google nodes
  'googleDrive': 'n8n-nodes-base.googleDrive',
  'googleSheets': 'n8n-nodes-base.googleSheets',
  'googleCalendar': 'n8n-nodes-base.googleCalendar',
  'gmail': 'n8n-nodes-base.gmail',
  
  // OpenAI/LangChain nodes
  'openAi': '@n8n/n8n-nodes-langchain.openAi',
  'lmChatOpenAi': '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  'agent': '@n8n/n8n-nodes-langchain.agent',
  'outputParserStructured': '@n8n/n8n-nodes-langchain.outputParserStructured',
  
  // File handling
  'convertToFile': 'n8n-nodes-base.convertToFile',
  'readBinaryFile': 'n8n-nodes-base.readBinaryFile',
  'writeBinaryFile': 'n8n-nodes-base.writeBinaryFile',
  
  // Data processing
  'splitOut': 'n8n-nodes-base.splitOut',
  'splitInBatches': 'n8n-nodes-base.splitInBatches',
  'aggregate': 'n8n-nodes-base.aggregate',
  'sort': 'n8n-nodes-base.sort',
  'filter': 'n8n-nodes-base.filter',
  'removeDuplicates': 'n8n-nodes-base.removeDuplicates',
};

// Default type versions for nodes
const DEFAULT_TYPE_VERSIONS: Record<string, number> = {
  'n8n-nodes-base.manualTrigger': 1,
  'n8n-nodes-base.webhook': 2.1,
  'n8n-nodes-base.httpRequest': 4.2,
  'n8n-nodes-base.code': 2,
  'n8n-nodes-base.set': 3.4,
  'n8n-nodes-base.if': 2,
  'n8n-nodes-base.switch': 3,
  'n8n-nodes-base.merge': 3,
  'n8n-nodes-base.mysql': 2.3,
  'n8n-nodes-base.postgres': 2.2,
  'n8n-nodes-base.emailSend': 2.1,
  'n8n-nodes-base.slack': 2.1,
  'n8n-nodes-base.cron': 1,
  'n8n-nodes-base.wait': 1.1,
  'n8n-nodes-base.googleDrive': 3,
  'n8n-nodes-base.googleSheets': 4,
  'n8n-nodes-base.gmail': 2.1,
  'n8n-nodes-base.convertToFile': 1.1,
  'n8n-nodes-base.splitOut': 1,
  'n8n-nodes-base.splitInBatches': 3,
  '@n8n/n8n-nodes-langchain.openAi': 1.8,
  '@n8n/n8n-nodes-langchain.lmChatOpenAi': 1.2,
  '@n8n/n8n-nodes-langchain.agent': 1.9,
  '@n8n/n8n-nodes-langchain.outputParserStructured': 1.2,
};

export interface ConversionOptions {
  preserveIds?: boolean;
  updateTypeVersions?: boolean;
  addMetadata?: boolean;
}

export interface ConversionResult {
  success: boolean;
  convertedWorkflow?: N8nWorkflow;
  errors?: string[];
  warnings?: string[];
}

/**
 * Converts a workflow from old format to new n8n format
 */
export function convertWorkflow(
  oldWorkflow: any,
  options: ConversionOptions = {}
): ConversionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const convertedWorkflow: N8nWorkflow = {
      name: oldWorkflow.name || 'Converted Workflow',
      nodes: [],
      connections: {},
      active: oldWorkflow.active ?? false,
      settings: oldWorkflow.settings || { executionOrder: 'v1' },
    };

    // Add metadata if requested
    if (options.addMetadata) {
      (convertedWorkflow as any).versionId = generateId();
      (convertedWorkflow as any).meta = {
        templateCredsSetupCompleted: true,
        instanceId: generateId(),
      };
      (convertedWorkflow as any).tags = [];
    }

    // Convert nodes
    if (oldWorkflow.nodes && Array.isArray(oldWorkflow.nodes)) {
      convertedWorkflow.nodes = oldWorkflow.nodes.map((node: any, index: number) => 
        convertNode(node, index, options, errors, warnings)
      );
    } else {
      errors.push('Invalid or missing nodes array');
    }

    // Convert connections
    if (oldWorkflow.connections) {
      convertedWorkflow.connections = convertConnections(
        oldWorkflow.connections, 
        convertedWorkflow.nodes, 
        errors, 
        warnings
      );
    }

    return {
      success: errors.length === 0,
      convertedWorkflow,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Converts a single node from old format to new format
 */
function convertNode(
  oldNode: any,
  index: number,
  options: ConversionOptions,
  errors: string[],
  warnings: string[]
): N8nNode {
  const nodeType = mapNodeType(oldNode.type, errors, warnings);
  
  const convertedNode: N8nNode = {
    id: options.preserveIds && oldNode.id ? oldNode.id : generateId(),
    name: oldNode.name || `Node ${index + 1}`,
    type: nodeType,
    typeVersion: options.updateTypeVersions 
      ? DEFAULT_TYPE_VERSIONS[nodeType] || 1
      : (oldNode.typeVersion || 1),
    position: oldNode.position || [index * 200, 0],
    parameters: oldNode.parameters || {},
  };

  // Handle special node properties
  if (oldNode.credentials) {
    (convertedNode as any).credentials = oldNode.credentials;
  }

  if (oldNode.webhookId) {
    (convertedNode as any).webhookId = oldNode.webhookId;
  }

  if (oldNode.executeOnce !== undefined) {
    (convertedNode as any).executeOnce = oldNode.executeOnce;
  }

  if (oldNode.alwaysOutputData !== undefined) {
    (convertedNode as any).alwaysOutputData = oldNode.alwaysOutputData;
  }

  return convertedNode;
}

/**
 * Maps old node types to new n8n node types
 */
function mapNodeType(
  oldType: string,
  errors: string[],
  warnings: string[]
): string {
  // If it's already in the new format, return as-is
  if (oldType.startsWith('n8n-nodes-base.') || oldType.startsWith('@n8n/')) {
    return oldType;
  }

  // Try to map the old type
  const newType = NODE_TYPE_MAPPINGS[oldType];
  
  if (newType) {
    return newType;
  }

  // If no mapping found, try to construct the new type
  if (oldType.includes('n8n-nodes-base')) {
    return oldType; // Already partially formatted
  }

  // Default fallback
  warnings.push(`Unknown node type: ${oldType}, using as-is`);
  return oldType;
}

/**
 * Converts connections from old format to new format
 */
function convertConnections(
  oldConnections: any,
  nodes: N8nNode[],
  errors: string[],
  warnings: string[]
): Record<string, N8nConnection> {
  const finalConnections: Record<string, N8nConnection> = {};
  
  // Create node name to ID mapping
  const nodeMap = new Map<string, string>();
  nodes.forEach(node => {
    nodeMap.set(node.name, node.id);
  });

  for (const [sourceNodeName, nodeConnections] of Object.entries(oldConnections)) {
    const sourceNode = nodes.find(n => n.name === sourceNodeName);
    if (!sourceNode) {
      warnings.push(`Source node not found for connections: ${sourceNodeName}`);
      continue;
    }

    const convertedConnection: N8nConnection = {
      main: [],
    };

    // Handle different connection formats
    const connections = nodeConnections as any;
    if (connections.main && Array.isArray(connections.main)) {
      convertedConnection.main = connections.main.map((branch: any) => {
        if (Array.isArray(branch)) {
          return branch.map((conn: any) => {
            const targetNode = nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              warnings.push(`Target node not found: ${conn.node}`);
              return conn;
            }
            
            return {
              node: conn.node,
              type: conn.type || 'main',
              index: conn.index || 0,
            };
          });
        }
        return branch;
      });
    }

    // Handle AI language model connections (special case for LangChain nodes)
    if (connections.ai_languageModel && Array.isArray(connections.ai_languageModel)) {
      (convertedConnection as any).ai_languageModel = connections.ai_languageModel.map((branch: any) => {
        if (Array.isArray(branch)) {
          return branch.map((conn: any) => {
            const targetNode = nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              warnings.push(`Target node not found for AI connection: ${conn.node}`);
              return conn;
            }
            
            return {
              node: conn.node,
              type: conn.type || 'ai_languageModel',
              index: conn.index || 0,
            };
          });
        }
        return branch;
      });
    }

    // Handle AI output parser connections
    if (connections.ai_outputParser && Array.isArray(connections.ai_outputParser)) {
      (convertedConnection as any).ai_outputParser = connections.ai_outputParser.map((branch: any) => {
        if (Array.isArray(branch)) {
          return branch.map((conn: any) => {
            const targetNode = nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              warnings.push(`Target node not found for AI output parser connection: ${conn.node}`);
              return conn;
            }
            
            return {
              node: conn.node,
              type: conn.type || 'ai_outputParser',
              index: conn.index || 0,
            };
          });
        }
        return branch;
      });
    }

    finalConnections[sourceNodeName] = convertedConnection;
  }

  return finalConnections;
}

/**
 * Generates a unique ID for nodes and workflows
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + 
         Math.random().toString(36).substr(2, 9) + 
         Math.random().toString(36).substr(2, 9) + 
         Math.random().toString(36).substr(2, 9);
}

/**
 * Validates a converted workflow
 */
export function validateWorkflow(workflow: N8nWorkflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push('Workflow must have at least one node');
  }

  if (!workflow.connections) {
    errors.push('Workflow must have connections object');
  }

  // Check for duplicate node names
  const nodeNames = workflow.nodes.map(n => n.name);
  const duplicateNames = nodeNames.filter((name, index) => nodeNames.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate node names: ${duplicateNames.join(', ')}`);
  }

  // Check for invalid connections
  for (const [sourceName, connections] of Object.entries(workflow.connections)) {
    const sourceNode = workflow.nodes.find(n => n.name === sourceName);
    if (!sourceNode) {
      errors.push(`Connection references non-existent source node: ${sourceName}`);
    }

    if (connections.main) {
      connections.main.forEach((branch, branchIndex) => {
        if (Array.isArray(branch)) {
          branch.forEach((conn, connIndex) => {
            const targetNode = workflow.nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              errors.push(`Connection references non-existent target node: ${conn.node}`);
            }
          });
        }
      });
    }

    // Validate AI language model connections
    if (connections.ai_languageModel) {
      connections.ai_languageModel.forEach((branch, branchIndex) => {
        if (Array.isArray(branch)) {
          branch.forEach((conn, connIndex) => {
            const targetNode = workflow.nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              errors.push(`AI language model connection references non-existent target node: ${conn.node}`);
            }
          });
        }
      });
    }

    // Validate AI output parser connections
    if (connections.ai_outputParser) {
      connections.ai_outputParser.forEach((branch, branchIndex) => {
        if (Array.isArray(branch)) {
          branch.forEach((conn, connIndex) => {
            const targetNode = workflow.nodes.find(n => n.name === conn.node);
            if (!targetNode) {
              errors.push(`AI output parser connection references non-existent target node: ${conn.node}`);
            }
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Batch convert multiple workflows
 */
export function convertWorkflows(
  workflows: any[],
  options: ConversionOptions = {}
): ConversionResult[] {
  return workflows.map(workflow => convertWorkflow(workflow, options));
}
