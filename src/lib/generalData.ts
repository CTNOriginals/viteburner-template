import { NS } from "@ns"


export interface IPortCrackScript {
	name: string,
	prefix: string
}
export const portCrackScripts: IPortCrackScript[] = [
	{name: 'BruteSSH', prefix: 'ssh'},
	{name: 'FTPCrack', prefix: 'ftp'},
	{name: 'relaySMTP', prefix: 'smtp'},
	{name: 'HTTPWorm', prefix: 'http'},
	{name: 'SQLInject', prefix: 'sql'},
]

export const defaultColors = {
	green: '09be79',
	orange: 'ffa500',
	red: 'be093f',
	greenDim: '068051',
	redDim: '80062b',
	orangeDim: '996300',
}

export const fakeNS: NS = {
	args: [],
	asleep: async (miliseconds: number): Promise<true> => {
		return await new Promise((resolve) => {
			setTimeout(() => {resolve(true)}, miliseconds)
		})
	}
} as never;