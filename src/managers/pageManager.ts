import { AutocompleteData, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { fakeNS } from "@/lib/generalData";
import { Pages } from "../inject/";
import { getActivePage } from "@/inject/content";
import * as GangPage from "@/inject/pages/gang"
import * as ipvgo from "@/inject/pages/ipvgo"

class Arguments extends ArgumentBase {
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const _args = new Arguments(ns);
	const args = _args.asValueObject;

	let activePage = Pages.Terminal; //? the last know and initiated page
	while (true) {
		const page = getActivePage(); //? the actual current page

		if (activePage != page) {
			switch (page) {
				case Pages.Gang: {
					GangPage.main(fakeNS);
				} break;
				case Pages.IPvGO_Subnet: {
					ipvgo.init();
				} break;
				default: break;
			}

			activePage = page;
		}

		await ns.asleep(1000);
	}
}

export function autocomplete(data: AutocompleteData, args: string[]) {
	const argsObj = new Arguments(fakeNS).asValueObject;
	const argsSchema: [string, string | number | boolean | string[]][] = [];
	for (const arg in argsObj) {
		argsSchema.push([arg, argsObj[arg as keyof typeof argsObj]]);
	}
	data.flags(argsSchema);
	return [];
}