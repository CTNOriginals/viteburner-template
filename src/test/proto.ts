import { NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { NodeBias, NodeState } from "@/ipvgo/data";
import { getBaordMatrix, getNeighbors, getNodeState, nodeSymbolToState } from "@/ipvgo/utils";
import { bprint } from "@/handlers/printHandler";

class Arguments extends ArgumentBase {
	public test: ArgumentValue<boolean> = new ArgumentValue({
		value: true,
		description: 'Testing'
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	// ns.tail();
	const args = new Arguments(ns);
	
	type Memory = {[hash: string]: NodeBias}
	// const boardMatrix = getBaordMatrix(ns);
	
	const charSortOrder = [
		'X',
		'O',
		'.',
		'#',
		'-',
	]
	const memory: Memory = {
		'-.XX.XXX': new NodeBias(),
		'#.XX.XXX': new NodeBias(),
		'X.XX.XXX': new NodeBias(),
		'O.XX.XXX': new NodeBias(),
		'..XX.XXX': new NodeBias(),
		'--..--XX': new NodeBias(),
		'OOXX..XX': new NodeBias(),
	}

	bprint(ns, JSON.stringify(memory).replaceAll('},', '},\n'))
}

// function getSymbolInfoDisplay(orig: SymbolInfoCollection): SymbolInfoDisplay {
// 	const info: SymbolInfoDisplay = {...orig} as never; //? prevent altering the original

// 	for (const sym in info) {
// 		for (const key in info[sym]) {
// 			info[sym][key] = formNum(info[sym][key] as number) as string;
// 		}
// 	}

// 	return info;
// }


// export function autocomplete(data: AutocompleteData, args: string[]) {
// 	const argsObj = new Arguments(fakeNS).asValueObject;
// 	const argsSchema: [string, string | number | boolean | string[]][] = []
// 	for (const arg in argsObj) {
// 		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
// 	}
// 	data.flags(argsSchema);
// 	return [];
// }



//#region react node stuff
	// addCSS();
	// ns.resizeTail(400, 100);
	// ns.printRaw([ rText("Click here: ", { color: "#ff0" }), rButton("End script", function () { ns.tprint('hello world!') }) ]);
	// // Wait for it to be clicked.
	// let cont = true;
	// while (cont) {
	// 	await ns.asleep(100);
	// }
	// ns.tprint("Script ended.");
	
	// createSimplebox('Proto', "Hello World!");

	// ns.tprintRaw(Greeting({name: 'jhon'}))

	// props: React.createElement('span', {
	// 	// className: 'ctn',
	// 	// onClick: () => { alert('Hello world!') },
	// },

	// const doc = eval('document') as Document;
	// bprint(ns, doc.body.style)

	// const clickFile = rLinkFunc('some file =', () => {alert('hello world')})
	// ns.printRaw(clickFile)
//#endregion