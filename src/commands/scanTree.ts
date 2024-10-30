import { AutocompleteData, NS, Server } from '@ns';
import { bprint } from '../handlers/printHandler.js';
import { ArgumentBase, ArgumentValue } from '@/handlers/argumentHandler.js';
import { formNum } from '@/utils/numberFormat.js';
import { DNS } from '@/director.js';
import { fakeNS } from '@/lib/generalData.js';

class Arguments extends ArgumentBase {
	public depth: ArgumentValue<number> = new ArgumentValue({value: -1, description: 'The max depth it can reach.'});
	public print: ArgumentValue<boolean> = new ArgumentValue({value: true, description: 'Print to terminal'});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

type ChildConnectionObject = {[key:string]: IConnection};
interface IConnection {
	server: Server,
	children: ChildConnectionObject
}

/** @param {NS} ns */
export async function main(ns: NS) {
	
	// ns.tail();
	ns.disableLog('ALL')
	const args: Arguments = new Arguments(ns);
	
	let serverHistory: string[] = []
	let maxDepth = args.depth.value;
	const indentChar = '| ';
	const depthColors: string[] = [
		'#00ff00',
		'#00ffea',
		'#008cff',
		// '#0000ff',
		'#6f00ff',
		'#b700ff',
		'#f700ff',
		'#ff0077',
		// '#ff0000',
		'#ff7b00',
		'#ffd900',
		'#bbff00',
	]
	const colorTag = (str: string, index: number) => `[fg=${depthColors[index % depthColors.length]}]${str}[/>]`;
	const getIndent = (depth = 1): string => {
		let out = '';
		for (let i = 0; i < depth; i++) {
			out += colorTag(indentChar, i);
		}
		return out
	}
	let indent: string = getIndent();
	
	serverHistory = [ns.getHostname()];
	ns.print(maxDepth)
	
	const connection: IConnection = {
		server: ns.getServer(),
		children: getConnectedServers(ns.getHostname())
	}
	
	serverHistory = [];
	if (args.debug.value) {
		bprint(ns, parseConnections(ns, connection))
	}
	if (args.print.value) {
		bprint(ns, '--terminal', parseConnections(ns, connection))
	}

	function getConnectedServers(hostName: string, depth: number = 0): ChildConnectionObject {
		let out: ChildConnectionObject = {};
		const serverConnections = ns.scan(hostName);
		for (const target of serverConnections) {
			if (serverHistory.includes(target)) continue;
			else serverHistory.push(target)
			const server = ns.getServer(target);
			
			const connection: IConnection = {
				server: server,
				children: (depth < maxDepth - 1) ? getConnectedServers(target, depth + 1) : {}
			}
			out[target] = connection
		}
		return out;
	}

	function parseConnections(ns: NS, connection: IConnection, depth: number = 0): string {
		if (indent.split(indentChar).length != depth * indentChar.length) indent = getIndent(depth)
		let out = indent + colorTag(connection.server.hostname, depth);
		out += getServerInfo(ns, connection.server, '\n' + indent + colorTag('- ', depth));
	
		for (const key in connection.children) {
			if (serverHistory.includes(key)) continue; //? Check for recursions
			else serverHistory.push(key);
			
			const value = connection.children[key];
			out += `\n${parseConnections(ns, value, depth + 1)}`
		}
	
		return out;
	}
	
	//TODO migrade this to its own script and put it in a class that holds these fields better
	function getServerInfo(ns: NS, server: Server, space: string = ''): string { //{[key: string]: any} {
		let out = '';
	
		const data = {
			access: `${server.hasAdminRights}${(server.purchasedByPlayer) ? ' (Owned)' : ''}`,
			ports: `${server.openPortCount}/${server.numOpenPortsRequired}`,
			RAM: `${server.ramUsed}/${server.maxRam}`,
			money: `${formNum(server.moneyAvailable!)}/${formNum(server.moneyMax!)} (${formNum(server.moneyMax! - server.moneyAvailable!)})`,
			security: `${server.minDifficulty}/${formNum(server.hackDifficulty!)}`,
			level: `[fg=#${(ns.getPlayer().skills.hacking >= (server.requiredHackingSkill ?? 0)) ? '09be79' : 'be093f'}]${server.requiredHackingSkill}[/>]`
		}
	
		for (const [key, value] of Object.entries(data)) {
			out += `${space}${key}: ${value}`;
		}
	
		return out;
	}
}

// function isServerHackable(ns: NS, server: Server): boolean {
// 	if (server.hasAdminRights || server.purchasedByPlayer) return false; //? Already hacked/owned
// 	if (server.moneyMax! <= 0 || server.moneyAvailable === 0) return false;
// 	if (server.requiredHackingSkill! > ns.getHackingLevel()) return false;
// 	return true
// }

// function roundFloat(num: number = 0, precision: number = 2): number {
// 	var multiplier = Math.pow(10, precision || 0);
//     return Math.round(num * multiplier) / multiplier;
// }

export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = []
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return [];
}