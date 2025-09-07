// Fix: Changed React import to `import * as React from 'react'` to resolve JSX type errors.
import * as React from 'react';
import type { FileSystemNode } from '../types';
import CodeDisplay from './CodeDisplay';
import { getFileContent, findNodeByPath } from '../utils/fileSystem';

interface EditorPanelProps {
    fileSystem: FileSystemNode[];
    openFilePaths: string[];
    activeFilePath: string | null;
    onSelectFile: (path: string) => void;
    onCloseFile: (path: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ fileSystem, openFilePaths, activeFilePath, onSelectFile, onCloseFile }) => {

    const activeFileContent = React.useMemo(() => {
        if (!activeFilePath) return null;
        return getFileContent(fileSystem, activeFilePath);
    }, [fileSystem, activeFilePath]);

    if (openFilePaths.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center bg-[#1e293b]">
                <div className="text-center text-gray-500">
                    <p>No file open</p>
                    <p className="text-sm">Select a file from the explorer to begin editing.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-grow flex flex-col min-h-0">
            <div className="flex-shrink-0 bg-[#111827] flex items-center border-b border-gray-700">
                <div className="flex overflow-x-auto">
                    {openFilePaths.map(path => {
                        const node = findNodeByPath(fileSystem, path);
                        const isActive = activeFilePath === path;
                        return (
                            <div
                                key={path}
                                onClick={() => onSelectFile(path)}
                                className={`flex items-center pl-3 pr-1 py-2 text-sm cursor-pointer border-r border-t border-gray-700 ${
                                    isActive ? 'bg-[#1e293b] text-white border-t-indigo-500' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                <span>{node?.name || path}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCloseFile(path);
                                    }}
                                    className="ml-2 px-1 rounded hover:bg-gray-600"
                                >
                                    &times;
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            {activeFileContent !== null ? (
                <CodeDisplay code={activeFileContent} />
            ) : (
                <div className="flex-grow flex items-center justify-center bg-[#1e293b]">
                    <div className="text-center text-gray-500">
                        <p>File content not found.</p>
                        <p className="text-sm">The selected file may have been deleted or is empty.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorPanel;