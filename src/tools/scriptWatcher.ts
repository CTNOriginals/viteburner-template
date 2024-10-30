import { AutocompleteData, NS, RecentScript, RunningScript, TailProperties } from "@ns";
import { bprint } from "@/handlers/printHandler";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { DNS } from "@/director";
import { StyleTranslateXY } from "@/lib/regExpPresets";
import { fakeNS } from "@/lib/generalData";
import { getAllImportPaths, getStringDiff } from "@/utils";

const doc = eval('document') as Document;
class Arguments extends ArgumentBase {
	public script: ArgumentValue<string> = new ArgumentValue({
		value: '',
		description: 'The file path of the script to watch',
		required: true
	});
	public pid: ArgumentValue<number> = new ArgumentValue({
		value: -1,
		description: 'The PID of the script to better locate the running script',
	});
	public scriptArgs: ArgumentValue<string[]> = new ArgumentValue({
		value: [],
		description: 'The arguments the script has been started with',
		aliases: ['args']
	});
	public hostName: ArgumentValue<string> = new ArgumentValue({
		value: '',
		description: 'The name of the host that the script is running on (defaults to current server)', 
		default: null!,
		aliases: ['host']
	});
	public interval: ArgumentValue<number> = new ArgumentValue({
		value: 1000,
		description: 'The amout of ms to wait between updates'
	});
	// public keepLogs: ArgumentValue<boolean> = new ArgumentValue({
	// 	value: true,
	// 	description: 'Keep the logs after restarting a script',
	// 	aliases: ['keep-logs', 'keep-log']
	// });

	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}


class ScriptFileContent {
	public content: string = '';
	private exists: boolean = false;
	
	constructor(private ns: NS, public path: string) {
		if (ns.fileExists(path)) {
			this.exists = true;
			this.content = this.ns.read(path);
		}
	}

	public hasChanged(): boolean {
		if (!this.exists) return false;

		const newContent = this.ns.read(this.path);
		if (newContent !== this.content) {
			this.content = newContent;
			return true;
		}
		
		return false;
	}
}
class ScriptWatchInfo {
	/** This is always a script (after init), if the script is restarted and fails, this will not be overwritten */
	public script: RunningScript = null!; 
	public pid: number;
	public scriptHost: string;
	public scriptArgs: string[] = [];
	public scriptFilePath: string;

	private currentScript: RunningScript|RecentScript|null = null;
	private scriptContent: string;
	private pathList: string[] = [];
	private watchList: {[path: string]: string} = {};
	private logLines: string[] = [];
	private interval: number;

	private reloadCount: number = 0;

	private ns: NS;
	private args: Arguments['asValueObject'];
	private tailProperties: TailProperties = this.getDefaultTailProperties();
	private tailActive: boolean = false;


	constructor(ns: NS, args: Arguments['asValueObject']) {
		this.ns = ns;
		this.args = args;

		this.pid = args.pid;
		this.scriptFilePath = args.script;

		this.scriptArgs = args.scriptArgs;
		this.scriptHost = (args.hostName != null && args.hostName != '') ? args.hostName : ns.getHostname();
		
		this.interval = args.interval;
		this.scriptContent = ns.read(this.scriptFilePath);

		this.Init();
	}

	private get argsExcludeWatch() {
		// console.log(this.scriptArgs)
		if (this.scriptArgs.includes('--watch')) {
			const newArgs = this.scriptArgs.toSpliced(this.scriptArgs.indexOf('--watch'), 1);
			return newArgs;
		}
		return this.scriptArgs;
	}

	private async Init() {
		bprint(this.ns, '\n[fg=aaaaaa]-------- INITIALIZING --------[/>]')
		this.currentScript = this.getTargetScript((this.pid !== -1) ? this.pid : undefined); //? loosely search for the script

		if (this.currentScript === null) {
			bprint(this.ns, `[fg=aaaaaa]Target script does not exist[/>].\n[fg=aaaaaa]Executing[/>]: [fg=C4785B]${this.scriptFilePath}[/>]`);
			
			this.pid = this.ns.exec(this.scriptFilePath, this.scriptHost, 1, ...this.argsExcludeWatch);
			
			this.currentScript = await this.getTargetScriptAsync(this.pid); //? get the newly started script
			this.updateTitle();
			this.updateTailProperties();
		}
		
		if (this.currentScript == null) {
			throw new Error(`Script could not be started.\n${this.args.script}: ${this.scriptArgs}`);
		}

		this.UpdateImports();
		
		//? make sure everything loads by reloading it once first
		this.ns.tail(this.currentScript.pid);
		this.updateTitle();
		this.ns.closeTail(this.pid);
		// await this.ns.asleep(1000);
		this.ns.kill(this.currentScript.pid);
		this.Reload();
		
		bprint(this.ns, '\n[fg=aaaaaa]----------- START ------------[/>] ')
		
		// this.updateTailProperties();
		this.Update();
	}

