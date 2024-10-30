import { NS } from "@ns";
import { bprint, colorize } from "@/handlers/printHandler";
import { getBacketPair } from "../utils/objectParser";
import { collection } from "@/@types";
import { DNS } from "@/director";
import { fakeNS } from "@/lib/generalData";

export const testArgs = [
	'--file=someFile.txt',
	'--text="Hello World!"',
	'--id=1234',
	'--debug',
	'--script="hacks/rootReach.js[--print,--depth=2,--debug],test/proto.js[--verbose]"',
	'--arr=[banana,apple,grape,pear]',
	'--obj="{key:value,num:2,subObj:{subKey: subVal},subArr:[red,green,blue]}"',
	'--wrong=idontfeelsogood',
]
// --file=someFile.txt --text="Hello World!" --id=1234 --debug --script="hacks/rootReach.js[--print,--depth=2,--debug],test/proto.js[--verbose]" --arr=[banana,apple,grape,pear] --obj="{key:value,num:2,subObj:{subKey: subVal},subArr:[red,green,blue]}"


type ArgumentValueType<T> = {
	value: T;
	description?: string;
	default?: T|undefined;
	required?: boolean;
	examples?: string[];
	aliases?: string[];
};
export class ArgumentValue<T> {
    private _value: T;
    public description?: string;
    public default?: ArgumentValueType<T>['default'];
    public required?: boolean;
    public examples?: string[];
	public aliases?: string[];

	constructor(input: T | ArgumentValueType<T>) {
		if (input && typeof input === 'object' && 'value' in input) {
			// Input is of type IArgumentValue<T>
			this._value = input.value;
			this.description = input.description ?? '';
			this.default = (input.default === undefined) ? this._value : input.default;
			this.required = input.required ?? false;
			this.examples = input.examples ?? [];
			this.aliases = input.aliases ?? [];
		} else {
			// Input is of type T
			this._value = input;
			this.description = '';
			this.default = input;
			this.required = false;
			this.examples = [];
			this.aliases = [];
		}
	}

	public get value(): T { return this._value as T }
	public set value(val: string|T) {
		let inputValue: any = val;
		if (typeof this._value === 'object' || (typeof inputValue === 'string' && inputValue.match(/[\[\]{}]/) != null)) {
			inputValue = this.parseCollectionValue(val as string)
		}
		else if (typeof this._value === "number") {
			inputValue = Number.parseFloat(val as string)
		}

		this._value = inputValue as T;
	}

	private parseCollectionValue(col: string): collection {
		const isArray = Array.isArray(this._value) || (col.includes('[') && !col.startsWith('{'));
		const brackets = getBacketPair(this._value as collection);
		if (!col.includes('[') && !col.includes('{')) {
			bprint(DNS, `[fg=red][ERROR]: Argument did not contain (${brackets[0]})[/>]\nInput: (${col})`)
		}
		
		if (isArray) {
			let content: any[] = []
			if (!col.startsWith('[')) {
				const split = col.split(/(.*?(?<=\[|\])),+/g);
				for (let i = 0; i < split.length; i++) {
					if (split[i] === '') { continue; }
					if (split[i].includes('[')) {
						//! this fails if the array contains another array, it will instead make a new array of it
						content.push(
							split[i].split('[')[0],
							this.parseCollectionValue('[' + split[i].split('[').slice(1).join('['))
						);
					}
					else { content.push(split[i]) }
				}
			}
			else {
				let inputSplit = col.split(brackets[0]) as string[]
				for (let i = 0; i < inputSplit.length; i++) {
					if (inputSplit[i] === '') { continue; }
					
					if (!inputSplit[i].includes(',') && !inputSplit[i].includes(brackets[1])) {
						content.push(inputSplit[i])
					}
					else { content.push(inputSplit[i].split(brackets[1])[0].split(',')) }
				}
			}

			
			if (Array.isArray(content[0]) && content.length === 1) {
				content = content[0]
			}
			else { content = content }
			
			//? remove any left over "[" "]" brackets
			// if (typeof content)
			for (let i = 0; i < content.length; i++) {
				if (Array.isArray(content[i])) continue;
				content.splice(i, 1, content[i].replaceAll(/(?:\[|\])/g, ''));
			}
			
			return content;
		}
		else { //? is object
			//? fix the string to be parsable to a json by adding quotes around every word-based value in the string
			var fixedJSON = col.replace(/(['"`])?(\w+)\1?:/g, '"$2":').replace(/\s?(['"`])?((?!\d)\w+)\1?/g, '"$2"');
			const subObj: Record<string, any> = JSON.parse(fixedJSON)
			return subObj
		}

		// return col.split(',')
	}
}

type ArgumentInputType = string | number | boolean;
type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

type ArgumentBaseExcludeKeys = 'parseArgs'|'asObject'|'sendHelp'|'asValueObject'|'asObjectNoDefault'|'asValueObjectNoDefault';
type ArgumentBaseDefaultKeys = 'debug'|'help'|'devMode'|'restart'|'watch'|'looseArgs';

const argBaseRegex: RegExp = new RegExp(/-{2}(?<key>.+?)($|=("?)(?<val>.+)\3)/m);
export abstract class ArgumentBase {
	//#region Default args
	public debug: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Turns on debug mode.'
	});
	public help: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Displays all possible argument flags and their description',
		aliases: ['h', 'H', '?']
	});
	// public devMode: ArgumentValue<boolean> = new ArgumentValue({
	// 	value: false,
	// 	description: 'Restarts the script on change.',
	// 	aliases: ['dev', 'devmode', 'development', 'developmentMode', 'developmentmode']
	// });
	// public restart: ArgumentValue<number> = new ArgumentValue({
	// 	value: -1,
	// 	description: 'Restart the script every (n)ms (-1 to disable)',
	// 	aliases: ['restartTimer', 'restarttimer', 'restartTime', 'restarttime', 'restartInterval', 'restartinterval']
	// });
	public watch: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Watch this script for changes and restart it once a chance is detected',
	});
	//#endregion
	
