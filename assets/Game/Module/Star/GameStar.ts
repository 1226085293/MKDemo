import { _decorator, Collider2D, Contact2DType, IPhysics2DContact, v3, view } from "cc";
import mk from "mk";
import GameBundle from "../../Bundle/GameBundle";
const { ccclass, property } = _decorator;

@ccclass("GameStar")
export class GameStar extends mk.ViewBase {
	data = new (class {
		audio!: mk.Audio_.Unit;
	})();

	protected create(): void {
		const viewSize = view.getVisibleSize();
		const positionV3 = v3(Math.random() * (viewSize.width - 100) + 50, 380 + Math.random() * 100 - 50);

		this.node.setWorldPosition(positionV3);
	}

	// 无数据初始化
	async open(): Promise<void> {
		this.data.audio = (await mk.audio.add("Module/Star/Audio/score", this))!;
		// 注册单个碰撞体的回调函数
		const collider = this.getComponent(Collider2D);

		if (collider) {
			collider.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this);
		}
	}

	// 模块关闭
	close(): void {
		GameBundle.event.emit(GameBundle.event.key.generateStar);
	}

	private _onBeginContact(self_: Collider2D, other_: Collider2D, contact: IPhysics2DContact | null): void {
		// 只在两个碰撞体开始接触时被调用一次
		console.log("onBeginContact");
		mk.audio.play(this.data.audio);
		this.scheduleOnce(() => {
			this.close();
		});
	}
}
