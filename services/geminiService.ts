import { GoogleGenAI, Type } from "@google/genai";
import type { FileSystemNode, GeminiResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function serializeFileSystem(nodes: FileSystemNode[], indent = ''): string {
    let result = '';
    for (const node of nodes) {
        result += `${indent}${node.name}${node.type === 'folder' ? '/' : ''}\n`;
        if (node.type === 'folder' && node.children) {
            result += serializeFileSystem(node.children, indent + '  ');
        }
    }
    return result;
}

function getFileContents(nodes: FileSystemNode[]): string {
    let result = '';
    for (const node of nodes) {
        if (node.type === 'file') {
            result += `\n--- FILE: ${node.path} ---\n${node.content}\n`;
        }
        if (node.type === 'folder' && node.children) {
            result += getFileContents(node.children);
        }
    }
    return result;
}

const systemInstruction = `You are an expert web developer AI. Your task is to understand a user's prompt and modify a given file system to achieve the desired result.
You must respond with a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting (e.g., \`\`\`json).

The user's project structure and file contents will be provided.

Your JSON output must contain three properties:
1.  'reasoning': A brief, user-friendly explanation of the changes you are making.
2.  'operations': An array of file operations to be performed. Each object in the array must have:
    - 'action': One of 'CREATE', 'UPDATE', or 'DELETE'.
    - 'path': The full, absolute path of the file or folder (e.g., 'src/components/Button.tsx'). Do not use relative paths.
    - 'type': (Required **only** for 'CREATE' actions) Specify 'file' or 'folder'.
    - 'content': (Required for 'CREATE'/'UPDATE' on files) The full source code for the file. This should not be included for 'DELETE' actions or folder creation.
3.  'html_output': The complete HTML content to be displayed in the preview panel. This should be a single HTML string that represents the final output of the project.

Analyze the user's request and the existing files carefully to determine the necessary modifications. Ensure all paths are correct and the content is complete.`;

const responseSchema: any = {
    type: Type.OBJECT,
    properties: {
        reasoning: { type: Type.STRING },
        operations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING },
                    path: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Must be 'file' or 'folder'. Required for CREATE operations." },
                    content: { type: Type.STRING },
                },
                required: ['action', 'path']
            }
        },
        html_output: { type: Type.STRING }
    },
    required: ['reasoning', 'operations', 'html_output']
};


export async function generateCode(prompt: string, fileSystem: FileSystemNode[]): Promise<GeminiResponse> {
    const fileTree = serializeFileSystem(fileSystem);
    const fileContents = getFileContents(fileSystem);

    const fullPrompt = `
User Prompt: "${prompt}"

Current File System Structure:
${fileTree.trim() || '(empty)'}

Current File Contents:
${fileContents.trim() || '(no files with content)'}

Based on the prompt and the current project state, generate the required JSON output to modify the file system and produce the desired HTML preview.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        // The API should return valid JSON, so direct parsing is expected.
        return JSON.parse(jsonText) as GeminiResponse;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a valid response from the AI. The model may be configured incorrectly or the response was not valid JSON.");
    }
}
