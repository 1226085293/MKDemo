import mk from "mk";
import { GameEvent } from "./GameEvent";
import GameGame from "../Module/Game/GameGame";
import { find } from "cc";

class GameBundle extends mk.Bundle_.BundleManageBase {
	nameStr = "Game";
	event = new mk.EventTarget<GameEvent>();

	open(): void | Promise<void> {
		find("Canvas")!.addComponent(GameGame).drive();
	}
}

export default new GameBundle();