	private get hasImportsChanged(): boolean {
		const currentImports = getAllImportPaths(this.ns, this.scriptFilePath, 100);
		if (this.pathList.join('') !== currentImports.join('')) {
			console.log(`${this.scriptFilePath} - Imports changed:`, getStringDiff(this.pathList.join('\n'), currentImports.join('\n')));
			this.pathList = currentImports;
			return true;
		}
		return false;
	}
	private get hasContentChanged(): boolean {
		for (const path in this.watchList) {
			if (!this.ns.fileExists(path)) return false;
			
			const newContent = this.ns.read(path);
			if (this.watchList[path] != newContent) {
				// console.log('Content changed:', path, `\n${getStringDiff(this.watchList[path], newContent)}`);
				this.watchList[path] = newContent;
				return true;
			}
		}
		return false;
	}

	private async Update() {
		if (this.hasImportsChanged) {
			this.UpdateImports();
		}
		if (this.hasContentChanged) {
			this.Reload();
		}

		//? check if the script is still running, and if not, get the recent script object instead.
		if (!this.ns.isRunning(this.script.pid) && !Object.keys(this.script).includes('timeOfDeath')) {
			const recent = await this.findViableRecentScript(this.script.pid);
			if (recent != null) {
				this.currentScript = recent;
			}
		}
		
		// const logInterval = setInterval(() => {
		// 	if (this.ns == undefined || this.ns == null || !DNS.isRunning(this.ns.pid)) {
		// 		clearInterval(logInterval);
		// 		return;
		// 	}
		// 	let logContent = this.ns.getScriptLogs((this.currentScript ?? this.script).pid);
		// 	logContent = ((this.currentScript ?? this.script).logs.length > logContent.length) ? (this.currentScript ?? this.script).logs : logContent;
			
		// 	//TODO improve this to account for the max log lines
		// 	if (logContent.length > this.logLines.length) {
		// 		let logContentCopy = [...logContent];
		// 		const newLogs = logContent.splice(this.logLines.length, logContent.length - this.logLines.length);
				
		// 		for (const line of newLogs) {
		// 			this.ns.print(line);
		// 		}
	
		// 		this.logLines = logContentCopy;
		// 	}
		// }, this.interval / 10)
		
		this.updateTitle();

		await this.ns.asleep(this.interval);
		this.Update();
	}

	private UpdateImports() {
		this.pathList = getAllImportPaths(this.ns, this.scriptFilePath);
		for (const path of this.pathList) {
			this.watchList[path] = this.ns.read(path);
		}
	}

	private async Reload() {
		if (this.currentScript == null) {
			this.currentScript = this.script;
			bprint(this.ns, `Target script does not exist anymore, awaiting next content change to restart.`);
			return;
		}
		
		this.updateTailProperties();
		this.ns.closeTail(this.currentScript.pid);
		
		if (this.ns.isRunning(this.currentScript.pid)) {
			this.ns.kill(this.currentScript.pid);
		}
		
		this.pid = this.ns.exec(this.scriptFilePath, this.scriptHost, this.currentScript.threads, ...this.argsExcludeWatch);
		this.currentScript = await this.getTargetScriptAsync(this.pid);

		if (this.currentScript == null) {
			bprint(this.ns, 'Target script could not be restarted...');
			return;
		}

		if (this.tailActive) {
			this.ns.tail(this.currentScript.pid);
			this.ns.moveTail(this.tailProperties.x, this.tailProperties.y, this.currentScript.pid);
			this.ns.resizeTail(this.tailProperties.width, this.tailProperties.height, this.currentScript.pid)
		}
		// if (this.tailActive) {
		// }
		
		this.reloadCount++;
		this.logLines = [];
		bprint(this.ns, '\n[fg=aaaaaa]----------- RELOAD -----------[/>]')
	}

