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
					onClick={() => {plugin.app.workspace.getLeaf(false).openFile(textSelectedData?.file as TFile)}}
				>
					{textSelectedData?.file?.name}
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
					Send
				</button>
				<button
					className="ow-ignore-btn"
					onClick={() => { eventEmitter.emit('textSelected', { text: undefined }); }}
				>
					Ignore
				</button>
			</div>
		</div>
	)
}
