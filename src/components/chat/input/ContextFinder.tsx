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
				<div className="ow-context-list">
                    {filteredFiles.map(file => (
						<div 
							key={file.path}
							className="ow-context-item"
						>
							<div className="ow-file-name">
								{file.name}
							</div>
                            <div className="ow-file-path">
								{fileNameCounts[file.name] > 1 && `${file.path}`}
							</div>
						</div>
                    ))}
				</div>
            )}

			<div className="ow-searchbox-wrapper">
				<input
					type="text"
					placeholder="Search files..."
					className="ow-searchbox"
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
				/>
				<button
					className="ow-submit"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
				</button>
			</div>
        </div>
    );
}
