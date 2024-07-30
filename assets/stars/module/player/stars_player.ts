import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import stars from "../../bundle/stars";
const { ccclass, property } = _decorator;

@ccclass("stars_player")
export class stars_player extends mk.view_base {
	data = new (class {
		jump_duration_n = 0.3;
		jump_height_n = 200;
		acc_left_b = false;
		acc_right_b = false;
		x_speed_n = 0;
		max_move_speed_n = 400;
		accel_n = 300;
		node_x_n = 0;
		node_y_n = 0;
	})();
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	async open(): Promise<void> {
		this.data.node_y_n = this.node.position.y;
		// 跳跃上升
		const jump_up = cc.tween(this.data).by(this.data.jump_duration_n, { node_y_n: this.data.jump_height_n }, { easing: "sineOut" });
		// 下落
		const jump_down = cc.tween(this.data).by(this.data.jump_duration_n, { node_y_n: -this.data.jump_height_n }, { easing: "sineIn" });
		/** 音频 */
		const audio = await mk.audio.add("db://assets/stars/module/player/audio/jump.mp3", stars);

		// 不断重复
		cc.tween(this.data)
			.repeatForever(
				cc.tween().sequence(
					jump_up,
					jump_down,
					cc.tween().call(() => {
						mk.audio.play(audio);
					})
				)
			)
			.start();

		cc.input.on(
			cc.Input.EventType.KEY_DOWN,
			(event) => {
				switch (event.keyCode) {
					case cc.KeyCode.KEY_A:
						this.data.acc_left_b = true;
						break;
					case cc.KeyCode.KEY_D:
						this.data.acc_right_b = true;
						break;
				}
			},
			this
		);

		cc.input.on(
			cc.Input.EventType.KEY_UP,
			(event) => {
				switch (event.keyCode) {
					case cc.KeyCode.KEY_A:
						this.data.acc_left_b = false;
						break;
					case cc.KeyCode.KEY_D:
						this.data.acc_right_b = false;
						break;
				}
			},
			this
		);
	}

	update(dt_n_: number): void {
		// 根据当前加速度方向每帧更新速度
		if (this.data.acc_left_b) {
			this.data.x_speed_n -= this.data.accel_n * dt_n_;
		} else if (this.data.acc_right_b) {
			this.data.x_speed_n += this.data.accel_n * dt_n_;
		}

		// 限制主角的速度不能超过最大值
		if (Math.abs(this.data.x_speed_n) > this.data.max_move_speed_n) {
			// if speed reach limit, use max speed with current direction
			this.data.x_speed_n = (this.data.max_move_speed_n * this.data.x_speed_n) / Math.abs(this.data.x_speed_n);
		}

		// 根据当前速度更新主角的位置
		this.data.node_x_n += this.data.x_speed_n * dt_n_;
		this.node.setPosition(this.data.node_x_n, this.data.node_y_n);
	}

	// 模块关闭
	// close(): void {}
}
