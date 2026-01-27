import mk from "mk";
import { _decorator, find, Input, input, KeyCode, v3, Vec3 } from "cc";
import { GameWall } from "../Wall/GameWall";
import GameBundle from "../../Bundle/GameBundle";
import GlobalConfig from "GlobalConfig";
import gameNetwork from "../../Bundle/GameNetwort";
import GameMessages, { GameMessages_ } from "../../Bundle/GameMessages";
import tool from "db://assets/Tool/Tool";
import GameSnakeHead from "../SnakeHead/GameSnakeHead";
const { ccclass, property } = _decorator;

@ccclass("GameGame")
export class GameGame extends mk.StaticViewBase {
	data = new (class {})();
	/* ------------------------------- segmentation ------------------------------- */
	protected async open(): Promise<void | Promise<void>> {
		mk.uiManage.regis(GameSnakeHead, "Module/SnakeHead/GameSnakeHead", this, {
			isRepeat: true,
		});

		mk.uiManage.regis(GameWall, "Module/Wall/GameWall-墙壁", this, {
			isRepeat: true,
			parent: () => find("Canvas/墙壁根节点")!,
		});

		// 确定游戏地图大小
		GameBundle.data.mapSizeV3.set(
			Math.floor(GlobalConfig.View.originalDesignSize.width / GameBundle.data.mapUnitSizeNum),
			Math.floor(GlobalConfig.View.originalDesignSize.height / GameBundle.data.mapUnitSizeNum),
			0
		);

		// 确定偏移位置
		GameBundle.data.mapOffsetV3.set(
			(GlobalConfig.View.originalDesignSize.width - GameBundle.data.mapSizeV3.x * GameBundle.data.mapUnitSizeNum) / 2,
			(GlobalConfig.View.originalDesignSize.height - GameBundle.data.mapSizeV3.y * GameBundle.data.mapUnitSizeNum) / 2,
			0
		);

		// 生成围墙
		for (let kNum = 0; kNum < GameBundle.data.mapSizeV3.x; kNum++) {
			for (let k2Num = 0; k2Num < GameBundle.data.mapSizeV3.y; k2Num++) {
				if (kNum === 0 || kNum === GameBundle.data.mapSizeV3.x - 1 || k2Num === 0 || k2Num === GameBundle.data.mapSizeV3.y - 1) {
					mk.uiManage.open(GameWall, {
						init: v3(
							GameBundle.data.mapOffsetV3.x + kNum * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2,
							GameBundle.data.mapOffsetV3.y + k2Num * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2
						),
					});
				}
			}
		}

		await gameNetwork.connect("http://localhost:8849");
		// 游戏开始
		gameNetwork.message.on(GameMessages.key.BGameStart, this._onBGameStart, this);
		// 游戏结束
		gameNetwork.message.on(GameMessages.key.BGameEnd, this._onBGameEnd, this);
		// 游戏循环
		gameNetwork.message.on(GameMessages.key.BFrameData, this._onBFrameData, this);
		// 加入房间
		GameBundle.data.roomInfo = await gameNetwork.message.request(GameMessages.createMessage(GameMessages.key.CJoinRoom, {}));

		if (!GameBundle.data.roomInfo || !this.valid) {
			return;
		}

		// 初始化玩家
		for (let vNum = 0; vNum < GameBundle.data.roomInfo.playerNum; vNum++) {
			await mk.uiManage.open(GameSnakeHead);

			if (!this.valid) {
				return;
			}
		}

		// 初始化游戏
		await Promise.all(GameBundle.event.request(GameBundle.event.key.initGame));
		// 监听按键
		input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
		// 准备游戏
		gameNetwork.message.send(GameMessages.createMessage(GameMessages.key.CPlayerReady, {}));
	}

	private async _onBGameStart(data_: GameMessages_.BGameStart): Promise<void> {
		// 保存对局信息
		GameBundle.data.gameInfo = data_;
		// 初始化随机种子
		tool.frameManage.setRandomSeed(GameBundle.data.gameInfo.timeStampNum);

		mk.uiManage.get([GameSnakeHead]).forEach((v, kNum) => {
			const directionNum = Math.floor(tool.frameManage.random() * 4);

			if (data_.playerIdNumList[kNum] === GameBundle.data.roomInfo.playerIdNum) {
				GameBundle.data.self = v;
			}

			v.init({
				playerIdNum: data_.playerIdNumList[kNum],
				directionV3: v3(directionNum === 0 ? 1 : directionNum === 1 ? -1 : 0, directionNum === 2 ? 1 : directionNum === 3 ? -1 : 0, 0),
				positionV3: v3(
					Math.floor(tool.frameManage.random() * (GameBundle.data.mapSizeV3.x - 2)),
					Math.floor(tool.frameManage.random() * (GameBundle.data.mapSizeV3.y - 2)),
					0
				),
			});
		});
	}

	private _onBGameEnd(data_: GameMessages_.BGameEnd): void {
		tool.frameManage.reset();
	}

	private _onBFrameData(data_: GameMessages_.BFrameData): void {
		if (data_.operateList.length) {
			tool.frameManage.addTask(data_.indexNum, () => {
				data_.operateList.forEach((v) => {
					const player = mk.uiManage.get([GameSnakeHead]).find((v2) => v2.initData.playerIdNum === v.playerIdNum)!;

					v.operateList.forEach((v2) => {
						switch (GameMessages.getMessageId(v2)) {
							// 改变方向
							case GameMessages.key.CChangeDirection: {
								const data = v2 as GameMessages_.CChangeDirection;

								player.data.directionV3.set(data.directionTab.xNum, data.directionTab.yNum, 0);
								break;
							}
						}
					});
				});
			});
		}

		tool.frameManage.step(data_.indexNum);
	}

	private _onKeyDown(event_: any): void {
		let changeDirection: GameMessages_.CChangeDirection | null = null;

		switch (event_.keyCode) {
			case KeyCode.ARROW_UP:
				changeDirection = {
					directionTab: { xNum: 0, yNum: 1 },
				};

				break;
			case KeyCode.ARROW_DOWN:
				changeDirection = {
					directionTab: { xNum: 0, yNum: -1 },
				};

				break;
			case KeyCode.ARROW_LEFT:
				changeDirection = {
					directionTab: { xNum: -1, yNum: 0 },
				};

				break;
			case KeyCode.ARROW_RIGHT:
				changeDirection = {
					directionTab: { xNum: 1, yNum: 0 },
				};

				break;
		}

		if (!changeDirection) {
			return;
		}

		const newDirectionV3 = v3(changeDirection.directionTab.xNum, changeDirection.directionTab.yNum);

		// 相同或相反方向
		if (
			Vec3.equals(newDirectionV3, GameBundle.data.self.data.directionV3) ||
			Vec3.equals(newDirectionV3.negative(), GameBundle.data.self.data.directionV3)
		) {
			return;
		}

		gameNetwork.message.send(GameMessages.createMessage(GameMessages.key.CChangeDirection, changeDirection));
	}
}

export default GameGame;
