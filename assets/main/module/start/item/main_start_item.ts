import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import tool_monitor_data_method from "../../../../tool/component/monitor/data_method/tool_monitor_data_method";
const { ccclass, property } = _decorator;

@ccclass("main_start_item")
export class main_start_item extends mk.view_base {
	init_data: {
		name_s: string;
		click_f: Function;
	};
	data = new (class {
		/** 展示名称 */
		name_s = "";
	})();
	// 初始化视图
	// create(): void {}
	// 有数据初始化
	init(init_?: typeof this.init_data): void {
		this.data.name_s = this.init_data.name_s;
	}
	// 无数据初始化
	open(): void {
		// 数据到视图
		tool_monitor_data_method.string.默认.on(this.data, "name_s", this.node.getChildByPath("Label"), {
			head_s: "",
			tail_s: "",
		});

		// 监听
		this.node.on(
			cc.Button.EventType.CLICK,
			() => {
				this.init_data.click_f?.();
			},
			this
		);
	}
	// 模块关闭
	// close(): void {}
}
