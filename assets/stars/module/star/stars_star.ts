import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import stars_bundle from "../../bundle/stars_bundle";
const { ccclass, property } = _decorator;

@ccclass("stars_star")
export class stars_star extends mk.view_base {
	data = new (class {
		audio: mk.audio_.unit;
	})();

	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	async open(): Promise<void> {
		this.data.audio = await mk.audio.add("db://assets/stars/module/star/audio/score.mp3", this);
		// 注册单个碰撞体的回调函数
		const collider = this.getComponent(cc.Collider2D);

		if (collider) {
			collider.on(cc.Contact2DType.BEGIN_CONTACT, this._on_begin_contact, this);
		}
	}
	// 模块关闭
	close(): void {
		stars_bundle.event.emit(stars_bundle.event.key.generate_star);
	}

	private _on_begin_contact(self_: cc.Collider2D, other_: cc.Collider2D, contact: cc.IPhysics2DContact | null): void {
		// 只在两个碰撞体开始接触时被调用一次
		console.log("onBeginContact");
		mk.audio.play(this.data.audio);
		this.scheduleOnce(() => {
			this.close();
		});
	}
}
