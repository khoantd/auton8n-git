import { GithubItem, N8nWorkflow } from '@/types';

const REPO_OWNER = 'enescingoz';
const REPO_NAME = 'awesome-n8n-templates';
const BASE_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

export const fetchRepoContents = async (path: string = ''): Promise<GithubItem[]> => {
  try {
    const response = await fetch(`${BASE_API_URL}/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub contents:', error);
    return [];
  }
};

export const fetchWorkflowFile = async (url: string): Promise<N8nWorkflow | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow file: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Handle base64 encoded content from GitHub API
    if (data.content) {
      const decodedContent = atob(data.content);
      return JSON.parse(decodedContent);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching workflow file:', error);
    return null;
  }
};

export const normalizeWorkflow = (rawWorkflow: any): N8nWorkflow | null => {
  try {
    // Normalize n8n workflow format (could be an array or nested in .data)
    const normalized = Array.isArray(rawWorkflow) ? rawWorkflow[0] : (rawWorkflow.data || rawWorkflow);
    
    if (normalized && normalized.nodes && normalized.connections) {
      // Ensure nodes is an array
      if (Array.isArray(normalized.nodes) && normalized.nodes.length > 0) {
        return normalized as N8nWorkflow;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error normalizing workflow:', error);
    return null;
  }
};
