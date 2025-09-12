import mk from "mk";
import { _decorator, input, Input, KeyCode, tween, view } from "cc";
const { ccclass, property } = _decorator;

@ccclass("GamePlayer")
export class GamePlayer extends mk.ViewBase {
	data = new (class {
		jumpDurationNum = 0.3;
		jumpHeightNum = 200;
		isAccLeft = false;
		isAccRight = false;
		xSpeedNum = 0;
		maxMoveSpeedNum = 400;
		accelNum = 300;
		nodeXNum = 0;
		nodeYNum = 0;
	})();
	/* ------------------------------- segmentation ------------------------------- */
	protected async open(): Promise<void> {
		this.data.nodeYNum = this.node.position.y;
		// 跳跃上升
		const jumpUp = tween(this.data).by(this.data.jumpDurationNum, { nodeYNum: this.data.jumpHeightNum }, { easing: "sineOut" });
		// 下落
		const jumpDown = tween(this.data).by(this.data.jumpDurationNum, { nodeYNum: -this.data.jumpHeightNum }, { easing: "sineIn" });
		/** 音频 */
		const audio = (await mk.audio.add("Module/Player/Audio/jump", this))!;

		// 不断重复
		tween(this.data)
			.repeatForever(
				tween().sequence(
					jumpUp,
					jumpDown,
					tween().call(() => {
						mk.audio.play(audio);
					})
				)
			)
			.start();

		input.on(
			Input.EventType.KEY_DOWN,
			(event) => {
				switch (event.keyCode) {
					case KeyCode.KEY_A:
						this.data.isAccLeft = true;
						break;
					case KeyCode.KEY_D:
						this.data.isAccRight = true;
						break;
				}
			},
			this
		);

		input.on(
			Input.EventType.KEY_UP,
			(event) => {
				switch (event.keyCode) {
					case KeyCode.KEY_A:
						this.data.isAccLeft = false;
						break;
					case KeyCode.KEY_D:
						this.data.isAccRight = false;
						break;
				}
			},
			this
		);
	}

	update(dtNum_: number): void {
		// 根据当前加速度方向每帧更新速度
		if (this.data.isAccLeft) {
			this.data.xSpeedNum -= this.data.accelNum * dtNum_;
		} else if (this.data.isAccRight) {
			this.data.xSpeedNum += this.data.accelNum * dtNum_;
		}

		// 限制主角的速度不能超过最大值
		if (Math.abs(this.data.xSpeedNum) > this.data.maxMoveSpeedNum) {
			// if speed reach limit, use max speed with current direction
			this.data.xSpeedNum = (this.data.maxMoveSpeedNum * this.data.xSpeedNum) / Math.abs(this.data.xSpeedNum);
		}

		// 根据当前速度更新主角的位置
		this.data.nodeXNum += this.data.xSpeedNum * dtNum_;

		const viewSize = view.getVisibleSize();

		if (this.data.nodeXNum < -viewSize.width * 0.5 + 50) {
			this.data.nodeXNum = -viewSize.width * 0.5 + 50;
		} else if (this.data.nodeXNum > viewSize.width * 0.5 - 50) {
			this.data.nodeXNum = viewSize.width * 0.5 - 50;
		}

		this.node.setPosition(this.data.nodeXNum, this.data.nodeYNum);
	}
}

export default GamePlayer;