	public looseArgs: (string|number)[] = []; //? The args that didnt come with a flag like "--script="arg"" will be put in here

	private ns: NS;
	private args: ArgumentInputType[];
	private defaultKeys = this.keys;
	constructor(ns: NS, private continueOnError: boolean = false, private silent: boolean = false) {
		this.ns = ns;
		this.args = ns.args as ArgumentInputType[];
	}
	
	// protected get keys(): (KeysMatching<this, typeof ArgumentValue<unknown>>)[] {
	protected get keys(): Exclude<keyof this, ArgumentBaseExcludeKeys>[] {
		let out: typeof this.keys = [];

		for (const field in this) {
			if (!(this[field] instanceof ArgumentValue)) { continue; }
			out.push(field as unknown as (typeof this.keys)[number]);
		}

		return out;
	}

	/** Instead of just getting the class keys, also get all key aliases */
	protected get argKeys(): string[] {
		let out: string[] = []
		const keys: (keyof typeof this)[] = this.keys;

		for (const key of keys) {
			out.push(key as string);
			const field: ArgumentValue<any> = this[key] as ArgumentValue<any>;
			if (field.aliases && field.aliases?.length > 0) {
				out.push(...field.aliases)
			}
		}

		return out;
	}

	protected get requiredKeys(): string[] {
		let out: string[] = [];
		for (const key of this.keys) {
			const arg: ArgumentValue<ArgumentInputType>|null = this.getFieldOfArg(key as string);
			if (!arg) { continue };
			if (arg.required === true) {
				out.push(key as string);
			}
		}
		return out;
	}
	
	public get asObject(): Record<Exclude<keyof this, ArgumentBaseExcludeKeys>, ArgumentValue<any>> {
		let out: typeof this.asObject = { [this.keys[0]]: this[this.keys[0]] } as unknown as typeof this.asObject;
		for (const key of this.keys) {
			const value = this[key as keyof typeof this]
			// if (value === undefined) continue;
			out[key as string] = value as ArgumentValue<any>;
		}

		return out;
	}
	public get asValueObject(): Record<Exclude<keyof this, ArgumentBaseExcludeKeys>, any> {
		return this.getValueObject(this.asObject);
	}

	public get asObjectNoDefault(): Record<Exclude<keyof this, (ArgumentBaseDefaultKeys|ArgumentBaseExcludeKeys)>, ArgumentValue<any>> {
		let out = {};
		const obj = this.asObject;

		for (const key in obj) {
			if (this.defaultKeys.includes(key as any)) continue;
			out[key as keyof typeof ArgumentBase] = obj[key];
		}

		return (out as typeof this.asObjectNoDefault);
	}
	public get asValueObjectNoDefault(): Record<Exclude<keyof this, (ArgumentBaseDefaultKeys|ArgumentBaseExcludeKeys)>, any> {
		return this.getValueObject(this.asObjectNoDefault);
	}

	private getValueObject(obj: {[key: string]: ArgumentValue<any>}): Record<keyof this, any> {
		let out = obj;

		for (const key in obj) {
			out[key] = obj[key].value;
		}

		return out as Record<keyof this, any>;
	}
	
