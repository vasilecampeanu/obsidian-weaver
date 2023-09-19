import React from "react";
import Weaver from "main"

interface QuestionProps {
	plugin: Weaver,
	question: string
}

export const Question: React.FC<QuestionProps> = ({ plugin, question }) => {
	return (
		<div className="ow-question">
			{question}
		</div>
	)
}
