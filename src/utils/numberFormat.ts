import { DNS } from "@/director";
import { defaultThemeProfile } from "@/handlers/colorHandler";
import { bprint } from "@/handlers/printHandler";
import { NS } from "@ns";
import { populateOptionObject } from ".";
// import { bprint } from "@/handlers/printHandler";
// import { DNS } from "@/director";


const metricPrefixes = [
	{ prefix: 'k', color: '#FF6F61' },  // Soft red
	{ prefix: 'm', color: '#FF9A6B' },  // Light coral
	{ prefix: 'b', color: '#ffb259' },  // Peach
	{ prefix: 't', color: '#ffcd62' },  // Soft orange
	{ prefix: 'p', color: '#f0df4d' },  // Light yellow
	{ prefix: 'e', color: '#89d418' },  // Soft green
	{ prefix: 'z', color: '#48c437' },  // Greenish
	{ prefix: 'y', color: '#3ec5a3' },  // Light teal
	{ prefix: 'r', color: '#53bcca' },  // Soft cyan
	{ prefix: 'q', color: '#7CA6EB' }   // Light blue
];

interface IFormatNumberOptions {
	decimals: number,
	capitalize: boolean,
	noColor: boolean,
	numColor: string,
}
const FormatNumberOptionDefaults: Required<IFormatNumberOptions> = {
	decimals: 3,
	capitalize: false,
	noColor: false,
	numColor: defaultThemeProfile.typeThemes.number?.default?.foreground.asHex!
}

/** 
 * @description Format a number to display it in a more readable way when it gets very large
 * @param {number} num The number to format
 * @param {number} decimals The amount of decimals after the dot to present
 * @param {boolean} capitalize Should the SI prefixes be uppercase?
 * @param {boolean} noColor Should the SI prefixes apply a color of their own?
*/
//TODO Make all params into an options object
export function formNum(num?: number, inputOptions: Partial<IFormatNumberOptions> = FormatNumberOptionDefaults): string {
	const options = populateOptionObject<IFormatNumberOptions>(inputOptions, FormatNumberOptionDefaults);
	if (num === undefined || typeof num != 'number') return `[fg=${options.numColor}]0[/>]`;
	if (num < 1000 && num > -1000) {
		return (options.noColor) ? 
			`${(Math.round(num * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals)).toString()}` :
			`[fg=${options.numColor}]${(Math.round(num * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals)).toString()}[/>]`;
	}

	const exponent = Math.floor(Math.log10(Math.abs(num))); //? Get the order of magnitude
	const index = Math.floor(exponent / 3) - 1; //? Divide by 3 and adjust for the array index

	if (index >= metricPrefixes.length) return '42';

	let prefix = (options.capitalize) ? metricPrefixes[index].prefix.toUpperCase() : metricPrefixes[index].prefix;
	if (!options.noColor) prefix = `[fg=${metricPrefixes[index].color}]${prefix}[/>]`;

	const scaledNumber = num / Math.pow(10, (index + 1) * 3); //? Scale down the number by 1000s (k, m, etc.)
	const rounded = (Math.round(scaledNumber * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals)).toFixed(options.decimals);  //? Round to desired decimals
	
	return (options.noColor) ? `${rounded}${prefix}` : `[fg=${options.numColor}]${rounded}[/>]${prefix}`;
}
// export function main(ns: NS) {
// 	bprint(ns, formNum(100))
// 	bprint(ns, formNum(1000))
// 	bprint(ns, formNum(12345))
// 	bprint(ns, formNum(100000))
// 	bprint(ns, formNum(1000000))
// 	bprint(ns, formNum(12345678))
// 	bprint(ns, formNum(100000000))
// 	bprint(ns, formNum(1000000000))
// 	bprint(ns, formNum(12340000000))
// 	bprint(ns, formNum(100000000000))
// 	bprint(ns, formNum(1000000000000))
// 	bprint(ns, formNum(10000000000000))
// 	bprint(ns, formNum(100000000000000))
// 	bprint(ns, formNum(1000000000000000))
// 	bprint(ns, formNum(10000000000000000))
// 	bprint(ns, formNum(100000000000000000))
// 	bprint(ns, formNum(1000000000000000000))
// 	bprint(ns, formNum(10000000000000000000))
// 	bprint(ns, formNum(100000000000000000000))
// 	bprint(ns, formNum(1000000000000000000000))
// 	bprint(ns, formNum(10000000000000000000000))
// 	bprint(ns, formNum(100000000000000000000000))
// 	bprint(ns, formNum(1000000000000000000000000))
// 	bprint(ns, formNum(10000000000000000000000000))
// 	bprint(ns, formNum(100000000000000000000000000))
// 	bprint(ns, formNum(1000000000000000000000000000))
// 	bprint(ns, formNum(10000000000000000000000000000))
// 	bprint(ns, formNum(100000000000000000000000000000))
// 	bprint(ns, formNum(1000000000000000000000000000000))
// 	bprint(ns, formNum(10000000000000000000000000000000))
// 	bprint(ns, formNum(100000000000000000000000000000000))
// 	// bprint(ns, formNum(430974905653566887086, true))
// }