import React, { useEffect, useState } from "react";
import Weaver from "main";
import { TFile } from "obsidian";

interface ContextFinderProps {
    plugin: Weaver;
}

export const ContextFinder: React.FC<ContextFinderProps> = ({ plugin }) => {
    const [files, setFiles] = useState<TFile[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        const allFiles: TFile[] = plugin.app.vault.getMarkdownFiles();
        setFiles(allFiles);
    }, []);

    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const countFileNames = (files: TFile[]) => {
        const counts: { [key: string]: number } = {};
        files.forEach(file => {
            counts[file.name] = (counts[file.name] || 0) + 1;
        });
        return counts;
    };

    const fileNameCounts = countFileNames(filteredFiles);

    return (
        <div className="ow-context-finder">
            {searchQuery.length > 0 && (
                <ul>
                    {filteredFiles.map(file => (
                        <li key={file.path}>
                            {file.name}
                            {fileNameCounts[file.name] > 1 && ` (${file.path})`}
                        </li>
                    ))}
                </ul>
            )}

            <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
    );
}
