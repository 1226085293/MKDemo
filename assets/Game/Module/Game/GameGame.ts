import mk from "mk";
import { _decorator } from "cc";
import GamePlayer from "../Player/GamePlayer";
import { GameStar } from "../Star/GameStar";
import GameBundle from "../../Bundle/GameBundle";
const { ccclass, property } = _decorator;

@ccclass("GameGame")
export class GameGame extends mk.ViewBase {
	data = new (class {
		/** 分数 */
		scoreNum = 0;
	})();
	/* ------------------------------- segmentation ------------------------------- */
	protected open(): void | Promise<void> {
		mk.uiManage.regis(GamePlayer, "Module/Player/GamePlayer", this);
		mk.uiManage.regis(GameStar, "Module/Star/GameStar", this);
		mk.uiManage.open(GamePlayer);
		mk.uiManage.open(GameStar);

		mk.monitor
			.on(this.data, "scoreNum", (newValue) => {
				mk.N(this.node.getChildByName("Label")!).label.string = `得分：${newValue}`;
			})
			?.call(this, this.data.scoreNum);

		GameBundle.event.on(
			GameBundle.event.key.generateStar,
			() => {
				this.data.scoreNum++;
				this.scheduleOnce(() => {
					mk.uiManage.open(GameStar);
				}, 2);
			},
			this
		);
	}
}

export default GameGame;
