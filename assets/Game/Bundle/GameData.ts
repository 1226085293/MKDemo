import { Canvas, director, instantiate, Node, Prefab, v3, Vec3 } from "cc";
import { GameMessages_ } from "./GameMessages";
import mk from "mk";
import tool from "../../Tool/Tool";
import GameBundle from "./GameBundle";
import GameSnakeHead from "../Module/SnakeHead/GameSnakeHead";

class GameData {
	/** 地图单位大小 */
	mapUnitSizeNum = 35;
	/** 地图大小（格子单位） */
	mapSizeV3 = v3();
	/** 地图偏移位置 */
	mapOffsetV3 = v3();
	/** 房间信息 */
	roomInfo!: GameMessages_.SJoinRoom;
	/** 对局信息 */
	gameInfo!: GameMessages_.BGameStart;
	/** 自己 */
	self!: GameSnakeHead;
	/** 食物预制体 */
	foodPrefab!: Prefab;
	/** 食物位置列表（两个） */
	foodPositionList: { node: Node; positionV3: Vec3 }[] = [];
	/* ------------------------------- segmentation ------------------------------- */
	/** 生成食物 */
	generateFood(): void {
		while (this.foodPositionList.length < 2) {
			const positionV3 = new Vec3(
				Math.floor(tool.frameManage.random() * (GameBundle.data.mapSizeV3.x - 2)),
				Math.floor(tool.frameManage.random() * (GameBundle.data.mapSizeV3.y - 2)),
				0
			);

			if (!this.foodPositionList.find((v) => v.positionV3.equals(positionV3))) {
				const node = instantiate(GameBundle.data.foodPrefab);

				node.parent = director.getScene()!.getComponentInChildren(Canvas)!.node!;
				mk.N(node).width = GameBundle.data.mapUnitSizeNum * 0.5;
				mk.N(node).height = GameBundle.data.mapUnitSizeNum * 0.5;
				node.angle = 45;
				node.worldPosition = new Vec3(
					GameBundle.data.mapOffsetV3.x + (positionV3.x + 1) * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2,
					GameBundle.data.mapOffsetV3.y + (positionV3.y + 1) * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2,
					0
				);

				this.foodPositionList.push({ node, positionV3 });
			}
		}
	}
}

export default GameData;
