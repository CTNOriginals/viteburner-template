import { NS } from "@ns";
// import { forEachServer } from "./utils/serverUtilities";
// import { bprint } from "./handlers/printHandler";

/** Director-Net-Script */
export let DNS: NS;
export async function main(ns: NS) {
	ns.disableLog('ALL');
	
	while (true) {
		DNS = ns;
		// if (ns.getHostname() == 'home') {
		// 	forEachServer(ns, (hostName) => {
		// 		if (ns.fileExists('director.js', hostName) && !ns.isRunning('director.js', hostName)) {
		// 			ns.exec('director.js', hostName);
		// 		}
		// 	});
		// }

		await ns.asleep(1000);
	}
}