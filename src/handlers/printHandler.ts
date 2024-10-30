import { NS } from "@ns";
import { defaultThemeProfile } from "./colorHandler";
import { parseObject } from "../utils/objectParser";

export function bprint(ns: NS|undefined, ...msg: any): void {
	let toTerminalArg = (msg.join(' ').startsWith('--terminal'));
	if (toTerminalArg) (msg as any[]).splice(0, 1);

	let message = getBetterPrint(...msg);
	
	if (toTerminalArg || ns?.getScriptName() == 'director.js') ((ns != undefined && ns != null) ? ns.tprint : console.log)('\n' + message);
	else ((ns != undefined || ns != null) ? ns.print : console.log)(message);
}

export function getBetterPrint(...msg: any) {
	const msgList: string[] = []
	for (let i = 0; i < msg.length; i++) {
		const m = msg[i]
		if (m === '') continue;
		if (typeof m === 'object') {
			msgList.push(`${parseObject(m)}`);
		}
		else {
			msgList.push(m)
		}
	}
	
	let message = msgList.join(' ')
	const lines = message.split('\n')
	if (lines.length > 1) {
		const firstLine: string = lines.splice(0, 1).join('');
		const lastLine: string = lines.splice(-1, 1).join('');

		//? avoid a corner connection to empty space 
		//! last line can be empty because the line before that was a new line (\n)
		if (firstLine === '' || lastLine === '' && lines.length === 0) {
			message = '[st=reset] [/>]' + message
		}
		else {
			message = `┌${firstLine}${(lines.length > 0) ? '\n│' + lines.join('\n│') : ''}\n└${lastLine}`
		}
	}
	else {
		message = '[st=reset] [/>]' + message
	}

	return colorize(message);
}

export function colorize(input: string): string {
	return defaultThemeProfile.applyThemeProfile(input);
}
export function colorizeSyntax(input: string): string {
	return defaultThemeProfile.applyColorSyntax(input);
}