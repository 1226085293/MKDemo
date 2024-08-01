import { _decorator } from "cc";
import mk from "mk";
import { stars_star } from "../../module/star/stars_star";
import stars_bundle from "../../bundle/stars_bundle";
import tool_monitor_data_method from "../../../tool/component/monitor/data_method/tool_monitor_data_method";
import { stars_player } from "../../module/player/stars_player";
const { ccclass, property } = _decorator;

@ccclass("stars_main")
export class stars_main extends mk.static_view_base {
	data = new (class {
		/** 分数 */
		score_n = 0;
	})();

	protected onLoad(): void {
		// 注册模块（跟随 main_start 释放）
		mk.ui_manage.regis(stars_player, "db://assets/stars/module/player/player.prefab", this);
		mk.ui_manage.regis(stars_star, "db://assets/stars/module/star/star.prefab", this);
	}
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	open(): void {
		// 加载模块
		mk.ui_manage.open(stars_player);
		mk.ui_manage.open(stars_star);

		// 数据到视图
		tool_monitor_data_method.string.默认.on(this.data, "score_n", this.node.getChildByName("Label"), {
			head_s: "得分：",
			tail_s: "",
		});

		stars_bundle.event.on(
			stars_bundle.event.key.generate_star,
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
