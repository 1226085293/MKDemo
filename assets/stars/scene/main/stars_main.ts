import { _decorator } from "cc";
import mk from "mk";
import { stars_player } from "../../module/player/stars_player";
import { stars_star } from "../../module/star/stars_star";
import stars from "../../bundle/stars";
import tool_monitor_data_method from "../../../tool/component/monitor/data_method/tool_monitor_data_method";
const { ccclass, property } = _decorator;

@ccclass("stars_main")
export class stars_main extends mk.static_view_base {
	data = new (class {
		/** 分数 */
		score_n = 0;
	})();

	protected onLoad(): void {
		// 注册跟随 Bundle 释放的模块
		mk.ui_manage.regis(stars_player, "db://assets/stars/module/player/player.prefab", stars);
		mk.ui_manage.regis(stars_star, "db://assets/stars/module/star/star.prefab", stars);
	}
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	open(): void {
		// 数据到视图
		tool_monitor_data_method.string.默认.on(this.data, "score_n", this.node.getChildByName("Label"), {
			head_s: "得分：",
			tail_s: "",
		});

		mk.ui_manage.open(stars_player);
		mk.ui_manage.open(stars_star);

		stars.event.on(
			stars.event.key.generate_star,
			() => {
				this.data.score_n++;
				this.scheduleOnce(() => {
					mk.ui_manage.open(stars_star);
				}, 2);
			},
			this
		);
	}
	// 模块关闭
	// close(): void {}
}
