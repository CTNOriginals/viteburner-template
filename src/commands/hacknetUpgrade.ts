import { AutocompleteData, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { DNS } from "@/director";
import { fakeNS } from "@/lib/generalData";
import { formNum } from "@/utils/numberFormat";

class Arguments extends ArgumentBase {
	public level: ArgumentValue<number> = new ArgumentValue({
		value: 0,
		description: 'Upgrade all nodes level (n) times'
	});
	public ram: ArgumentValue<number> = new ArgumentValue({
		value: 0,
		description: 'Upgrade all nodes RAM (n) times'
	});
	public core: ArgumentValue<number> = new ArgumentValue({
		value: 0,
		description: 'Upgrade all nodes RAM (n) times'
	});
	public preview: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Dont follow through with the upgrades and instead just log the costs of the request'
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}


class UpgradeItem {
	public cost: number = 0;
	constructor(
		public getCost: (index: number, n: number) => number, 
		public upgrade: (index: number, n: number) => boolean
	) {}
}

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const ARGUMENTS = new Arguments(ns);
	const args = ARGUMENTS.asValueObjectNoDefault;

	const currentMoney = ns.getServerMoneyAvailable('home');
	const nodeCount = ns.hacknet.numNodes();

	let rejectFunds = false; //? reject the upgrade due to lack of funcs?

	let upgrades = {
		level: new UpgradeItem(ns.hacknet.getLevelUpgradeCost, ns.hacknet.upgradeLevel),
		ram: new UpgradeItem(ns.hacknet.getRamUpgradeCost, ns.hacknet.upgradeRam),
		core: new UpgradeItem(ns.hacknet.getCoreUpgradeCost, ns.hacknet.upgradeCore),
	};

	let totalCost = 0;
	for (const field in upgrades) {
		if (args[field] <= 0) continue; 

		const upgrade = upgrades[field as keyof typeof upgrades];
		for (let i = 0; i < nodeCount; i++) {
			const cost = upgrade.getCost(i, args[field]);
			if (cost == Infinity) continue;
			upgrade.cost += cost
			totalCost += cost;
		}
		if (totalCost > currentMoney && !args.preview) {
			rejectFunds = true;
			bprint(ns, '--terminal', '[fg=red]Insufficient funds[/>]')
			break;
		}
	}

	bprint(ns, '--terminal', [
		`[st=reset] [/>]level: ${formNum(upgrades.level.cost, {numColor: (upgrades.level.cost > currentMoney) ? "#be093f" : "#09be79"})}`,
		` ram: ${formNum(upgrades.ram.cost, {numColor: (upgrades.ram.cost > currentMoney) ? "#be093f" : "#09be79"})}`,
		` core: ${formNum(upgrades.core.cost, {numColor: (upgrades.core.cost > currentMoney) ? "#be093f" : "#09be79"})}`,
		` [fg=#ffa500]total[/>]: ${formNum(currentMoney)}/${formNum(totalCost, {numColor: (totalCost > currentMoney) ? "#be093f" : "#09be79"})} (${formNum(totalCost - currentMoney)})`,
	].join('\n'))

	if (!rejectFunds && !args.preview) {
		for (const field in upgrades) {
			const upgrade = upgrades[field as keyof typeof upgrades];

			if (args[field] > 0) {
				for (let i = 0; i < nodeCount; i++) {
					upgrade.upgrade(i, args[field])
				}
			}
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