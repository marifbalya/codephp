import type { FileSystemNode, FileOperation } from '../types';

export function findNodeByPath(nodes: FileSystemNode[], path: string): FileSystemNode | null {
    const parts = path.split('/').filter(p => p);
    let currentNode: FileSystemNode | undefined;
    let currentChildren: FileSystemNode[] = nodes;

    for (const part of parts) {
        currentNode = currentChildren.find(node => node.name === part);
        if (!currentNode) return null;
        
        if (currentNode.type === 'folder' && currentNode.children) {
            currentChildren = currentNode.children;
        } else if (parts.indexOf(part) < parts.length - 1) {
            return null; // Path continues but current node is a file
        }
    }
    return currentNode || null;
}

export function getFileContent(nodes: FileSystemNode[], path: string): string | null {
    const node = findNodeByPath(nodes, path);
    return (node && node.type === 'file') ? (node.content ?? '') : null;
}

export function upsertNodeByPath(
    nodes: FileSystemNode[],
    path: string,
    type: 'file' | 'folder',
    content: string = ''
): FileSystemNode[] {
    const parts = path.split('/').filter(p => p);
    if (parts.length === 0) return nodes;

    const [currentPart, ...remainingParts] = parts;
    const currentPath = path.substring(0, path.indexOf(currentPart) + currentPart.length);

    const nodeIndex = nodes.findIndex(n => n.name === currentPart);

    if (nodeIndex > -1) { // Node exists
        const existingNode = nodes[nodeIndex];
        
        if (remainingParts.length === 0) { // Path ends here
            if (existingNode.type !== type) {
                console.error(`Cannot replace ${existingNode.type} with ${type} at path: ${path}`);
                return nodes;
            }
            if (type === 'file' && existingNode.content !== content) {
                const updatedNode: FileSystemNode = { ...existingNode, content };
                const newNodes = [...nodes];
                newNodes[nodeIndex] = updatedNode;
                return newNodes;
            }
            return nodes; // No change needed
        }

        if (existingNode.type !== 'folder') {
            console.error(`Cannot create nodes inside a file: ${path}`);
            return nodes;
        }
        
        const newChildren = upsertNodeByPath(existingNode.children ?? [], remainingParts.join('/'), type, content);
        if (newChildren === existingNode.children) return nodes;

        const updatedNode: FileSystemNode = { ...existingNode, children: newChildren };
        const newNodes = [...nodes];
        newNodes[nodeIndex] = updatedNode;
        return newNodes;
    } else { // Node does not exist, create it
        let newNode: FileSystemNode;
        if (remainingParts.length === 0) {
            newNode = { name: currentPart, path: currentPath, type, ...(type === 'file' ? { content } : { children: [] }) };
        } else {
            const children = upsertNodeByPath([], remainingParts.join('/'), type, content);
            newNode = { name: currentPart, path: currentPath, type: 'folder', children };
        }
        return [...nodes, newNode].sort((a,b) => a.name.localeCompare(b.name));
    }
}

export function deleteNodeByPath(nodes: FileSystemNode[], path: string): FileSystemNode[] {
    const parts = path.split('/').filter(p => p);
    if (parts.length === 0) return nodes;

    const [currentPart, ...remainingParts] = parts;
    const nodeIndex = nodes.findIndex(n => n.name === currentPart);
    if (nodeIndex === -1) return nodes;

    if (remainingParts.length === 0) {
        return nodes.filter((_, index) => index !== nodeIndex);
    }
    
    const existingNode = nodes[nodeIndex];
    if (existingNode.type !== 'folder' || !existingNode.children) return nodes;
    
    const newChildren = deleteNodeByPath(existingNode.children, remainingParts.join('/'));
    if (newChildren === existingNode.children) return nodes;
    
    const updatedNode = { ...existingNode, children: newChildren };
    const newNodes = [...nodes];
    newNodes[nodeIndex] = updatedNode;
    return newNodes;
}

export function applyOperations(
    initialFileSystem: FileSystemNode[],
    operations: FileOperation[]
): FileSystemNode[] {
    return operations.reduce((currentFileSystem, op) => {
        switch (op.action) {
            case 'CREATE':
                return upsertNodeByPath(currentFileSystem, op.path, op.type, op.type === 'file' ? op.content : '');
            case 'UPDATE':
                return upsertNodeByPath(currentFileSystem, op.path, 'file', op.content);
            case 'DELETE':
                return deleteNodeByPath(currentFileSystem, op.path);
            default:
                return currentFileSystem;
        }
    }, initialFileSystem);
}
