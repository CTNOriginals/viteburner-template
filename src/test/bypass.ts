import { NS } from "@ns";

export async function main(ns: NS) {
	ns.disableLog('ALL');

	const doc = ns.bypass(ns.getScriptRam);
	console.log(doc('test/bypass.js'));

	while (true) {
		await ns.asleep(1000);
	}
}