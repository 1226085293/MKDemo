import mk from "mk";
import tool from "../../Tool/Tool";
import GameSnakeHead from "../Module/SnakeHead/GameSnakeHead";
import { Prefab } from "cc";
import GameBundle from "../Bundle/GameBundle";

class GameRenderUnitMove extends tool.FrameManage_.RenderUnit {
	/** 移动间隔(秒) */
	private readonly _moveIntervalSNum = 1 / 5;
	/** 累计时间 */
	private _accumulateTimeNum = 0;
	/* ------------------------------- segmentation ------------------------------- */
	init(): void {
		GameBundle.event.on(GameBundle.event.key.initGame, this._onInitGame, this);
	}

	update(dtNum_: number, realDtNum_: number): void {
		this._accumulateTimeNum += dtNum_;

		if (this._accumulateTimeNum > this._moveIntervalSNum) {
			this._accumulateTimeNum -= this._moveIntervalSNum;

			mk.uiManage.get([GameSnakeHead]).forEach((v) => {
				// 移动
				v.step();
			});
		}
	}

	destroy(): void {
		GameBundle.event.targetOff(this);
	}

	/* ------------------------------- segmentation ------------------------------- */
	private async _onInitGame(): Promise<void> {
		GameBundle.data.foodPrefab = (await mk.asset.get("Module/Food/GameFood", Prefab, GameBundle))!;
		// 加载食物
		GameBundle.data.generateFood();
	}
}

export default new GameRenderUnitMove();
