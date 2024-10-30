const indentChar = '│ '
const indentCount = 1

export function getBacketPair(collection: Record<string, any>|any[]) {
	return (Array.isArray(collection)) ? ['[',']'] : ['{','}'];
}
export function parseObject(obj: Record<string|number, any>|any[], depth: number = 1): string {
	let out = '';
	
	const validateValue = (col: any) => {
		if (typeof col === 'object') {
			if (col === undefined || col === null) { return '< >'; }
			else if (Array.isArray(col) && col.length === 0) { return '[ ]'; }
			else if (Object.keys(col).length === 0) { return '{ }'; }
		}
		return col;
	}

	//? check if the obj is an array and make sure its not something thats like and array, like regex match objects
	const isArray = (Array.isArray(obj) && Object.keys(obj).every(key => !Number.isNaN(Number.parseInt(key))));
	for (const k in obj) {
		let key = `[fg=99cccc]${k}[/>]: `
		let val = validateValue(obj[k as keyof typeof obj]);
		const isLast = (Object.keys(obj)[Object.keys(obj).length - 1] == k)
		if (isArray) key = '';

		if (isArray && val == '') continue
		out += getIndent(depth);
		
		if (typeof val == 'object') {
			out += `${key}${parseObject(val, depth + 1)}\n`//${(!isLast) ? ',' : ''}`
		}
		else {
			if (isArray && val == '') continue

			let tryParseNumber = null;
			try { tryParseNumber = parseFloat(val); } catch (e) {}
			if (tryParseNumber != null && !Number.isNaN(tryParseNumber)) { val = tryParseNumber; }
			else if (typeof val === 'string' && !['[ ]', '{ }'].includes(val)) {
				if (val != '') { val = `[fg=c4785b]${val}[/>]`; }
				else { val = '""'; }
				val = val.split('\n').join('\n' + getIndent(depth) + ' '.repeat((isArray) ? 1 : k.length + 2))
			}
			out += `${key}${`${val}`}${(!isLast) ? ',' : ''}\n`
		}
		
	}
	const brackets = getBacketPair(obj)
	return `${brackets[0]}\n${out}${getIndent(depth - 1)}${brackets[1]}`;
}
function getIndent(depth: number) {
	return `[fg=484848]${indentChar}[/>]`.repeat(indentCount * depth);
	// let color = (depth % 2 == 0) ? '#00FF00' : '#ff0000';
	// return `[fg=${color}]${indentChar}[/>]`.repeat(indentCount * depth);
}