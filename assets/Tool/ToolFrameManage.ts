import * as cc from "cc";
import mk from "mk";
import asin from "@stdlib/math-base-special-asin";
import atan2 from "@stdlib/math-base-special-atan2";
import cos from "@stdlib/math-base-special-cos";
import exp from "@stdlib/math-base-special-exp";
import pow from "@stdlib/math-base-special-pow";
import sin from "@stdlib/math-base-special-sin";
import sqrt from "@stdlib/math-base-special-sqrt";

namespace _ToolFrameManage {
	export interface EventProtocol {
		/**
		 * 渲染单元验证数据
		 * @param renderFrameNum_ 渲染帧
		 * @param dataStrList_ 渲染单元返回的验证数据
		 */
		renderUnitVerifyData(renderFrameNum_: number, dataStrList_: string[]): void;
	}
}

/** 帧管理器 */
class ToolFrameManage implements cc.ISchedulable {
	idStr?: string;
	uuidStr?: string;
	/** 逻辑帧帧数/秒(和服务器同步) */
	readonly logicFrameSpeedNum = 30;
	/** 预留逻辑帧（防止消息延迟） */
	readonly reservedLogicFrameNum = 5;
	/** 事件 */
	event = new mk.EventTarget<_ToolFrameManage.EventProtocol>();
	/** 渲染帧速率 */
	renderSpeedMsNum = 0;
	/** 渲染单元表 */
	renderUnitList: ToolFrameManage_.RenderUnit[] = [];

	/** 本地逻辑帧 */
	get logicFrameNum(): number {
		return this._data.logicFrameNum;
	}
	/** 当前渲染帧 */
	get renderFrameNum(): number {
		return this._data.renderFrameNum;
	}
	/** 帧日志 */
	get frameLogStr(): string {
		return this._data.frameLogStrList.join("\n");
	}

	/** 初始化状态 */
	private _isInit = false;
	/** 渲染帧倍率 */
	private _renderFrameRateNum = -1;
	/** Math 数据 */
	private _mathTab: Record<string, any> = {};
	/** 日志 */
	private _log = new mk.Logger("ToolFrameManage");
	/** 数据 */
	private _data = new (class {
		/** 本地逻辑帧 */
		logicFrameNum = -1;
		/** 当前渲染帧 */
		renderFrameNum = -1;
		/** 暂停渲染 */
		isPauseRender = false;
		/** 目标逻辑帧（服务器） */
		targetFrameNum = -1;
		/** 开始渲染 */
		isRender = false;
		/** 同步状态（追帧） */
		isSyncState = false;
		/** 步骤任务 */
		stepTaskMap = new Map<number, Function[]>();
		/** 上次渲染时间 */
		previousRenderTimestampNum = 0;
		/** 渲染随机表 */
		randomCountTab: Record<number, number> = {};
		/** 随机数种子 */
		randomSeedNum = -1;
		/** 帧日志 */
		frameLogStrList: string[] = [];
	})();
	/* ------------------------------- segmentation ------------------------------- */
	async open(): Promise<void> {
		if (this._isInit) {
			return;
		}

		this._isInit = true;

		this.renderSpeedMsNum = 1000 / Number(cc.game.frameRate);
		this._renderFrameRateNum = 1000 / this.logicFrameSpeedNum / this.renderSpeedMsNum;
		this._replaceMath(true);
		for (const v of this.renderUnitList) {
			await v.init?.();
		}

		cc.Scheduler.enableForTarget(this);
		cc.director.getScheduler().scheduleUpdate(this, -999, false);
	}

	update(dt: number): void {
		this._render();
	}

	close(): void {
		if (!this._isInit) {
			return;
		}

		this._isInit = false;

		// 清理渲染单元
		this.renderUnitList.splice(0, this.renderUnitList.length).forEach((v) => {
			v.destroy?.();
		});

		// 还原 Math
		this._replaceMath(false);
		// 停止定时器
		cc.director.getScheduler().unscheduleUpdate(this);
		// 清理事件
		this.event.clear();
		// 重置数据
		this._data = new (this._data as any).constructor();
	}

