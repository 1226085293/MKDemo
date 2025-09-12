import { _decorator, find } from "cc";
import { EDITOR } from "cc/env";
import mk from "mk";
import { MainMain } from "../Module/Main/MainMain";
const { ccclass, property } = _decorator;

class MainBundle extends mk.Bundle_.BundleManageBase {
	nameStr = "main";

	open(): void | Promise<void> {
		if (EDITOR) {
			return;
		}

		find("Canvas")!.addComponent(MainMain).drive();
	}
}

export default new MainBundle();
