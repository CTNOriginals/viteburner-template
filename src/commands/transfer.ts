import { AutocompleteData, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { DNS } from "@/director";
import { ScriptImportLine } from "@/lib/regExpPresets";
import { fakeNS } from "@/lib/generalData";
import { getAllImportPaths } from "@/utils";

class Arguments extends ArgumentBase {
	public file: ArgumentValue<string|string[]> = new ArgumentValue({
		value: [],
		description: 'The file to transfer',
		required: true
	});
	public server: ArgumentValue<string|string[]> = new ArgumentValue({
		value: '',
		description: 'The name(s) of the server to transfer the file to',
		required: true,
		aliases: ['host']
	});
	public destination: ArgumentValue<string> = new ArgumentValue({
		value: '',
		description: 'The file path to transfer the file into, if ommited, the original file path will be used',
		default: null!,
		aliases: ['dest']
	});
	public source: ArgumentValue<string|null> = new ArgumentValue({
		value: '',
		description: 'The server to copy the files from',
		default: null!,
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const args = new Arguments(ns);
	const argsObj = args.asValueObject;
	const destServers = (Array.isArray(argsObj.server)) ? [...argsObj.server] : [argsObj.server];
	const files = (Array.isArray(argsObj.file)) ? argsObj.file : [argsObj.file];
	
	bprint(ns, files);
	bprint(ns, args.asValueObjectNoDefault);

	for (const file of files) {
		if (!ns.fileExists(file)) {
			throw new Error(`File does not exist: ${file}`);
		}
		
		const logLines: string[] = [];
		const fileTransferList = getAllImportPaths(ns, file);
		bprint(ns, `imports:`, fileTransferList);
		
		destServers.forEach(server => {
			fileTransferList.forEach(f => {
				logLines.push(`Transfered "${f}" to "${server}"${((argsObj.source != '') ? ` from "${argsObj.source}"` : "")}`)
				
				ns.scp(f, server, (argsObj.source != '') ? argsObj.source : null)
			})
			if (argsObj.destination != '') {
				logLines.push(`On "${server}": Moved "${file}" to "${argsObj.destination}"`);
				ns.mv(server, file, argsObj.destination);
			}
		})

		bprint(ns, '--terminal', logLines.join('\n'))
	}

}


export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = []
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return [data.scripts, data.servers];
}