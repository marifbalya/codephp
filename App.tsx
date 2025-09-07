// Fix: Changed React import to `import * as React from 'react'` to resolve JSX type errors.
import * as React from 'react';
import { generateCode } from './services/geminiService';
import type { FileSystemNode, FileOperation } from './types';
import FileExplorer from './components/FileExplorer';
import EditorPanel from './components/EditorPanel';
import PreviewDisplay from './components/PreviewDisplay';
import { TabButton } from './components/Tabs';
import { findNodeByPath, applyOperations, getFileContent } from './utils/fileSystem';

type RightPanelTab = 'preview' | 'reasoning';

const App: React.FC = () => {
    // Fix: Updated hook calls to use `React.*` syntax for consistency with the new import style.
    const [prompt, setPrompt] = React.useState<string>('');
    const [fileSystem, setFileSystem] = React.useState<FileSystemNode[]>([]);
    const [openFilePaths, setOpenFilePaths] = React.useState<string[]>([]);
    const [activeFilePath, setActiveFilePath] = React.useState<string | null>(null);
    const [htmlOutput, setHtmlOutput] = React.useState<string>('');
    const [reasoning, setReasoning] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [activeRightTab, setActiveRightTab] = React.useState<RightPanelTab>('preview');

    const handleFileSelect = React.useCallback((path: string) => {
        if (!openFilePaths.includes(path)) {
            setOpenFilePaths(prev => [...prev, path]);
        }
        setActiveFilePath(path);
    }, [openFilePaths]);
    
    const handleCloseFile = React.useCallback((path: string) => {
        setOpenFilePaths(prev => prev.filter(p => p !== path));
        if (activeFilePath === path) {
            const remainingFiles = openFilePaths.filter(p => p !== path);
            setActiveFilePath(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null);
        }
    }, [activeFilePath, openFilePaths]);

    const handleSubmit = React.useCallback(async () => {
        if (!prompt.trim()) {
            setError("Prompt cannot be empty.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setReasoning('');

        try {
            const result = await generateCode(prompt, fileSystem);
            const newFileSystem = applyOperations(fileSystem, result.operations);

            setFileSystem(newFileSystem);
            setHtmlOutput(result.html_output);
            setReasoning(result.reasoning);
            setActiveRightTab('preview');
            setPrompt('');

            // If a new file was created and is not open, open it.
            const createdFile = result.operations.find(op => op.action === 'CREATE');
            if(createdFile && findNodeByPath(newFileSystem, createdFile.path)?.type === 'file') {
                handleFileSelect(createdFile.path);
            }

        } catch (e: any)
{
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt, fileSystem, handleFileSelect]);
    
    const activeFileContent = React.useMemo(() => {
        if (!activeFilePath) return null;
        return getFileContent(fileSystem, activeFilePath);
    }, [fileSystem, activeFilePath]);

    return (
        <div className="h-screen w-screen bg-[#111827] text-gray-300 flex flex-col">
            <header className="flex-shrink-0 text-center py-2 border-b border-gray-700">
                <h1 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                    AI Web Studio
                </h1>
            </header>
            <main className="flex-grow flex min-h-0">
                <FileExplorer
                    nodes={fileSystem}
                    onFileSelect={handleFileSelect}
                    setFileSystem={setFileSystem}
                    activeFilePath={activeFilePath}
                />
                <div className="flex-grow flex flex-col w-1/2 border-l border-r border-gray-700">
                    <EditorPanel
                        fileSystem={fileSystem}
                        openFilePaths={openFilePaths}
                        activeFilePath={activeFilePath}
                        onSelectFile={setActiveFilePath}
                        onCloseFile={handleCloseFile}
                    />
                     <div className="flex-shrink-0 p-3 bg-[#1f2937] border-t border-gray-700 flex flex-col">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Create a login form and style it with modern CSS.'"
                            className="w-full bg-[#2d3748] text-gray-200 p-2 rounded-md resize-none border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                        >
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                         {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                    </div>
                </div>
                <div className="flex-grow flex flex-col w-1/3">
                     <div className="flex-shrink-0 p-2 flex items-center justify-between bg-[#1f2937] border-b border-gray-700">
                         <h2 className="text-lg font-semibold px-2">Output</h2>
                         <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
                            {/* Fix: The `useState` setter `setActiveRightTab` has a signature that is not directly compatible with `TabButton`'s `onClick` prop. Wrapping it in a lambda function resolves the type mismatch. */}
                            <TabButton label="Preview" value="preview" activeTab={activeRightTab} onClick={(value) => setActiveRightTab(value)} />
                            {/* Fix: The `useState` setter `setActiveRightTab` has a signature that is not directly compatible with `TabButton`'s `onClick` prop. Wrapping it in a lambda function resolves the type mismatch. */}
                            <TabButton label="Reasoning" value="reasoning" activeTab={activeRightTab} onClick={(value) => setActiveRightTab(value)} />
                         </div>
                    </div>
                    <div className="flex-grow p-2 bg-gray-900 min-h-0">
                        {activeRightTab === 'preview' ? (
                            <PreviewDisplay htmlContent={htmlOutput} />
                        ) : (
                            <div className="p-4 bg-[#1f2937] rounded-lg h-full overflow-y-auto text-sm prose prose-invert prose-sm max-w-none">
                                {reasoning ? <p>{reasoning}</p> : <p className="text-gray-400">AI's explanation will appear here after code generation.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
