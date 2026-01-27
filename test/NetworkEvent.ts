import { GameMessages_ } from "../assets/Game/Bundle/GameMessages";
import { GlobalData_ } from "./GlobalData";

class NetworkEventTarget<
	CT = {
		[k in keyof typeof GameMessages_]: (player: GlobalData_.PlayerData, data: (typeof GameMessages_)[k]["prototype"]) => any;
	}
> {
	key: { [key in keyof CT]: key } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});

	private _eventTab: Record<
		PropertyKey,
		{
			callbackFunc: Function;
			target: any;
			isOnce: boolean;
		}[]
	> = new Proxy({} as any, {
		get: (target, key) => {
			return target[key] ?? (target[key] = []);
		},
	});

	// @ts-ignore
	on<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T | T[],
		callbackFunc_: T2,
		this_?: any,
		isOnce_?: boolean
	): typeof callbackFunc_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				this._eventTab[v].push({
					callbackFunc: callbackFunc_,
					target: this_,
					isOnce: Boolean(isOnce_),
				});
			});

			return null;
		} else {
			this._eventTab[type_].push({
				callbackFunc: callbackFunc_,
				target: this_,
				isOnce: Boolean(isOnce_),
			});

			return callbackFunc_;
		}
	}

	// @ts-ignore
	once<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T | T[],
		callbackFunc_: T2,
		this_?: any
	): typeof callbackFunc_ | null {
		if (Array.isArray(type_)) {
			type_.forEach((v) => {
				this._eventTab[v].push({
					callbackFunc: callbackFunc_,
					target: this_,
					isOnce: true,
				});
			});

			return null;
		} else {
			this._eventTab[type_].push({
				callbackFunc: callbackFunc_,
				target: this_,
				isOnce: true,
			});

			return callbackFunc_;
		}
	}

	// @ts-ignore
	off<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T | T[], callbackFunc_?: T2, this_?: any): void {
		const offSingle = (type: T): void => {
			const list = this._eventTab[type];

			if (!list || list.length === 0) {
				return;
			}

			for (let i = list.length - 1; i >= 0; i--) {
				const v = list[i];

				if ((callbackFunc_ && v.callbackFunc !== callbackFunc_) || (this_ && v.target !== this_)) {
					continue;
				}

				list.splice(i, 1);
			}
		};

		if (Array.isArray(type_)) {
			type_.forEach(offSingle);
		} else {
			offSingle(type_);
		}
	}

	targetOff(this_: any): void {
		for (const key in this._eventTab) {
			const list = this._eventTab[key];

			if (!list?.length) {
				continue;
			}

			for (let i = list.length - 1; i >= 0; i--) {
				if (list[i].target !== this_) {
					continue;
				}

				list.splice(i, 1);
			}
		}
	}

	// @ts-ignore
	emit<T extends keyof CT, T2 extends Parameters<CT[T]>>(type_: T | T[], ...args_: T2): void {
		const emitSingle = (type: T): void => {
			const list = this._eventTab[type];

			if (!list || list.length === 0) {
				return;
			}

			// 拷贝，防止回调过程中 off / once 影响遍历
			const tempList = list.slice();

			tempList.forEach((v) => {
				v.callbackFunc.call(v.target, ...args_);

				if (v.isOnce) {
					const index = list.indexOf(v);

					if (index !== -1) {
						list.splice(index, 1);
					}
				}
			});
		};

		if (Array.isArray(type_)) {
			type_.forEach(emitSingle);
		} else {
			emitSingle(type_);
		}
	}

	// @ts-ignore
	has<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(type_: T, callbackFunc_?: T2, target_?: any): boolean {
		const list = this._eventTab[type_];

		if (!list || list.length === 0) {
			return false;
		}

		return list.some((v) => {
			if (callbackFunc_ && v.callbackFunc !== callbackFunc_) {
				return false;
			}

			if (target_ && v.target !== target_) {
				return false;
			}

			return true;
		});
	}

	/** 清空所有事件 */
	clear(): void {
		for (const key in this._eventTab) {
			this._eventTab[key].length = 0;
		}
	}

	/** 请求（等待返回） */
	// @ts-ignore
	request<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T | T[], ...args_: T2): Promise<T3>[] {
		if (Array.isArray(type_)) {
			const resultTaskList: Promise<any>[] = [];

			type_.forEach((v) => {
				resultTaskList.push(...this._requestSingle(v, ...args_));
			});

			return resultTaskList;
		} else {
			return this._requestSingle(type_, ...args_);
		}
	}

	/** 请求单个事件 */
	// @ts-ignore
	private _requestSingle<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T, ...args_: T2): Promise<T3>[] {
		/** 返回值 */
		const resultTaskList: Promise<any>[] = [];
		/** 回调列表 */
		const callbackFuncList = this._eventTab[type_];

		if (!callbackFuncList) {
			return resultTaskList;
		}

		callbackFuncList.forEach((v) => {
			const oldCallbackFunc = v.callbackFunc;
			const target = v.target;

			v.callbackFunc = (...argsList: any[]) => {
				resultTaskList.push(oldCallbackFunc.call(target, ...argsList));
				v.callbackFunc = oldCallbackFunc;
			};
		});

		this.emit(type_, ...args_);

		return resultTaskList;
	}
}

export default NetworkEventTarget;
