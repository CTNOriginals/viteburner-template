import { NS, RunningScript } from "@ns";
import { bprint } from "@/handlers/printHandler";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { forEachServer } from "@/utils/serverUtilities";

class Arguments extends ArgumentBase {
	public files: ArgumentValue<string[]> = new ArgumentValue({
		value: [],
		description: 'The scripts to include (leave empty to indlude all)'
	});
	public interval: ArgumentValue<number> = new ArgumentValue({
		value: 1000,
		description: 'The time to wait between log fetch updates'
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	const scriptLogHistory: {[key: string]: string[]} = {}
	
	const targetProcesses: number[] = [];

	ns.disableLog('ALL');
	ns.clearLog();
	ns.tail();
	
	const args = new Arguments(ns);
	const runningScripts = ns.ps();
	
	if (args.files.value?.length > 0) {
		for (const script of runningScripts) {
			if (args.files.value.includes(script.filename)) {
				targetProcesses.push(script.pid)
			}
		}
	}
	else {
		forEachServer(ns, (hostName) => {
			runningScripts.push(...ns.ps(hostName))
		})
		runningScripts.forEach((process)=> {
			if (process.filename != ns.getScriptName()) {
				targetProcesses.push(process.pid)
			}
		});
	}

	while(true) {
		updateLog(ns)
		await ns.asleep(args.interval.value ?? 1000)
	}
	
	async function updateLog(ns: NS) {
		for (const pid of targetProcesses) {
			const script = ns.getRunningScript(pid);
			const logs: string[] = []
			const isInHistory: boolean = Object.keys(scriptLogHistory).includes(pid.toString());
	
			if (!script || !ns.isRunning(pid)) {
				ns.print(`Could not find running script for (${pid}).`)
				targetProcesses.splice(targetProcesses.indexOf(pid), 1);
				if (isInHistory) delete scriptLogHistory[pid];
				continue;
			}
	
			if (isInHistory) {
				const logHistory = scriptLogHistory[pid];
				const newLines = script.logs.slice(logHistory.length, -1)
				logs.push(...newLines)
				logHistory.push(...newLines)
			}
			else {
				logs.push(...script.logs)
				scriptLogHistory[script.pid] = script.logs;
			}
	
			if (logs.length === 0) continue;
	
			const header: string = `[fg=gray]${script.filename}[/>] ${(script.args.length > 0) ? `[${script.args.join(', ')}] ` : ``}(${script.pid})`;
			bprint(ns, `${header}\n${logs.join('\n')}\n`);
		}
	}
}