	private getTargetScript(pid?: number): RunningScript|null {
		let out: RunningScript|null = null;

		if (pid != undefined) {
			out = this.ns.getRunningScript(pid);
		} 
		else {
			out = 
				this.ns.getRunningScript(this.scriptFilePath, this.scriptHost, ...this.scriptArgs) ||
				this.ns.getRunningScript(this.scriptFilePath, this.scriptHost, ...this.argsExcludeWatch);
		}

		if (out != null) this.script = out;

		return out;
	}
	private async getTargetScriptAsync(pid?: number): Promise<RunningScript|RecentScript|null> {
		let out = this.getTargetScript(pid);

		if (out == null || !this.ns.isRunning(out.pid)) {
			out = await this.findViableRecentScript(pid);
		}

		if (out != null) this.script = out;
		
		return out;
	}

	private async findViableRecentScript(pid?: number): Promise<RecentScript|null> {
		const recentScripts = this.ns.getRecentScripts();
		if (pid != undefined) {
			return recentScripts.find(r => r.pid == pid) ?? null;
		}

		for (let i = 0; i < recentScripts.length; i++) {
			//- if the script died at or over 10 sec ago
			//? search scripts of the last 10 seconds to account for any lag that might be present when starting up scripts
			if (new Date().getTime() - recentScripts[i].timeOfDeath.getTime() >= 1000 * 10) { break; }

			//- compare script, server and args with the recent script to check if its a viable replacer
			if (
				recentScripts[i].filename == this.scriptFilePath &&
				recentScripts[i].server == this.scriptHost &&
				(recentScripts[i].args == this.scriptArgs || recentScripts[i].args == this.argsExcludeWatch)
			) {
				return recentScripts[i];
			}
		}

		return null;
	}

	private updateTailProperties() {
		// const origTitle = this.script.title;
		// const tmpTitle = origTitle + ' | ' + Date.now();
		const h6Elements = doc.getElementsByTagName('h6');
		
		let targetElement: HTMLElement|null = null;
		
		for (let i = h6Elements.length - 1; i > -1; i--) {
			const element = h6Elements[i];
			if (element.innerHTML.includes(`PID:${this.script.pid}`) || element.innerHTML.includes(`PID:${this.script.pid - 1}`)) {
				targetElement = element; //? Assign the target element to the latest found tail
				break;
			}
		}
		
		this.tailActive = (targetElement !== null)
		this.tailProperties = this.getDefaultTailProperties();

		if (this.tailActive) {
			const transform = targetElement?.parentElement?.parentElement?.parentElement?.style.transform;
			const exec = (transform != undefined) ? new RegExp(StyleTranslateXY).exec(transform) : undefined;
			const translateX = (exec?.groups && exec.groups['x'] != undefined) ? exec.groups['x'] : undefined;
			const translateY = (exec?.groups && exec.groups['y'] != undefined) ? exec.groups['y'] : undefined;

			const width = targetElement?.parentElement?.parentElement?.style.width.replace('px', '');
			const height = targetElement?.parentElement?.parentElement?.style.height.replace('px', '');

			if (translateX != undefined) this.tailProperties.x = Number.parseFloat(translateX);
			if (translateY != undefined) this.tailProperties.y = Number.parseFloat(translateY);
			if (width != null) this.tailProperties.width = Number.parseFloat(width);
			if (height != null) this.tailProperties.height = Number.parseFloat(height);
		}
	}
	private getDefaultTailProperties(): TailProperties {
		let props: TailProperties = {
			x: NaN,
			y: NaN,
			width: 500,
			height: 500,
		}
		props.x = doc.body.clientWidth / 2 - (props.width / 2);
		props.y = doc.body.clientHeight / 2 - (props.height / 2);

		return props;
	}

	private updateTitle() {
		this.ns.setTitle(`Watch: ${this.scriptFilePath} | Reloads: ${this.reloadCount} | PID:${this.script.pid}`, this.script.pid);
	}

	private onButtonClick(e: MouseEvent) {
		console.log('click')
		if (e.shiftKey) {
			console.log('closing and killing ', this.currentScript?.pid)
			this.ns.closeTail(this.currentScript?.pid);
			this.ns.kill(this.ns.pid);
		}
	}
}

const ScriptWatchList: [number, ScriptWatchInfo][] = [];
export async function main(ns: NS) {
	ns.disableLog('ALL')
	const args = new Arguments(ns);
	
	ScriptWatchList.push([ns.pid, new ScriptWatchInfo(ns, args.asValueObject)])
	ns.atExit(() => {
		onExit(ns);
	});

	await ns.asleep(1000 * 60 * 60 * 24 * 7); //? keep alive for at least a week

	bprint(ns, 'End...')
}

export function watchTmpFunc() {return null}

function onExit(ns: NS) {
	for (const watcher of ScriptWatchList) {
		if (watcher[0] == ns.pid) {
			ns.kill(watcher[1].script.pid);
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