import { NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint, colorize } from "@/handlers/printHandler";

class Arguments extends ArgumentBase {
	public host: ArgumentValue<string> = new ArgumentValue('');
	public substring: ArgumentValue<string> = new ArgumentValue('');
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

const ext: string[] = ['js', 'ts', 'txt', 'script', 'msg', 'lit']
let treeCach: string[] = [];
class DirectoryContent {
	public name: string;
	public files: string[];
	public dirs: DirectoryContent[];

	private indentChar: string;
	private spaceIndentChar: string;
	private fileIndentChar: string;
	private dirIndentChar: string;
	private lastDirIndentChar: string;

	//?? consept - the first number rpresents the 
	private indentMap: [number, number][];

	constructor(name: string, files: string[] = [], dirs: DirectoryContent[] = []) {
		this.name = name;
		this.files = files
		this.dirs = dirs

		// this.indentChar = '   '
		this.indentChar = '│  '
		this.spaceIndentChar = ' '.repeat(this.indentChar.length)
		this.dirIndentChar = '├' + '─'.repeat(this.indentChar.length - 1)
		this.lastDirIndentChar = '└' + '─'.repeat(this.indentChar.length - 1)
		// this.fileIndentChar = '│' + ' '.repeat((this.dirIndentChar.length -1) * 2)
		this.fileIndentChar = ' '.repeat(this.dirIndentChar.length -1)

		this.indentMap = [];
	}

	public toTree(depth: number = 0, hideFiles: boolean = false, lastDir: boolean = true): string {
		// if (treeCach.includes(this.name)) return '';
		// else treeCach.push(this.name);
		let out = [((depth > 0) ? this.getIndent(depth - 1, true, false, lastDir) : '') + colorize(`[fg=#00ff00]${this.name}[/>]`)];
		
		if (!hideFiles) {
			for (const file of this.files) {
				const fileSplit = file.split('.')
				const fileName = fileSplit.slice(0, -1).join('.')
				const fileExtension = fileSplit[fileSplit.length - 1]
				let fileExtColor = 'grey';
				switch(fileExtension) {
					case 'js': fileExtColor = '#c5b973'; break;
					case 'msg': fileExtColor = '#649ab8'; break;
					case 'exe': fileExtColor = '#bb6a45'; break;
				}

				const line = `${this.getIndent(depth, false, (this.dirs.length > 0 ? false : true), lastDir)}[fg=#a1d4d4]${fileName}[/>].[fg=${fileExtColor}]${fileExtension}[/>]`;
				out.push(colorize(line))
			}
			// out.push(this.getIndent(depth - 1, false, false, true))
		}
		for (const dir of this.dirs) {
			out.push(`${dir.toTree(depth + 1, hideFiles, (this.dirs.indexOf(dir) === this.dirs.length - 1))}`)
		}
		// out.push(this.getIndent(depth - 1, false, false))
		

		return out.join(`\n`);
	}

	private getIndent(depth: number, dir: boolean = false, file: boolean = false, lastDir: boolean = false): string {
		let negativeValue = false
		if (depth < 0) {
			depth = 0;
			negativeValue = true;
		}
		let out = '';
		out = this.indentChar.repeat(depth + ((file && depth === 0 && !negativeValue) ? 1 : 0))
		// if (!lastDir) out = this.indentChar.repeat(depth + ((file && depth === 0 && !negativeValue) ? 1 : 0))
		// else if (file) {
		// 	// depth = depth - 1
		// 	out = this.indentChar.repeat(depth + ((file && depth === 0 && !negativeValue) ? 1 : 0))
		// }

		if (dir) {
			if (lastDir) out += this.lastDirIndentChar;
			else out += this.dirIndentChar;
		}
		else if (file) {
			if (lastDir) out += this.spaceIndentChar;
			else out += this.fileIndentChar;
		}
		else out += this.indentChar;

		return out;
	}
}

let netScript: NS;
export async function main(ns: NS) {
	netScript = ns;
	ns.disableLog('ALL')
	const args: Arguments = new Arguments(ns);

	const pathList = ns.ls(ns.getHostname(), args.substring.value ?? '')
	
	treeCach = [];
	const tree = formatPaths(pathList).toTree(0, false);
	console.log(tree);
	//TODO make compatebility with print raw and make the files clickable to go to the nano editor of that file
	// if (args.debug.value && args.debug.value === true) bprint(ns, tree)
	if (args.debug.value && args.debug.value === true) ns.printRaw(tree)
	else bprint(ns, '--terminal', '\n' + tree)
}

function formatPaths(list: string[]): DirectoryContent {
	let out: DirectoryContent = new DirectoryContent(netScript.getHostname());

	for (const path of list) {
		if (path.includes('/')) {
			const split = path.split('/');
			let currentDir = out;
			for (let i = 0; i < split.length - 1; i++) {
				const subDir = currentDir.dirs.find(x => x.name === split[i])
				if (subDir) currentDir = subDir;
				else {
					const newDir = new DirectoryContent(split[i])
					currentDir.dirs.push(newDir)
					currentDir = newDir;
				}
			}
			currentDir.files.push(split[split.length - 1])
		}
		else {
			out.files.push(path)
		}
	}

	return out;
}