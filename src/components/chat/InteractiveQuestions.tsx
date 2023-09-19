import React from "react";
import Weaver from "main"
import { Question } from "./Question";

interface InteractiveQuestionsProps {
	plugin: Weaver
}

export const InteractiveQuestions: React.FC<InteractiveQuestionsProps> = ({ plugin }) => {
	return (
		<div className="ow-interactive-questions">
			<Question plugin={plugin} question="Generate note summary" />
		</div>
	)
}
