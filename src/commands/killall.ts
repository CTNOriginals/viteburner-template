import { AutocompleteData, NS, ProcessInfo } from "@ns";
import { bprint } from "@/handlers/printHandler";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { forEachServer } from "@/utils/serverUtilities";
import { fakeNS } from "@/lib/generalData";

class Arguments extends ArgumentBase {
	public ALL: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Actually kill ALL scripts, including the managers and director on all servers',
		aliases: ['A', 'all']
	});
	public AllServers: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Include all scripts on other servers',
		aliases: ['all-servers']
	});
	public director: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Should the director be included?',
	});
	public managers: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Should the managers be included?',
		aliases: ['manager']
	});
	public hacks: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Kill hack scripts only',
	});
	public watchers: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Only kill all script watchers (meant as a cleanup alternative)',
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	ns.disableLog('ALL')
	const _args = new Arguments(ns);
	const args = _args.asValueObject;

	if (args.ALL === true || args.AllServers === true) {
		forEachServer(ns, (hostName) => {
			killList(ns, _args.asValueObjectNoDefault, [...ns.ps(hostName)], hostName);
		})
	}

	let ps = ns.ps();
	const list: ProcessInfo[] = (args.watchers || args.hacks) ? [] : ps;
	
	if (args.watchers) {
		list.push(...getListFromFileName('tools/scriptWatcher.js', ps))
	}
	if (args.hacks) {
		list.push(...getListFromFileName('hacks/basicHack.js', ps))
		list.push(...getListFromFileName('hacks/betterHack.js', ps))
	}
	
	killList(ns, _args.asValueObjectNoDefault, list);
}

function getListFromFileName(file: string, ps: ProcessInfo[]): ProcessInfo[] {
	const list: ProcessInfo[] = [];
	for (let i = 0; i < ps.length; i++) {
		if (ps[i].filename === file) {
			// bprint(DNS, `added ${ps[i].filename} from kill list`);
			list.push(ps[i]);
		}
	}
	return list;
}

function killList(ns: NS, args: Arguments['asValueObjectNoDefault'], list: ProcessInfo[], hostName?: string) {
	for (const info of list) {
		if (
			args.ALL === false && (
				(info.filename === 'director.js' && args.director === false) || 
				(info.filename.split('/')[0] === 'managers' && args.managers === false) || 
				info.filename === ns.getRunningScript()?.filename
			)
		) { continue; }

		if (hostName != undefined) {
			ns.kill(info.filename, hostName, ...info.args);
			bprint(ns, '--terminal', `On "${hostName}": Killed "${info.filename}" (${info.pid})`)
		}
		else {
			ns.kill(info.pid);
			bprint(ns, '--terminal', `Killed "${info.filename}" (${info.pid})`)
		}
	}
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