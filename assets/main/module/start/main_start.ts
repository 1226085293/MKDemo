import { _decorator } from "cc";
import mk from "mk";
import global_config from "global_config";
import { main_start_item } from "./item/main_start_item";
import tool_monitor_data_method from "../../../tool/component/monitor/data_method/tool_monitor_data_method";
const { ccclass, property } = _decorator;

@ccclass("main_start")
export class main_start extends mk.static_view_base {
	data = new (class {
		list_as: (typeof main_start_item.prototype.init_data)[] = [];
	})();
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	// init(init_?: typeof this.init_data): void {}
	// 无数据初始化
	async open(): Promise<void> {
		console.log("open");
		// 数据到视图
		await tool_monitor_data_method.array.默认.on(
			this.data,
			"list_as",
			this.node.getChildByName("Layout"),
			new tool_monitor_data_method.array.默认.ccclass_params()
		);

		// 更新数据
		this.data.list_as.push({
			name_s: "摘星星",
			click_f: () => {
				this._log.log("点击摘星星");
				mk.bundle.load_scene("stars_main", {
					bundle_s: global_config.asset.bundle.stars,
				});
			},
		});
	}
	// 模块关闭
	// close(): void {}
}
