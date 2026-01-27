import { WebSocket } from "ws";
import GameMessages, { GameMessages_ } from "../assets/Game/Bundle/GameMessages";
import { GlobalData_ } from "./GlobalData";
import globalEvent from "./GlobalEvent";
import NetworkEventTarget from "./NetworkEvent";

/** 游戏房间 */
class GameRoom {
	constructor() {
		this._idNum = GameRoom._roomCreateCountNum++;
		this._initEvent();
		console.log("创建房间：", this._idNum);
	}
	/** 房间列表 */
	private static _roomList: GameRoom[] = [];
	/** 房间创建数量 */
	private static _roomCreateCountNum = 0;
	/** 游戏人数 */
	readonly gamePlayerNum = 2;

	event = new NetworkEventTarget();

	/** 玩家列表 */
	get playerList(): ReadonlyArray<GameRoom_.PlayerData> {
		return this._playerList;
	}
	/** 玩家列表 */
	get isStart(): boolean {
		return this._data.isStart;
	}
	/** 房间 ID */
	get idNum(): number {
		return this._idNum;
	}
	/** 房间创建时间戳 */
	get roomCreateTimeStampNum(): number {
		return this._roomCreateTimeStampNum;
	}

	/** 房间创建时间戳 */
	private _roomCreateTimeStampNum: number = Date.now();
	/** 房间 ID */
	private _idNum: number;
	/** 机器人列表 */
	private _botList: GameRoom_.PlayerData[] = [];
	/** 玩家列表 */
	private _playerList: GameRoom_.PlayerData[] = [];
	/** 观众列表 */
	private _audienceList: GlobalData_.PlayerData[] = [];
	/** 本局数据 */
	private _data = new (class {
		/** 是否已开始 */
		isStart = false;
		/** 游戏循环定时器 */
		gameLoopTimer: any = null;
		/** 帧消息 */
		frameMessageList: GameMessages_.BFrameData[] = [];
		/** 当前帧下标 */
		frameIndexNum = 0;
		/** 定时器 */
		timeoutTimerList: any[] = [];
		/** 定时器2 */
		intervalTimerList: any[] = [];
	})();
	/* ------------------------------- segmentation ------------------------------- */
	/** 获取空闲房间 */
	static getAvailableRoom(): GameRoom {
		// let room = this._roomList.find((v) => v._playerList.length < v.gamePlayerNum && !v.isStart);
		let room = this._roomList[0];

		if (!room) {
			room = new GameRoom();
			(this._roomList as any[]).push(room);

			return room;
		}

		return room;
	}

	/** 获取房间根据ID */
	static getRoomById(idNum_: number): GameRoom | null {
		return this._roomList.find((v) => v._idNum === idNum_) ?? null;
	}

	destroy(): void {
		this._gameEnd();
		globalEvent.targetOff(this);
		this.event.targetOff(this);

		const indexNum = GameRoom._roomList.indexOf(this);

		if (indexNum !== -1) {
			console.log("销毁房间：", this._idNum);
			GameRoom._roomList.splice(indexNum, 1);
		}
	}

	enter(player_: GlobalData_.PlayerData): void {
		if (player_.isBot) {
			return;
		}

		if (this._audienceList.includes(player_)) {
			return;
		}

		this._audienceList.push(player_);

		// 追帧
		if (this.isStart) {
			player_.ws.send(
				JSON.stringify(
					GameMessages.createMessage(GameMessages.key.BGameResume, {
						frameList: this._data.frameMessageList,
					})
				)
			);
		}
	}

	ready(player_: GlobalData_.PlayerData): GameRoom_.PlayerData | null {
		// 已开始
		if (this.isStart) {
			return null;
		}

		let result: GameRoom_.PlayerData | null = null;

		if (player_.isBot) {
			this._botList.push({
				base: player_,
				operateTab: {},
				verifyDataTab: {},
			});

			result = this._botList[this._botList.length - 1];
		} else {
			const audienceIndexNum = this._audienceList.indexOf(player_);

			if (audienceIndexNum === -1) {
				return null!;
			}

			this._audienceList.splice(audienceIndexNum, 1);
			this._playerList.push({
				base: player_,
				operateTab: {},
				verifyDataTab: {},
			});

			result = this._playerList[this._playerList.length - 1];
		}

		this._gameStart();

		return result;
	}

	exit(player_: GlobalData_.PlayerData): void {
		const audienceIndexNum = this._audienceList.indexOf(player_);

		if (audienceIndexNum !== -1) {
			this._audienceList.splice(audienceIndexNum, 1);
		} else {
			const playerIndexNum = this._playerList.findIndex((v) => v.base === player_);

			if (playerIndexNum !== -1) {
				this._playerList.splice(playerIndexNum, 1);
				this._audienceList.push(...this._playerList.splice(0, this._playerList.length).map((v) => v.base));
				this._gameEnd();
			}
		}

		if (!this._playerList.length && !this._audienceList.length) {
			this.destroy();
		}
	}

