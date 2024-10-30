import { AutocompleteData, NS, RunningScript } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { formNum } from "@/utils/numberFormat";
import { ServerStats } from "./basicHack";
import { fakeNS } from "@/lib/generalData";

class Arguments extends ArgumentBase {
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

interface IServerCache {
	weakenEffect: number;
	total: number;
}
const serverCache: {[server: string]: IServerCache} = {}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const ARGUMENTS = new Arguments(ns);
	const args = ARGUMENTS.asValueObject;

	const serverList: string[] = [];

	bprint(ns, ARGUMENTS.looseArgs);
	for (const arg of ARGUMENTS.looseArgs) {
		if (ns.serverExists(arg.toString())) {
			serverList.push(arg.toString());
			serverCache[arg] = {
				weakenEffect: 0,
				total: 0,
			};
		}
	}

	const thisScript = ns.getRunningScript()!;
	while (true) {
		for (const server of serverList) {
			await hackServer(ns, server, thisScript);
		}

		await ns.asleep(1000);
		// bprint(ns, `---- CYCLE ----`);
	}
}


async function hackServer(ns: NS, hostName: string, thisScript: RunningScript) {
	const stats = new ServerStats(ns, hostName);
	let logLine = "";

	if (stats.security.current - serverCache[hostName].weakenEffect > stats.security.target) { //? Security is too high
		const res = await ns.weaken(hostName);
		serverCache[hostName].weakenEffect = (res > 5) ? 5 : serverCache[hostName].weakenEffect;
		logLine = `[fg=#be093f]Weaken[/>]: ${formNum(stats.security.current)} => ${formNum((stats.security.current - res))} (${formNum(res)})`;
	}
	else if (stats.money.current < stats.money.target) {
		const res = await ns.grow(hostName);
		logLine = `[fg=#09be79]Grow[/>]: ${formNum((stats.money.current))} => ${formNum((stats.money.current * res))} (${formNum(res)})`;
	}
	else {
		let halfGainThreads = ns.hackAnalyzeThreads(hostName, stats.money.current / 2)
		const res = await ns.hack(hostName, {threads: Math.min(halfGainThreads, thisScript.threads)});
		logLine = `[fg=#ffa500]Hack[/>]: ${formNum(res)}`;
		serverCache[hostName].total += res;
	}

	stats.Update(ns);
	bprint(ns, [
		`\n ${hostName} -- ${logLine}`,
		`[fg=#068051]Money[/>]: (${stats.moneyStats})`,
		`[fg=#80062b]Security[/>]: (${stats.securityStats})`,
		`[fg=#996300]Total[/>]: ${formNum(serverCache[hostName].total)}`
	].join('\n'));
} 

export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = []
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return data.servers;
}