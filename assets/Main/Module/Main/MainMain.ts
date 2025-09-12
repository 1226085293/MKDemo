import { _decorator, ProgressBar } from "cc";
import GlobalConfig from "GlobalConfig";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("MainMain")
export class MainMain extends mk.StaticViewBase {
	private _progressComp!: ProgressBar;

	protected create(): void {
		this._progressComp = this.node.getChildByPath("SpriteSplash/ProgressBar")!.getComponent(ProgressBar)!;
		this._progressComp.progress = 0;
	}

	protected open(): void | Promise<void> {
		// 进入 Game 场景
		mk.bundle.loadScene("Game", {
			bundleStr: GlobalConfig.Asset.bundle.Game,
			progressCallbackFunc: (currentNum, totalNum) => {
				this._progressComp.progress = currentNum / totalNum;
			},
		});
	}
}
