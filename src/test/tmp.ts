class TmpClass {
	public tmp;
	public msg: string = '';
	constructor(msg?: string) {
		this.tmp = true;
		this.msg = msg ?? 'no msg';
	}
}

export interface Itmp {
	isTmp: boolean;
	reason?: string;
}

export function tmpFunc() {
	return new TmpClass();
}
export function tmpFuncInput(input: string) {
	return new TmpClass(input);
}

export class TmpStatus {
	public status: boolean = false;
	public reason?: string;

	constructor(input: Itmp) {
		this.status = input.isTmp;
		this.reason = input.reason;
	}

	public getTmp(): Itmp {
		return {isTmp: this.status, reason: this.reason};
	}
}