	protected getFieldOfArg(arg: string): ArgumentValue<any>|null {
		const keys = this.keys;
		if ((keys as string[]).includes(arg)) {
			return this[keys[(keys as string[]).indexOf(arg)] as keyof typeof this] as ArgumentValue<any>;
		}

		for (const key of keys) {
			const field: ArgumentValue<any> = this[key as keyof typeof this] as ArgumentValue<any>;
			if (field.aliases && field.aliases.includes(arg)) {
				return field;
			}
		}

		return null;
	}
	
	/** Parses all args and puts any present args in the right keys of the class (only call this in a child class) */
	public parseArgs(): void {
		if (this.ns === fakeNS) return;
		const errorHelpString = `\n[fg=grey]Run this script with the[/>] (--help) [fg=grey]arg to display a list of valid argument[/>]`;
		
		const inputKeys: string[] = [] //? A list of arg keys that have been parsed, used to check if a required arg was not present
		for (let i = 0; i < this.args.length; i++) {
			const arg = this.args[i].toString();

			//* regex: /-{1,2}(?<key>.+?)($|=("?)(?<val>.+)\3)/m
			const match = arg.match(argBaseRegex) as RegExpMatchArray;
			if (!match || !match.groups) { //! ERROR
				const value = arg.trim();
				const num: number = Number.parseFloat(value);
				this.looseArgs.push(num||value);
				// if (!this.silent) { bprint(DNS, `[fg=yellow][WARNING]: Argument could not be parsed[/>] (${arg})${errorHelpString}`); }
				// if (this.continueOnError) { continue; }
				continue
			}
			
			const key: string = match.groups['key'];
			const value: string|boolean = match.groups['val'] ?? true;
			inputKeys.push(key);

			if (this.argKeys.includes(key)) {
				const field = this.getFieldOfArg(key);
				if (!field) {
					//? ignores continueOnError and silent because it should never come here and if it does, i need to know why
					return bprint(this.ns, `[fg=red][ERROR]: Argument field of (${key}) could not be found... this was not supposed to happen.[/>] (--${key})${errorHelpString}`)
				}
				field.value = value;
			}
			else {
				if (!this.silent) { bprint(this.ns, `[fg=red][ERROR]: Unknow argument key[/>] (${key})${errorHelpString}`); }
			}
			
			// //* debug per key
			// if (this[key as keyof typeof this] instanceof ArgumentValue) {
			// 	bprint(netScript, key + ':', (this[key as keyof typeof this] as ArgumentValue<unknown>).value)
			// }
		}

		

		this.handleBuildIn();
		if (this.help.value === true) {
			this.ns.kill(this.ns.pid);
			return;
		}

		if (this.looseArgs.length > 0) {
			for (const key in this.asObjectNoDefault) {
				const argValue = this[key] as ArgumentValue<any>;
				if (argValue.value === argValue.default || argValue.value === undefined) {
					if (
						typeof this.looseArgs[0] == typeof argValue.default ||
						(Array.isArray(argValue.default) && (this.looseArgs[0] as string).startsWith('[')) ||
						(typeof argValue.default == 'object' && (this.looseArgs[0] as string).startsWith('{'))
					) {
						argValue.value = this.looseArgs[0];
						this.looseArgs.splice(0, 1);
					}
				}
				// bprint(this.ns, argValue);
			}
		}

		const postValidation = (this.ns == fakeNS) ? true : this.validateRequiredArgs(inputKeys);
		if (Array.isArray(postValidation)) {
			let tips: string = '[fg=red]The following arguments are required to run the script[/>]:';
			for (const missingKey of postValidation) {
				const helpMsg = this.getHelp(missingKey as keyof typeof this);
				if (helpMsg === null) continue;
				tips += `\n${helpMsg}`;
			}

			bprint(DNS, tips);

			const err = new Error();
			const stack = err.stack; //? this is to prevent the stack from being overwritten and the message to be added into it for some reason
			err.message = `Missing required argument(s): [${postValidation.join(', ')}]\nCheck the terminal for the description of each missing argument.`;
			err.stack = stack;
			
			throw err;
		}
	}

	private async handleBuildIn() {
		if (this.help.value === true) {
			this.sendHelp();
		}
		
		if (this.watch.value === true) {
			this.ns.exec('tools/scriptWatcher.js' , this.ns.getHostname(), 1, ...[
				`--script="${this.ns.getScriptName()}"`,
				`--pid=${this.ns.pid}`,
				`--host="${this.ns.getHostname()}"`,
				`--args=[${this.ns.args.join(', ')}]`,
			])
		}
	}

