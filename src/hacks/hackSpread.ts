import { AutocompleteData, NS, Server } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { defaultColors, fakeNS } from "@/lib/generalData";
import { forEachServer } from "@/utils/serverUtilities";
import { formNum } from "@/utils/numberFormat";

class Arguments extends ArgumentBase {
	public hackType: ArgumentValue<string> = new ArgumentValue({
		value: 'basic',
		description: 'Options: basic, better',
		aliases: ['type']
	});
	public hackScript: ArgumentValue<string> = new ArgumentValue({
		value: null!,
		description: 'The file path to the hack script that will be spread (if ommited, defaults to type "basic")'
	});
	public depth: ArgumentValue<number> = new ArgumentValue({
		value: -1,
		description: 'The maximum depth to go to while scanning servers'
	});
	public threadMultiplier: ArgumentValue<number> = new ArgumentValue({
		value: 1,
		description: 'The value to multiply the thread assignment with (threads are based off of the required hacking skill of each server)'
	});
	public host: ArgumentValue<string> = new ArgumentValue({
		value: undefined!,
		description: ''
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const args = new Arguments(ns);

	const sevrerList: Server[] = []
	forEachServer(ns, (host) => {
		const server = ns.getServer(host);
		if ((server.moneyMax ?? 0) <= 0) return;
		sevrerList.push(server);
	}, {maxDepth: args.depth.value, hostName: args.host.value})
	
	const sortedServerList = sevrerList.sort((a: Server, b: Server) => (b.moneyMax ?? 0) - (a.moneyMax ?? 0));

	const getScriptByType = () => {
		switch (args.hackType.value.toLowerCase()) {
			case 'better': return 'hacks/betterHack.js';
			default: return 'hacks/basicHack.js';
		}
	}
	const hackScript = (args.hackScript.value !== null) ? args.hackScript.value : getScriptByType();
	const logLines: string[] = []
	const scriptRam = ns.getScriptRam(hackScript);
	
	let totalThreads: number = 0;
	let totalRam = 0;
	for (const server of sortedServerList) {
		bprint(ns, `${server.hostname}: ${formNum(server.moneyMax ?? 0)}`)
		if ((scriptRam * (server.requiredHackingSkill ?? 1)) > (ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname()))) {
			continue; //? not enough ram
		}
		
		let threads = Math.floor((server.requiredHackingSkill ?? 1) * args.threadMultiplier.value);
		if (threads <= 0) { continue; }
		// if ((ns.getServerMaxRam('home') / 2) < ((server.requiredHackingSkill ?? 1) * scriptRam)) {
		// 	threads = Math.floor(threads / 2) //TODO make it make more logical sencical popsical
		// }

		ns.run(hackScript, {threads: threads}, server.hostname)
		logLines.push(`Started hacking [fg=${defaultColors.orange}]${server.hostname}[/>] with [fg=${defaultColors.green}]${threads}[/>] threads`);
		
		totalThreads += threads;
		totalRam += scriptRam * (threads);
	}

	bprint(ns, '--terminal', logLines.join('\n'), `\nTotal threads: [fg=${defaultColors.green}]${totalThreads}[/>]\nTotal RAM: ${formNum(totalRam)}`);
}

export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = [];
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return ['hacks/basicHack.js', 'hacks/betterHack.js'];
}