	/**
	 * 重置数据
	 * @remarks
	 * 不会清理事件，适用于游戏开始或结束时重置帧管理器数据
	 */
	async reset(): Promise<void> {
		if (!this._isInit) {
			this.open();

			return;
		}

		for (const v of this.renderUnitList) {
			await v.destroy?.();
			await v.init?.();
		}

		// 重置数据
		this._data = new (this._data as any).constructor();
	}

	/**
	 * 步进
	 * @param logicFrameNum_ 当前服务器逻辑帧
	 */
	step(logicFrameNum_: number): void {
		// this._log.log(`服务器逻辑帧：${logicFrameNum_}, 本地逻辑帧：${this.logicFrameNum}, 本地渲染帧：${this.renderFrameNum}, 时间: ${Date.now()}`);

		this._data.targetFrameNum = logicFrameNum_;

		if (this._data.isSyncState) {
			return;
		}

		// 预留逻辑帧
		if (this._data.logicFrameNum + this.reservedLogicFrameNum > this._data.targetFrameNum) {
			return;
		}

		// 当前帧非下一帧，追帧
		if (this._data.logicFrameNum + 1 < this._data.targetFrameNum - this.reservedLogicFrameNum) {
			this._data.isSyncState = true;

			const targetFrameNum = this._data.targetFrameNum - this.reservedLogicFrameNum;

			while (this._data.logicFrameNum !== targetFrameNum) {
				this._render();
			}

			this._data.isSyncState = false;
		}

		this._startRender();
	}

	/** 帧日志 */
	log(...argsAs_: any[]): void {
		this._data.frameLogStrList.push(
			`渲染帧: ${this._data.renderFrameNum}, 逻辑帧: ${this._data.logicFrameNum}, 日志：${argsAs_
				.map((v) => {
					if (typeof v === "object") {
						return v.infoStr ?? JSON.stringify(v);
					} else {
						return String(v);
					}
				})
				.join(",")}`
		);
	}

	/**
	 * 添加任务
	 * @param logicFrameNum_ 逻辑帧
	 * @param taskF_ 任务，由服务器派发的用户操作
	 */
	addTask(logicFrameNum_: number, taskF_: Function): void {
		let taskAs = this._data.stepTaskMap.get(logicFrameNum_);

		if (!taskAs) {
			this._data.stepTaskMap.set(logicFrameNum_, (taskAs = []));
		}

		taskAs.push(taskF_);
	}

	/**
	 * 不重复随机
	 * @remarks
	 * Math.random 在不同设备调用次数不一致所以需要此 random 来保证相同帧随机结果一致
	 */
	random(): number {
		const randomCountNum = this._data.randomCountTab[this._data.renderFrameNum] ?? 0;
		const xNum = Math.sin(this._data.renderFrameNum) * (10000 + this._data.randomSeedNum + randomCountNum);

		this._data.randomCountTab[this._data.renderFrameNum] = randomCountNum + 1;

		return xNum - Math.floor(xNum);
	}

	/**
	 * 设置随机数种子
	 * @param randomSeedNum_ 随机数种子，例如游戏开始时间，需要确保多设备一致
	 */
	setRandomSeed(randomSeedNum_: number): void {
		this._data.randomSeedNum = randomSeedNum_;
	}

	/** 开始渲染 */
	private _startRender(): void {
		if (this._data.isRender) {
			return;
		}

		// 开始渲染
		this._data.isRender = true;
	}

	/** 停止渲染 */
	private _stopRender(): void {
		this._data.isRender = false;
		this._data.previousRenderTimestampNum = 0;
	}

