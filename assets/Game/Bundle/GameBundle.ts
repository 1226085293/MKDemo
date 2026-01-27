import mk from "mk";
import { GameEvent } from "./GameEvent";
import GameData from "./GameData";
import tool from "../../Tool/Tool";
import GameRenderUnitMove from "../RenderUnit/GameRenderUnitMove";

class GameBundle extends mk.Bundle_.BundleManageBase {
	nameStr = "Game";
	event = new mk.EventTarget<GameEvent>();
	data = mk.dataSharer(GameData);
	/* ------------------------------- segmentation ------------------------------- */
	open(): void {
		tool.frameManage.renderUnitList = [GameRenderUnitMove];
		tool.frameManage.open();
	}

	close(): void {
		tool.frameManage.close();
	}
}

export default new GameBundle();
