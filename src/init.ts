import { NS } from "@ns";
import { bprint } from "@/handlers/printHandler";

interface IInitScript {
	filename: string;
	singleton?: boolean;
}
const InitScriptList: IInitScript[] = [
	// {
	// 	filename: 'managers/pageManager.js',
	// 	singleton: true
	// },
]

export async function main(ns: NS) {
	ns.disableLog('ALL')

	const ps = ns.ps();
	
	if (ps.find(p => p.filename == 'director.js') == null) {
		ns.tprint(`Starting: director.js`)
		ns.run('director.js', {preventDuplicates: true});
	}

	for (const initScript of InitScriptList) {
		let runScript = !initScript.singleton;

		if (initScript.singleton) {
			if (ps.find(p => p.filename == initScript.filename) == null) {
				runScript = true;
			}
		}

		if (runScript) {
			ns.tprint(`Starting: ${initScript.filename}`)
			ns.run(initScript.filename, {preventDuplicates: true});
		}
	}
}