// import { NS } from "@ns";
// import { bprint } from "@/handlers/printHandler";
// import { ArgumentBase } from "@/handlers/argumentHandler";

// //? For debugging
// //!! Comment out once done
// class Arguments extends ArgumentBase {
// 	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
// }
// export async function main(ns: NS) {
// 	ns.disableLog('ALL');
// 	new Arguments(ns);

// 	const paths = [
// 		'managers/scriptManager.js',
// 		'nitesec.test.msg',
// 		'relaySMTP.exe',
// 		'test/bakeImportTest.js',
// 		'some/dir/to//file.js',
// 	]
// 	for (const path of paths) {
// 		const filePath = new FilePath(path);
// 		bprint(ns, path, filePath);
// 	}
// }


export class FilePath {
	public path: string;
	public split: string[];
	
	public file: string;
	public fileName: string;
	public fileExt: string;
	
	/** The path towards the directory */
	public dir: string;
	/** The name of the parent directory */
	public dirName: string;

	constructor(path: string) {
		this.path = path.replaceAll('\\', '/').replace(/\/{2,}/, '/');

		this.split = this.path.split('/');

		let splitCopy = [...this.split];
		this.file = splitCopy.pop()!;
		this.fileExt = this.file.split('.')[this.file.split('.').length - 1];
		this.fileName = this.file.split('.').toSpliced(-1, 1).join('');

		this.dir = splitCopy.join('/');
		this.dirName = this.split[this.split.length - 2];
	}
}