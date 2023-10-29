import { TextSelectedData } from "interfaces/TextSelectedData";
import Weaver from "main";
import { TFile } from "obsidian";
import React, { useEffect } from "react";
import { eventEmitter } from "utils/EventEmitter";

interface SelectedTextProps {
	plugin: Weaver,
	textSelectedData: TextSelectedData | undefined
}

export const SelectedText: React.FC<SelectedTextProps> = ({ plugin, textSelectedData }) => {
	return (
		<div className="ow-selected-text">
			<div className="ow-title">
				<span>Send to chat?</span>
				<div className="ow-selected-text-info">
					<span className="ow-selected-text-char-count">{textSelectedData?.text?.length}/2000</span>
					<span className="ow-token-count">0</span>
				</div>
			</div>
			<div className="ow-source-file-info">
				<button
					className="ow-file-name-btn"
					onClick={() => {plugin.app.workspace.getLeaf(false).openFile(textSelectedData?.file as TFile)}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
					<span>
						{textSelectedData?.file?.name}
					</span>
				</button>
			</div>
			<div className="ow-selected-text-content">
				{textSelectedData?.text}
			</div>
			<div className="ow-user-actions">
				<button
					className="ow-send-to-caht-btn"
					onClick={() => { eventEmitter.emit('textSelected', { text: undefined }); }}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
					<span>Send</span>
				</button>
				<button
					className="ow-ignore-btn"
					onClick={() => { eventEmitter.emit('textSelected', { text: undefined }); }}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-ban"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
					<span>Ignore</span>
				</button>
			</div>
		</div>
	)
}
