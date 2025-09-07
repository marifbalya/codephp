import * as React from 'react';
import type { FileSystemNode } from '../types';
import { upsertNodeByPath, findNodeByPath } from '../utils/fileSystem';

interface FileExplorerProps {
    nodes: FileSystemNode[];
    onFileSelect: (path: string) => void;
    setFileSystem: React.Dispatch<React.SetStateAction<FileSystemNode[]>>;
    activeFilePath: string | null;
}

const FileNode: React.FC<{ node: FileSystemNode; onFileSelect: (path: string) => void; activeFilePath: string | null; level: number }> = ({ node, onFileSelect, activeFilePath, level }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const isFolder = node.type === 'folder';
    const isActive = activeFilePath === node.path;

    const handleToggle = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        } else {
            onFileSelect(node.path);
        }
    };

    const handleSelect = () => {
        if (!isFolder) {
            onFileSelect(node.path);
        }
    };
    
    const indentStyle = { paddingLeft: `${level * 16}px` };

    return (
        <div>
            <div
                onClick={handleSelect}
                className={`flex items-center p-1 rounded-md cursor-pointer ${
                    isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'
                }`}
                style={indentStyle}
            >
                {isFolder && (
                     <span onClick={handleToggle} className="w-4 mr-1 text-center">{isOpen ? '▾' : '▸'}</span>
                )}
                 <span className={`mr-1 ${isFolder ? '' : 'ml-5'}`}>{isFolder ? '📁' : '📄'}</span>
                <span>{node.name}</span>
            </div>
            {isFolder && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileNode key={child.path} node={child} onFileSelect={onFileSelect} activeFilePath={activeFilePath} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, onFileSelect, setFileSystem, activeFilePath }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const folderInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const filePromises = Array.from(files).map(file => {
            return new Promise<{ path: string, content: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    const path = (file as any).webkitRelativePath || file.name;
                    resolve({ path, content });
                };
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        });

        try {
            const newFiles = await Promise.all(filePromises);
            setFileSystem(prevFileSystem => {
                return newFiles.reduce(
                    (currentSystem, file) => upsertNodeByPath(currentSystem, file.path, 'file', file.content),
                    prevFileSystem
                );
            });
        } catch (error) {
            console.error("Error reading files:", error);
            alert("An error occurred while reading the files.");
        }

        if (event.target) {
            event.target.value = '';
        }
    };

    const handleNewFile = () => {
        const path = prompt("Enter the full path for the new file (e.g., 'css/style.css'):");
        if (path) {
            setFileSystem(prev => upsertNodeByPath(prev, path, 'file', ''));
        }
    };

    const handleNewFolder = () => {
        const path = prompt("Enter the full path for the new folder (e.g., 'components/ui'):");
        if (path) {
            setFileSystem(prev => upsertNodeByPath(prev, path, 'folder'));
        }
    };
    
    const handleDownload = () => {
        if (!activeFilePath) {
            alert("Please select a file to download.");
            return;
        }
        const node = findNodeByPath(nodes, activeFilePath);
        if (!node || node.type !== 'file') {
            alert("Only files can be downloaded. Please select a file.");
            return;
        }

        const blob = new Blob([node.content ?? ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = node.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <aside className="w-64 bg-[#1f2937] p-2 flex flex-col flex-shrink-0">
            <div className="flex-shrink-0 flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Files</h2>
                <div className="flex items-center space-x-1">
                    <button onClick={handleNewFile} title="New File" className="p-1 rounded-md hover:bg-gray-600">📝</button>
                    <button onClick={handleNewFolder} title="New Folder" className="p-1 rounded-md hover:bg-gray-600">📁</button>
                    <button onClick={() => fileInputRef.current?.click()} title="Upload Files" className="p-1 rounded-md hover:bg-gray-600">📄</button>
                    <button onClick={() => folderInputRef.current?.click()} title="Upload Folder" className="p-1 rounded-md hover:bg-gray-600">📂</button>
                    <button onClick={handleDownload} title="Download Selected File" className="p-1 rounded-md hover:bg-gray-600">⬇️</button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-1">
                {nodes.length > 0 ? (
                    nodes.map(node => <FileNode key={node.path} node={node} onFileSelect={onFileSelect} activeFilePath={activeFilePath} level={0} />)
                ) : (
                    <p className="text-gray-500 text-sm text-center mt-4">No files yet. Create or upload a file to start.</p>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
            <input type="file" ref={folderInputRef} onChange={handleFileUpload} className="hidden" multiple {...{ webkitdirectory: "" }} />
        </aside>
    );
};

export default FileExplorer;
