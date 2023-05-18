import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef } from "react";

interface ConversationEngineInfoProps {
	plugin: Weaver;
	activeEngine: "gpt-3.5-turbo" | "gpt-4";
}

export const ConversationEngineInfo: React.FC<ConversationEngineInfoProps> = ({
	plugin,
	activeEngine
}) => {
	return (
		<>
			{activeEngine === "gpt-3.5-turbo" ? (
				<div className="ow-engine-info">
					<div className="ow-info-text">
						<p>GPT-3.5 can follow complex instructions in natural language and solve difficult problems. This is the fatest model, great for everyday tasks.</p>
						<p className="chat-gpt-info">Available to <b>free</b> and <b>plus</b> users on ChatGPT.</p>
					</div>
					<div className="ow-efficiency-graph">
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Reasoning
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
							</div>
						</div>
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Speed
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
							</div>
						</div>
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Conciseness
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
							</div>
						</div>
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Price
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
							</div>
						</div>
					</div>
					<div className="ow-list-info">
						<div className="ow-list-row ow-header">
							<div className="ow-row-title">
								Context
							</div>
							<div className="ow-info">
								Usage
							</div>
						</div>
						<div className="ow-list-row">
							<div className="ow-row-title">
								4,096 tokens
							</div>
							<div className="ow-info">
								$0.002/1K
							</div>
						</div>
					</div>
					<div className="ow-info-text">
						<p>One token generally corresponds to ~4 characters of text for common English text. This translates to roughly ¾ of a word (so 100 tokens ~= 75 words).</p>
					</div>
				</div>
			) : (
				<div className="ow-engine-info">
					<div className="ow-info-text">
						<p>GPT-4 excels at tasks that require advanced reasoning, complex instruction understanding, and more creativity.</p>
						<p className="chat-gpt-info">Available exclusivly to <b>plus</b> users on ChatGPT.</p>
					</div>
					<div className="ow-efficiency-graph">
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Reasoning
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
							</div>
						</div>
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Speed
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
								<div className="ow-stat-point"></div>
							</div>
						</div>
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Conciseness
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point"></div>
							</div>
						</div>
						<div className="ow-efficiency-row">
							<div className="ow-row-title">
								Price
							</div>
							<div className="ow-efficiency-stats">
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point ow-active"></div>
								<div className="ow-stat-point"></div>
							</div>
						</div>
					</div>
					<div className="ow-list-info">
						<div className="ow-list-info">
							<div className="ow-list-row ow-header">
								<div className="ow-row-title">
									Context
								</div>
								<div className="ow-info">
									Prompt
								</div>
								<div className="ow-info">
									Completion
								</div>
							</div>
							<div className="ow-list-row">
								<div className="ow-row-title">
									8K tokens
								</div>
								<div className="ow-info">
									$0.03/1K
								</div>
								<div className="ow-info">
									$0.06/1K
								</div>
							</div>
							<div className="ow-list-row">
								<div className="ow-row-title">
									32K tokens
								</div>
								<div className="ow-info">
									$0.06/1K
								</div>
								<div className="ow-info">
									$0.12/1K
								</div>
							</div>
						</div>
					</div>
					<div className="ow-info-text">
						<p>One token generally corresponds to ~4 characters of text for common English text. This translates to roughly ¾ of a word (so 100 tokens ~= 75 words).</p>
					</div>
					<div className="ow-info-text ow-importanr">
						<p>As of now, GPT-4 is not widely available. To access it, you will need to request access from OpenAI.</p>
					</div>
				</div>
			)}
		</>
	)
}
