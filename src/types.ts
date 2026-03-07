export interface N8nNode {
  parameters: Record<string, any>;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  id?: string;
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface N8nConnection {
  main: {
    node: string;
    type: string;
    index: number;
  }[][];
  ai_languageModel?: {
    node: string;
    type: string;
    index: number;
  }[][];
  ai_outputParser?: {
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
  tags?: string[];
  versionId?: string;
}

export interface GithubItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  content?: string;
}