	private validateRequiredArgs(usedKeys: string[]): string[]|boolean {
		let validated: boolean = true;
		let missingKeys: string[] = []
		
		for (const reqKey of this.requiredKeys) {
			if (!usedKeys.includes(reqKey)) {
				const aliasses = (this[reqKey] as ArgumentValue<any>).aliases;
				if (aliasses && aliasses.length > 0) {
					let usedAlias = false;

					for (const alias of aliasses) {
						if (usedKeys.includes(alias)) {
							usedAlias = true;
							break;
						}
					}

					if (usedAlias) { continue; }
				}

				validated = false;
				missingKeys.push(reqKey);
			}
		}

		return (validated) ? true : missingKeys;
	}

	//? Send all the possible arguments along with their description and examples
	public sendHelp() { // // i beg u, i have been trapped for days in his basement
		let out = '[fg=9CDCFE][ ] = optional[/>] | [fg=ff5500]< > = required[/>] | [fg=aaaaaa]( ) = default[/>]'
		for (const key in this) {
			const helpMsg = this.getHelp(key);
			if (helpMsg === null) continue;
			out += `\n${this.getHelp(key)}`;
		}

		out = colorize(out);
		bprint(this.ns, '--terminal', out)
	}
	private getHelp(key: keyof typeof this): string|null { // // hes bleeding out, please someone get help!!!!
		if (!(this[key as keyof typeof this] instanceof ArgumentValue)) return null;
		let out = '';
		const arg: ArgumentValue<any> = this[key as keyof typeof this] as ArgumentValue<any>;
		const brackets = (arg.required) ? ['<[fg=ff5500]','[/>]>'] : ['[[fg=9CDCFE]', '[/>]]'];
		const surround = (str: string): string => { return `${brackets[0]}${str}${brackets[1]}` }
		
		out += `--${key as string} ${surround((Array.isArray(arg.value)) ? 'array' : typeof arg.value)}`
		if (arg.default !== undefined) {
			out += ` (${
				(arg.default === null) ? 'null' :
				(arg.default === '') ? '""' :
				(Array.isArray(arg.default) && arg.default.length == 0) ? '[]' :
				(typeof arg.default == 'object' && Object.keys(arg.default).length == 0) ? '{}' :
				arg.default
			})`
		}
		if (arg.description) { out += `: ${arg.description}`; }
		if (arg.examples && arg.examples.length > 0) { out += `\n  ${arg.examples.join('\n  ')}`; }

		return out;
	}
}

// //? this is how the end result should look in other scripts
// class this_Arguments extends ArgumentBase {
// 	// public file: ArgumentValue<string> = new ArgumentValue('');
// 	// public text: ArgumentValue<string> = new ArgumentValue('placeholder');
// 	// public id: ArgumentValue<number> = new ArgumentValue(0);
// 	public file: ArgumentValue<string> = new ArgumentValue({
// 		value: 'some/file.txt',
// 		description: 'any file'
// 	});
// 	public id: ArgumentValue<number> = new ArgumentValue({
// 		value: -1,
// 		description: 'some id'
// 	});
// 	public list: ArgumentValue<string[]> = new ArgumentValue({
// 		value: [],
// 		description: 'any sor of list'
// 	});
// 	// public age: ArgumentValue<number> = new ArgumentValue(42.69);
// 	// public script: ArgumentValue<string|string[]> = new ArgumentValue({
// 	// 	value: [],
// 	// 	required: false,
// 	// 	description: 'The script(s) to run',
// 	// 	examples: ['hacks/rootReach.js[--print,--depth=2,--debug]', 'test/proto.js - will run test/proto.js without args"']
// 	// })
// 	// public arr: ArgumentValue<any[]> = new ArgumentValue([]);
// 	// public obj: ArgumentValue<{[key: string]: any}> = new ArgumentValue({});

// 	constructor(ns: NS) { super(ns); this.parseArgs(); }
// }

// let LNS: NS;
// export async function main(ns: NS) {
// 	LNS = ns;

// 	const args = new this_Arguments(ns);
// 	bprint(ns, args.asValueObjectNoDefault)
// 	bprint(ns, args.looseArgs)
// 	if (args.debug.value) {
// 		bprint(ns, args.asValueObject);
// 		bprint(ns, args.asObjectNoDefault);
// 		bprint(ns, args.asValueObjectNoDefault);
// 	}

// 	// while(true) {
// 	// 	await ns.asleep(1000);
// 	// }
// } 