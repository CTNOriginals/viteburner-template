import { NS } from "@ns";
import * as types from '@/@types/index';
import { Itmp, tmpFunc, tmpFuncInput, TmpStatus } from "./tmp";

export function doTmp(ns: NS) {
	ns.print(tmpFunc().msg);
	ns.print(tmpFuncInput('Hi mom!').msg);
	ns.print((new TmpStatus({isTmp: false, reason: 'idfk... it should be...'}).getTmp() as Itmp).reason);
}

export function someTestFunc(param: number, x: types.strORnum, y: boolean) {
	return param * ((y) ? 2 : -1) + ((typeof x == "number") ? + x : + x.length);
}