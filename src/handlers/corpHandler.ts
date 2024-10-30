import { AutocompleteData, CorpMaterialName, CorpStateName, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { fakeNS } from "@/lib/generalData";

class Arguments extends ArgumentBase {
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

export async function main(ns: NS) {
	const AgriMaterials: CorpMaterialName[] = [
		'Water',
		'Food',
		'Plants',
		'Hardware',
		'Chemicals',
		'Robots',
		'AI Cores',
	]
	while (true) {
		const prevState: CorpStateName = await ns.corporation.nextUpdate();
		const nextState: CorpStateName = ns.corporation.getCorporation().nextState;
		bprint(ns, `[fg=aaaaaa]---- ${prevState} ----[/>]`)
		
		const div = ns.corporation.getDivision("Farm")
		const refOffice = ns.corporation.getOffice(div.name, "Sector-12")
		for (const city of div.cities) {
			if (city == "Sector-12") continue;
			const office = ns.corporation.getOffice(div.name, city)
	
			//? Sync all employee jobs
			if (nextState == "START") {
				for (const job in office.employeeJobs) {
					if (refOffice.employeeJobs[job] < office.employeeJobs[job]) {
						bprint(ns, `${city}: Un-Assigning ${office.employeeJobs[job] - refOffice.employeeJobs[job]} employee(s) from ${job}`);
						ns.corporation.setAutoJobAssignment(div.name, city, job, refOffice.employeeJobs[job])
					}
					else if (refOffice.employeeJobs[job] > office.employeeJobs[job] && office.employeeJobs.Unassigned > 0) {
						const count = (refOffice.employeeJobs[job] > office.employeeJobs.Unassigned) ? office.employeeJobs.Unassigned : refOffice.employeeJobs[job];
						bprint(ns, `${city}: Assigning ${count} employee(s) to ${job}`);
						ns.corporation.setAutoJobAssignment(div.name, city, job, count);
					}
				}
			}
		}
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