	broadcast(message_: any): void {
		const message = JSON.stringify(message_);

		if (message_ instanceof GameMessages_.BFrameData) {
			this._data.frameMessageList.push(message_);
		}

		this._playerList.forEach((v) => {
			if (v.base.ws.readyState === WebSocket.OPEN) {
				v.base.ws.send(message);
			}
		});

		this._audienceList.forEach((v) => {
			if (v.ws.readyState === WebSocket.OPEN) {
				v.ws.send(message);
			}
		});
		// console.log(`逻辑帧 ${message_.indexNum}`);
	}

	private _gameStart(): void {
		if (this._data.isStart || this._playerList.length + this._botList.length !== this.gamePlayerNum) {
			return;
		}

		this._data.isStart = true;
		this.broadcast(
			GameMessages.createMessage(GameMessages.key.BGameStart, {
				timeStampNum: Date.now(),
				playerIdNumList: this._playerList.concat(this._botList).map((v) => v.base.idNum),
			})
		);

		this._gameLoop();

		console.log("游戏开始", this._playerList.map((v) => v.base.idNum).join(", "));
	}

	private _gameEnd(): void {
		if (!this._data.isStart) {
			return;
		}

		this._audienceList.forEach((v) => {
			v.ws.send(JSON.stringify(GameMessages.createMessage(GameMessages.key.BGameEnd, {})), { binary: false });
		});

		clearInterval(this._data.gameLoopTimer);
		this._data.timeoutTimerList.forEach((v) => {
			clearTimeout(v);
		});

		this._data.intervalTimerList.forEach((v) => {
			clearInterval(v);
		});

		this._data = new (this._data as any)["constructor"]();
		console.log("游戏结束");
	}

	private _initEvent(): void {
		globalEvent.on(globalEvent.key.playerExit, this._onPlayerExit, this);
		this.event.on(this.event.key.CPlayerReady, this._onCPlayerReady, this);
		this.event.on(this.event.key.CChangeDirection, this._onCChangeDirection, this);
	}

	private _gameLoop(): void {
		const intervalMsNum = 1000 / 30;
		/** 上次广播时间 */
		let previousBroadcastTimestampMsNum = Date.now();
		/** 累计时间 */
		let cumulativeTimeMsNum = 0;

		const gameFrameSyncFunc = (): void => {
			cumulativeTimeMsNum += Date.now() - previousBroadcastTimestampMsNum;
			previousBroadcastTimestampMsNum = Date.now();

			// 未到下一帧
			if (cumulativeTimeMsNum < intervalMsNum) {
				return;
			}

			const loopNum = Math.floor(cumulativeTimeMsNum / intervalMsNum);

			for (let kNum = 0, lenNum = loopNum; kNum < lenNum; ++kNum) {
				this.broadcast(
					GameMessages.createMessage(GameMessages.key.BFrameData, {
						indexNum: this._data.frameIndexNum,
						operateList: this._playerList
							.concat(this._botList)
							.map((v) => {
								const result = [v.operateTab.changeDirection].filter((v) => Boolean(v));

								v.operateTab = {};

								return !result.length
									? null!
									: {
											playerIdNum: v.base.idNum,
											operateList: result,
									  };
							})
							.filter((v) => Boolean(v)),
					})
				);

				this._data.frameIndexNum++;
			}

			cumulativeTimeMsNum -= loopNum * intervalMsNum;
		};

		this._data.gameLoopTimer = setInterval(gameFrameSyncFunc, intervalMsNum * 0.5);
		gameFrameSyncFunc();
	}

	private _onPlayerExit(player_: GlobalData_.PlayerData): void {
		this.exit(player_);
	}

	private _onCPlayerReady(player_: GlobalData_.PlayerData): void {
		this.ready(player_);
	}

	private _onCChangeDirection(player_: GlobalData_.PlayerData, data_: GameMessages_.CChangeDirection): void {
		const playerRoomData = this._playerList.find((v) => v.base === player_);

		if (!playerRoomData) {
			return;
		}

		playerRoomData.operateTab.changeDirection = data_;
	}
}
export namespace GameRoom_ {
	export interface PlayerData {
		/** 基础数据 */
		base: GlobalData_.PlayerData;
		/** 当前帧玩家操作 */
		operateTab: {
			changeDirection?: GameMessages_.CChangeDirection;
		};
		/** 帧验证数据 */
		verifyDataTab: Record<number, string[]>;
	}
}

export default GameRoom;
