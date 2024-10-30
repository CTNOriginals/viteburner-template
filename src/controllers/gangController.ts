import { AutocompleteData, NS } from "@ns";
import { bprint } from "@/handlers/printHandler";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { fakeNS } from "@/lib/generalData";
import { addCSS, rButton, rText } from "@/lib/ReactElements";
import { formNum } from "@/utils/numberFormat";

class Arguments extends ArgumentBase {
	public x: ArgumentValue<boolean> = new ArgumentValue({
		value: true,
		description: ''
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

/*
[
	Unassigned,
	Ransomware,
	Phishing,
	Identity Theft,
	DDoS Attacks,
	Plant Virus,
	Fraud & Counterfeiting,
	Money Laundering,
	Cyberterrorism,
	Ethical Hacking,
	Vigilante Justice,
	Train Combat,
	Train Hacking,
	Train Charisma,
	Territory Warfare
└]
*/

export async function main(ns: NS) {
	ns.disableLog('ALL');
	ns.tail();
	ns.resizeTail(600, 200)
	const args = new Arguments(ns);
	const members = ns.gang.getMemberNames();
	
	const bestCombat = (member) => {
		const stats = ns.gang.getMemberInformation(member)
		return Math.max(stats.str_exp, stats.def_exp, stats.dex_exp, stats.agi_exp)
	}

	function assignAll(task: string) {
		for (const name of ns.gang.getMemberNames()) {
			ns.gang.setMemberTask(name, task);
		}
	}
	function buyAll(eq: string) {
		if (ns.gang.getEquipmentCost(eq) * members.length > ns.getPlayer().money) { return; } //TODO log
		for (const name of ns.gang.getMemberNames()) {
			ns.gang.purchaseEquipment(name, eq);
		}
	}

	enum DominantStat {Hack, Combat}
	function getDominantStat(member: string): DominantStat {
		const stats = ns.gang.getMemberInformation(member);
		if (stats.hack_exp > bestCombat(member)) {
			return DominantStat.Hack;
		} else {
			return DominantStat.Combat;
		}
	}

	const elements = [
		rText("EQEPT:", { color: "#ff0" }),
		rButton("NUKE", function () { buyAll("NUKE Rootkit"); }),
		rButton("Soulstealer", function () { buyAll("Soulstealer Rootkit"); }),
		rButton("Demon", function () { buyAll("Demon Rootkit"); }),
		rButton("Hmap", function () { buyAll("Hmap Node"); }),
		rButton("Jack Ripper", function () { buyAll("Jack the Ripper"); }),
		rButton("ALL", function () { 
			const allEq = [
				'NUKE Rootkit',
				'Soulstealer Rootkit',
				'Demon Rootkit',
				'Hmap Node',
				'Jack the Ripper',
			]
			for (const eq of allEq) {
				buyAll(eq);
			}
		}),

		rText("\nTRAIN:", { color: "#ff0" }),
		rButton("Best", function () {
			for (const name of ns.gang.getMemberNames()) {
				const domStat = getDominantStat(name);
				ns.gang.setMemberTask(name, (getDominantStat(name) == DominantStat.Hack) ? "Train Hacking" : "Train Combat")
			}
		}),
		rButton("Hack", function () { assignAll("Train Hacking"); }),
		
		rText("\nTASKS:", { color: "#ff0" }),
		rButton("Ethics/Justice", function () {
			for (const name of ns.gang.getMemberNames()) {
				const domStat = getDominantStat(name);
				ns.gang.setMemberTask(name, (getDominantStat(name) == DominantStat.Hack) ? "Ethical Hacking" : "Vigilante Justice")
			}
		}),
		rButton("Money Laundering", function () { assignAll("Money Laundering"); }),
		rButton("Warfare", function () { assignAll("Territory Warfare"); }, undefined, undefined, `Power: ${formNum(ns.gang.getGangInformation().power, {noColor: true})}`),

		rText("\nACTIONS:", { color: "#ff0" }),
		rButton("Ascent ALL", function () {
			for (const name of ns.gang.getMemberNames()) {
				ns.gang.ascendMember(name);
			}
		}),

		// rText(`\nPower: ${formNum(ns.gang.getGangInformation().power, {noColor: true})}`, {}),
	]
	
	// bprint(ns, ns.gang.getGangInformation())

	let content: any[] = [];
	for (let i = 0; i < elements.length; i++) { //? put seperator text between each element
		content.push(elements[i])
		if (i != elements.length - 1) {
			content.push(rText(" ", { color: "#ff0" }))
		}
	}
	addCSS();
	ns.printRaw(content);
	
	while(true) {
		await ns.asleep(1000);

		for (const name of ns.gang.getMemberNames()) {
			const stats = ns.gang.getMemberInformation(name)
			if (stats.earnedRespect > 100 || !stats.task.includes('Train') || stats.upgrades.length > 0) continue;

			const dominant = getDominantStat(name);
			const upStat = ns.gang.getAscensionResult(name);
			
			if (dominant == DominantStat.Hack) {
				if (stats.hack_asc_mult * (upStat?.hack ?? 1) >= stats.hack_asc_mult + 1) {
					ns.gang.ascendMember(name);
					// bprint(ns, `Ascend ${name}`);
				}
			} else {
				//TODO
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
}1.09098100