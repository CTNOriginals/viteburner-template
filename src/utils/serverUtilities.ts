import { bprint } from "@/handlers/printHandler";
import { NS } from "@ns";
import { populateOptionObject } from ".";

interface IServerLoopOptions {
	hostName?: string,
	requireRootAccess: boolean,
	maxDepth: number,
	includeStartingSevrer: boolean,
	topLevel: boolean,
	currentDepth: number,
	hostHistory: string[],
}
class ServerLoopOptionsDefaults /*Required<IServerLoopOptions>*/ {
	public hostName = undefined!;
	public requireRootAccess = true;
	public maxDepth = -1;
	public includeStartingSevrer = false;
	public topLevel = true;
	public currentDepth = 0;
	public hostHistory = [];
}

export function forEachServer(
	ns: NS,
	callback: (hostName: string, depth: number, parentHost: string) => void,
	inputOptions: Partial<IServerLoopOptions> = new ServerLoopOptionsDefaults()
): void {
	const options = populateOptionObject<IServerLoopOptions>(inputOptions, new ServerLoopOptionsDefaults()) as Required<IServerLoopOptions>
	// bprint(ns, options);

	if (options.topLevel) {
		if (options.hostName === undefined) {
			options.hostName = ns.getHostname();
		}
		bprint(ns, `${options.hostName}: TOP LEVEL`)

		options.hostHistory.push(options.hostName);
		options.topLevel = false;

		// bprint(ns, options.hostHistory);
	}

	ns.scan(options.hostName).forEach(host => {
		if (options.hostHistory.includes(host)) {
			bprint(ns, `${host} is present in history, continueing...`);
			return;
		};
		if (options.requireRootAccess === true && ns.hasRootAccess(host) === false) return;

		callback(host, options.currentDepth, options.hostName);
		options.hostHistory.push(host);
		bprint(ns, `done: ${host}`)

		if (ns.scan(host).length > 0 && (options.maxDepth < 0 || options.maxDepth > options.currentDepth)) {
			// forEachServer(ns, callback, host, requireRootAccess, maxDepth, includeStartingSevrer, false, currentDepth + 1);
			const newOptions = {...options};
			newOptions.currentDepth += 1;
			newOptions.hostName = host;
			forEachServer(ns, callback, newOptions);
		}
	})
}



// export function main(ns: NS) {
// 	ns.disableLog('ALL');

// 	const serverDepth: {[depth: number]: {[parent: string]: string[]}} = {};
// 	forEachServer(ns, (host, depth, parent) => {
// 		if (!Object.keys(serverDepth).includes(depth.toString())) {
// 			serverDepth[depth] = {[parent]: []};
// 		}
// 		else if (!Object.keys(serverDepth[depth]).includes(parent)) {
// 			serverDepth[depth][parent] = [];
// 		}

// 		serverDepth[depth][parent].push(host);
// 	}, {maxDepth: -1, requireRootAccess: false});

// 	bprint(ns, serverDepth);
// }