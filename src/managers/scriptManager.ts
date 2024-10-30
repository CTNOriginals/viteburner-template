import { NS } from "@ns";

let LNS: NS = null!; //? Local Net Script
export async function main(ns: NS) {
	LNS = ns;
	ns.disableLog('ALL');
	
	while (true) {
		await ns.asleep(100);
	}
}