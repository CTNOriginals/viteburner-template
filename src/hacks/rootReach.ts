import { AutocompleteData, NS, Server } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { DNS } from "@/director";
import { forEachServer } from "@/utils/serverUtilities";
import { defaultColors, fakeNS, IPortCrackScript, portCrackScripts } from "@/lib/generalData";

class Arguments extends ArgumentBase {
	public depth: ArgumentValue<number> = new ArgumentValue({
		value: -1,
		description: 'The maximum depth to go to (-1 for infinate)'
	});
	public noPrint: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Do not print the steps to the terminal'
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const args = new Arguments(ns);
	const maxDepth = args.depth.value;
	
	const logLines: string[]= [];
	const player = ns.getPlayer();
	const availablePortScripts: typeof portCrackScripts = [];
	portCrackScripts.forEach((p) => {
		if (ns.fileExists(`${p.name}.exe`)) availablePortScripts.push(p);
	})

	forEachServer(ns, (host, depth, parent) => {
		const server: Server = ns.getServer(host);

		if (player.skills.hacking < (server.requiredHackingSkill ?? 0)) return;
		if (((server.numOpenPortsRequired ?? 0) - (server.openPortCount ?? 0)) > availablePortScripts.length) return;

		if (((server.numOpenPortsRequired ?? 0) - (server.openPortCount ?? 0)) > 0) {
			crackPorts(ns, server, availablePortScripts)
		}

		if (!server.hasAdminRights) {
			ns.nuke(host);
			logLines.push(`[fg=${defaultColors.orange}]${host}[/>]: [fg=${defaultColors.red}]NUKED[/>]!\n`);
		}

	}, {maxDepth: maxDepth, requireRootAccess: false});
	
	
	function crackPorts(ns: NS, server: Server, availableScripts: typeof portCrackScripts) {
		for (let i = 0; i < (server.numOpenPortsRequired ?? 0); i++) {
			ns[availableScripts[i].name.toLowerCase()](server.hostname); //? call the ns function that corosponds to the available port script
			logLines.push(`[fg=${defaultColors.orange}]${server.hostname}[/>]: Port [fg=${defaultColors.green}]${availableScripts[i].prefix.toUpperCase()}[/>] Cracked!`);
		}
	}

	bprint(ns, '--terminal', logLines.join('\n'));
}


export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = []
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return [];
}