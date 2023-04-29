import Weaver from "main"
import React, { useEffect, useState } from "react"
import { Threads } from "./Threads/Threads"
import { eventEmitter } from "utils/EventEmitter"

export interface ThreadsManagerProps {
	plugin: Weaver
}

export const ThreadsManager: React.FC<ThreadsManagerProps> = ({ plugin }) => {
	const [reloadTrigger, setReloadTrigger] = useState<number>(0);

	useEffect(() => {
		const handleReload = async () => {
			setReloadTrigger((prevTrigger) => prevTrigger + 1);
		};

		eventEmitter.on('reloadThreadsEvent', handleReload);

		return () => {
			eventEmitter.off('reloadThreadsEvent', handleReload);
		};
	}, []);

	return (
		<div className="threads-manager" key={reloadTrigger}>
			<Threads plugin={plugin} />
		</div>
	)
}
