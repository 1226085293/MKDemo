import { WebSocket } from "ws";
import globalEvent from "./GlobalEvent";

class GlobalData {
	/** 玩家创建数量 */
	private static _playerCreateCountNum = 0;

	/** 玩家列表 */
	get playerList(): ReadonlyArray<GlobalData_.PlayerData> {
		return this._playerList;
	}
	/** 玩家列表 */
	private _playerList: GlobalData_.PlayerData[] = [];
	/* ------------------------------- segmentation ------------------------------- */
	/** 添加玩家 */
	addPlayer(ws_: WebSocket): GlobalData_.PlayerData {
		const player = new GlobalData_.PlayerData({
			ws: ws_,
			idNum: GlobalData._playerCreateCountNum++,
		});

		this._playerList.push(player);

		return player;
	}

	/** 移除玩家 */
	removePlayer(ws_: WebSocket): void {
		const indexNum = this._playerList.findIndex((v) => v.ws === ws_);

		if (indexNum !== -1) {
			globalEvent.emit(globalEvent.key.playerExit, this._playerList[indexNum]);

			this._playerList.splice(indexNum, 1);
		}
	}
}

export namespace GlobalData_ {
	export class PlayerData {
		constructor(init_: Partial<PlayerData>) {
			Object.assign(this, init_);
		}

		ws!: WebSocket;
		/** 玩家 ID */
		idNum!: number;
		/** 机器人 */
		isBot = false;
	}
}

const globalData = new GlobalData();

export default globalData;
