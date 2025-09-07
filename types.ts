// Represents a node in the file system tree (can be a file or a folder)
export interface FileSystemNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string; // Only for files
  children?: FileSystemNode[]; // Only for folders
}

// Defines the file modification operations the AI can perform
export type FileOperation =
  | { action: 'CREATE'; path: string; type: 'file'; content: string; }
  | { action: 'CREATE'; path: string; type: 'folder'; }
  | { action: 'UPDATE'; path: string; content: string; } // Update only applies to files
  | { action: 'DELETE'; path: string; };

// The expected JSON structure of the response from the Gemini API
export interface GeminiResponse {
  reasoning: string; // AI's explanation of the changes made
  operations: FileOperation[];
  html_output: string;
}