	/** 渲染函数 */
	private _render(): void {
		if (!this._data.isRender && !this._data.isSyncState) {
			return;
		}

		if (this._data.isPauseRender && !this._data.isSyncState) {
			return;
		}

		// 渲染帧超过逻辑帧，停止渲染
		++this._data.renderFrameNum;
		if (this._data.renderFrameNum + 1 >= (this._data.targetFrameNum + 1) * this._renderFrameRateNum) {
			--this._data.renderFrameNum;
			this._stopRender();

			// this._log.log(`停止渲染: 本地逻辑帧：${this.logicFrameNum}, 本地渲染帧：${this.renderFrameNum}`);

			return;
		}

		/** 上一帧 */
		const previousLogicFrameNum = this._data.logicFrameNum;

		// 更新逻辑帧
		this._data.logicFrameNum = Math.floor((this._data.renderFrameNum + 1) / this._renderFrameRateNum);

		// 执行当前帧逻辑
		if (previousLogicFrameNum !== this._data.logicFrameNum) {
			for (let kNum = previousLogicFrameNum + 1, lenNum = this._data.logicFrameNum; kNum <= lenNum; ++kNum) {
				/** 对应逻辑帧任务 */
				const taskAs = this._data.stepTaskMap.get(kNum);

				taskAs?.forEach((vF) => vF());
				this._data.stepTaskMap.delete(kNum);
			}
		}

		// 手动模拟步进
		this._renderStep();
	}

	/** 渲染步进 */
	private _renderStep(): void {
		const realDtNum = this._data.previousRenderTimestampNum ? Date.now() - this._data.previousRenderTimestampNum : 0;

		this.renderUnitList.forEach((v) => v.update(this.renderSpeedMsNum * 0.001, realDtNum * 0.001));
		const verifyDataStrList = this.renderUnitList
			.map((v) => {
				const infoStr = v.verify?.();

				return !infoStr ? null : `${cc.js.getClassName(v)}-${infoStr}`;
			})
			.filter((vStr) => vStr !== null);

		this.event.emit(this.event.key.renderUnitVerifyData, this._data.renderFrameNum, verifyDataStrList);

		this._data.previousRenderTimestampNum = Date.now();
	}

	/**
	 * 替换数学库实现，实现不同平台相同结果
	 * @remark
	 * 根据 https://262.ecma-international.org/6.0/#sec-function-properties-of-the-math-object  规则，以下函数结果根据平台自行实现或参考模板实现，所以可能结果不一致
	 * acos, acosh, asin, asinh, atan, atanh, atan2, cbrt, cos, cosh, exp, expm1, hypot, log, log1p, log2, log10, pow, random, sin, sinh, sqrt, tan, tanh
	 */
	private _replaceMath(replaceB_: boolean): void {
		// box2d：asin, atan2, cos, exp, pow, sin, sqrt, random

		const mathTab: Record<string, Function> = {
			asin,
			atan2,
			cos,
			exp,
			pow,
			sin,
			sqrt,
		};

		if (replaceB_) {
			this._mathTab["random"] = Math.random;
			Math.random = () => {
				const xNum = Math.sin(this._data.renderFrameNum) * (10000 + this._data.randomSeedNum);

				return xNum - Math.floor(xNum);
			};

			for (const kS in mathTab) {
				const newValueF = mathTab[kS];

				if (this._mathTab[kS]) {
					return;
				}

				this._mathTab[kS] = (Math as any)[kS];

				if (newValueF) {
					(Math as any)[kS] = newValueF;
				}
			}
		} else {
			Math.random = this._mathTab["random"];
			delete this._mathTab["random"];

			for (const kS in mathTab) {
				(Math as any)[kS] = this._mathTab[kS];
				delete this._mathTab[kS];
			}
		}
	}
}

export namespace ToolFrameManage_ {
	/** 渲染单元 */
	export abstract class RenderUnit {
		/** 初始化 */
		init?(): any;
		/** 更新 */
		abstract update(dtNum_: number, realDtNum_: number): any;
		/** 销毁 */
		destroy?(): any;
		/**
		 * 数据校验
		 * @remark
		 * 用于对比设备间数据是否一致
		 */
		verify?(): string;
	}
}

export default new ToolFrameManage();
