import { _decorator, ProgressBar } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("MainMain")
export class MainMain extends mk.StaticViewBase {
	@property(ProgressBar)
	progressComp!: ProgressBar;

	protected create(): void {
		this.progressComp.progress = 0;
	}

	protected open(): void | Promise<void> {
		// 进入 Game 场景
		mk.bundle.loadScene("Game", {
			bundleStr: "Game",
			progressCallbackFunc: (currentNum, totalNum) => {
				this.progressComp.progress = currentNum / totalNum;
			},
		});
	}
}
