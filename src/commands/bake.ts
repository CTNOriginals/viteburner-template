import { AutocompleteData, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { DNS } from "@/director";
import { FilePath } from "@/utils/fileUtilities";
import { ScriptImportLine } from "@/lib/regExpPresets";
import { fakeNS } from "@/lib/generalData";

class Arguments extends ArgumentBase {
	public script: ArgumentValue<string> = new ArgumentValue({
		value: '',
		description: 'The script file path that you want to be baked',
		required: true
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

const bakedDir = '/baked'; //? the directory the baked scripts should end up in (no trailing '/', it will be added on creation)
const bakedTag = 'BAKED'; //? the suffix that will be put behind a script
//= test/bakeTest.js => /baked/test/bakeTest_BAKED.js

//TODO think about a different approach: 
//_ make this into the transfer script
//> for each import in the file, get the path and make that file go with it
export async function main(ns: NS) {
	ns.disableLog('ALL');
	const args = new Arguments(ns);
	const filePath = args.script.value;

	if (!ns.fileExists(filePath)) {
		throw new Error(`Script does not exist: ${filePath}`);
	}

	//> get an array of import lines
	//| parse the imports and store the import_targets and path
		//> read the script for each import
		//+ get all other local scoped methods, variables and classes
			//?? should i really commit to this? this might get really complex, if its too big i should drop it and just include the entire script.
			//* i didnt do this on the first interation and it now works fully
			//TODO maybe try to do this later anyway?
		//| for each target import (eg: a method or class)
			//- if this import references any of the (local scope?) methods/variables/classes
				//- if this reference is exported and one of the other target imports
					//< continue
				//> include this reference into the fina bake script

	const bakedScript = getBakedScript(ns, filePath);
	const destPath = createBakedScript(ns, filePath, bakedScript);
	
	bprint(ns, '\n---- BAKE ----\n', bakedScript);
	bprint(DNS, `"${filePath}" was baked succesfully into "${destPath.path}"`)
}

function getBakedScript(ns: NS, path: string): string {
	//TODO fix stuff not being baked cuz of it being in history without being baked i think....
	const bakedPathHistory: string[] = [];
	const scriptContent = ns.read(path);
	const scriptImportLines = scriptContent.match(new RegExp(ScriptImportLine, 'gm')) as RegExpMatchArray ?? [];
	
	let bakeContent = scriptContent;
	for (const line of scriptImportLines) {
		const match = new RegExp(ScriptImportLine).exec(line) as RegExpExecArray;
		const importPath = match?.groups?.path ?? null;
		
		if (match == null || importPath == null) continue;
		bprint(ns, bakedPathHistory, path)
		if (bakedPathHistory.includes(path)) {
			bakeContent = bakeContent.replace(line, `// ${line}`);
			continue;
		};

		bprint(ns, path, `\n${line}\n`, match);
		bakeContent = bakeContent.replace(line, `// ${line}\n${getBakedScript(ns, importPath)}`);
		bakedPathHistory.push(path)
	}

	return bakeContent;
}

function createBakedScript(ns: NS, origPath: string, content: string): FilePath {
	if (origPath.startsWith('/')) {
		origPath = origPath.split('').toSpliced(0, 1).join('');
	}
	const filePath: FilePath = new FilePath(origPath);
	

	const dest = new FilePath(`${bakedDir}/${filePath.dir}/${bakedTag}_${filePath.fileName}.${filePath.fileExt}`)
	bprint(ns, 'path:', filePath)
	bprint(ns, 'baked:', dest);

	ns.write(dest.path, content, 'w');

	return dest;
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