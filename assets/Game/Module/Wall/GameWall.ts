import { _decorator, v3, Vec3 } from "cc";
import mk from "mk";
import GameBundle from "../../Bundle/GameBundle";
const { ccclass, property } = _decorator;

@ccclass("GameWall")
export class GameWall extends mk.ViewBase {
	initData!: Vec3;
	// 初始化视图
	create(): void {
		this.node.setWorldPosition(v3(99999, 99999));
		mk.N(this.node).width = GameBundle.data.mapUnitSizeNum - 1;
		mk.N(this.node).height = GameBundle.data.mapUnitSizeNum - 1;
	}
	// 有数据初始化
	init(init_?: typeof this.initData): void {
		this.node.setWorldPosition(this.initData);
	}
	// 无数据初始化
	// open(): void {}
	// 模块关闭
	// close(): void {}
}
