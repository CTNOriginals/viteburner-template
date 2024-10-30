import { AutocompleteData, NS } from "@ns";
import { ArgumentBase, ArgumentValue } from "@/handlers/argumentHandler";
import { bprint } from "@/handlers/printHandler";
import { defaultColors, fakeNS } from "@/lib/generalData";
import { formNum } from "@/utils/numberFormat";

class Arguments extends ArgumentBase {
	public budget: ArgumentValue<number> = new ArgumentValue({
		value: 1000000,
		description: 'The amount of money the trader starts with'
	});
	public clear: ArgumentValue<boolean> = new ArgumentValue({
		value: false,
		description: 'Sell all open positions on startup for a clean start'
	});
	public clearOnExit: ArgumentValue<boolean> = new ArgumentValue({
		value: true,
		description: 'Sell all stocks this script bought once the script closes'
	});
	constructor(ns: ArgumentBase['ns']) { super(ns); this.parseArgs(); }
}

interface ISymbolInfo {
	maxShares: number;
	currentShares: number;
	forecast?: number;
	price?: number;
}
type SymbolInfoCollection = {[sym: string]: ISymbolInfo};
type SymbolInfoFullCollection = {[sym: string]: Required<ISymbolInfo>};

const transactionFee = 100000;
const symbolInfo: SymbolInfoCollection = {};

export async function main(ns: NS) {
	ns.disableLog('ALL');
	const args = new Arguments(ns);
	const startingBudget = args.budget.value;

	const symbols = ns.stock.getSymbols();
	for (const sym of symbols) {
		symbolInfo[sym] = {
			maxShares: ns.stock.getMaxShares(sym),
			currentShares: 0,
		}
		
		if (args.clear.value) {
			ns.stock.sellStock(sym, symbolInfo[sym].maxShares); //? reset the shares and start over from here
		}
	}

	if (args.clearOnExit.value) {
		ns.atExit(() => {
			for (const sym of symbols) {
				if (args.clear.value) {
					ns.stock.sellStock(sym, symbolInfo[sym].maxShares); //? reset the shares and start over from here
				}
			}
		})
	}
	
	let currentBudget = startingBudget;
	let totalBuy = 0;
	let totalSell = 0;
	const tradeHistory: string[] = [];
	while(true) {
		await ns.stock.nextUpdate();
		ns.clearLog();

		let buy: string[] = [];
		let sell: string[] = [];
		const messages: string[] = [];

		for (const sym of symbols) {
			const info = updateSymbolInfo(ns, sym);
			
			if (info.forecast > 0.6) { buy.push(sym) }
			else if (info.forecast < 0.45 && info.currentShares > 0) { sell.push(sym) }
		}

		buy = buy.sort((a,b) => symbolInfo[a].currentShares - symbolInfo[b].currentShares);

		for (const sym of sell) {
			//TODO sell a precentage of shares based on how close the forcast is to the minimum
			const info = symbolInfo[sym];
			const shares = info.currentShares;

			const result = ns.stock.sellStock(sym, info.currentShares);
			if (result <= 0) continue;

			const cost = (result * shares)
			currentBudget += cost;
			currentBudget -= transactionFee; //? Transaction fee
			totalSell += cost;
			
			updateSymbolInfo(ns, sym);

			messages.push(`${sym}:\t[fg=${defaultColors.red}] SELL[/>]\t${formNum(shares, {decimals: 2, numColor: defaultColors.orange})}\t${formNum(result, {decimals: 2})}\t${formNum(cost, {decimals: 2})}`)
		}

		for (const sym of buy) {
			//TODO see sell: apply inverse
			//TODO base the amount of shares off of the average diff of this forcast compared to all of the rest of the buy queue
			const info = symbolInfo[sym] as Required<ISymbolInfo>;
			let shares = Math.floor((currentBudget / buy.length) / info.price);

			if (shares <= 0 || (shares * info.price) <= transactionFee || info.currentShares >= info.maxShares) continue;
			if (info.currentShares + shares > info.maxShares) {
				shares = info.maxShares - info.currentShares //? set the shares to the remaining buyable shares
			}

			const result = ns.stock.buyStock(sym, shares);
			if (result <= 0) continue;

			const cost = (result * shares)
			currentBudget -= cost;
			currentBudget -= transactionFee; //? Transaction fee
			totalBuy += cost;

			updateSymbolInfo(ns, sym);

			messages.push(`${sym}:\t[fg=${defaultColors.green}] BUY[/>]\t${formNum(shares, {decimals: 2, numColor: defaultColors.orange})}\t${formNum(result, {decimals: 2})}\t${formNum(cost, {decimals: 2})}`)
		}

		const invested: SymbolInfoFullCollection = {}
		let currentWorth = currentBudget;
		for (const sym of symbols) { //? update the invested list
			if ((symbolInfo[sym].currentShares ?? 0) > 0) {
				invested[sym] = symbolInfo[sym] as Required<ISymbolInfo>;
				currentWorth += (ns.stock.getPrice(sym) * symbolInfo[sym].currentShares);
			};
		}

		const tradeMessagesHeader = `[fg=aaaaaa]SYM\tACTION\tSHARES\tPRICE\tTOTAL[/>]`;

		bprint(ns, tradeMessagesHeader, '\n' + tradeHistory.join('\n'), '\n');

		let budgetString = `${formNum(currentBudget)}/${formNum(startingBudget)}`;
		budgetString += `\t(${formNum(currentWorth)})${(currentWorth > startingBudget) ? `[fg=${defaultColors.green}]^[/>]` : `[fg=${defaultColors.red}]-[/>]`}`;
		budgetString += `\t${formNum(totalBuy, {numColor: defaultColors.green})}[fg=${defaultColors.greenDim}]+[/>]/[fg=${defaultColors.redDim}]-[/>]${formNum(totalSell, {numColor: defaultColors.red})}`
		bprint(ns, (Object.keys(invested).length > 0) ? invested : symbolInfo);
		
		if (messages.length > 0) {
			bprint(ns, '\n', tradeMessagesHeader, '\n', messages.join('\n '), '\n');
			tradeHistory.push(...messages);

			if (tradeHistory.length > 100) {
				tradeHistory.splice(100, tradeHistory.length - 1);
			}
		}
		
		bprint(ns, '\n', budgetString);
	}
}

function updateSymbolInfo(ns: NS, sym: string): Required<ISymbolInfo> {
	const pos = ns.stock.getPosition(sym);
	const newInfo = {
		forecast: ns.stock.getForecast(sym) ?? 0,
		price: ns.stock.getPrice(sym),
		currentShares: pos[0],
		averagePrice: pos[1],
	}

	for (const key in newInfo) {
		symbolInfo[sym][key] = newInfo[key];
	}


	return symbolInfo[sym] as Required<ISymbolInfo>;
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