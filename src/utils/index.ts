import { ScriptImportLine } from "@/lib/regExpPresets";
import { NS } from "@ns";


/** 
 * @param {Partial<T>} options The current options object that might be partial
 * @param {Required<T>} defaults The full object with the default values
*/
export function populateOptionObject<T>(inputOptions: Partial<T>, defaults: Required<T>): Required<T> {
	const options = {...inputOptions};
	
	for (const key in defaults) {
		if (!Object.keys(options).includes(key)) {
			options[key] = defaults[key];
		}
	}

	return options as Required<T>;
}

export function getAllImportPaths(ns: NS, path: string, maxLines = -1, history: string[] = []): string[] {
	const scriptContent = ns.read(path);
	const scriptImportLines = scriptContent.match(new RegExp(ScriptImportLine, 'gm')) as RegExpMatchArray ?? [];
	
	const pathList: string[] = [path];
	for (let i = 0; i < scriptImportLines.length; i ++) {
		if (maxLines > 0 && i >= maxLines) { break; }
		
		const line = scriptImportLines[i];
		const match = new RegExp(ScriptImportLine).exec(line) as RegExpExecArray;
		const importPath = match?.groups?.path ?? null;
		
		if (match == null || importPath == null || pathList.includes(importPath) || history.includes(importPath)) continue;

		pathList.push(importPath);
		history.push(...pathList);
		pathList.push(...getAllImportPaths(ns, importPath, maxLines, history));
	}

	let out: string[] = [];
	pathList.forEach(p => { //? prevent duplicate entries
		if (!out.includes(p)) out.push(p);
	});

	return out;
}


// Find Difference Between Two String
//* source: https://www.grepper.com/answers/250382/find+difference+between+string+js?ucard=1
export function getStringDiff(str1: string, str2: string){ 
	let diff= "";
	str2.split('').forEach(function(val, i){
		if (val != str1.charAt(i))
			diff += val ;
	});
	return diff;
}

export function rng(min: number, max: number): number {
	return Math.round(Math.random() * (max - min) + min);
}

export function clamp(value: number, min: number, max: number) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}