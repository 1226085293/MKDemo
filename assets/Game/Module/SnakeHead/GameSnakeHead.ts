import mk from "mk";
import { _decorator, Color, instantiate, Node, v3, Vec3 } from "cc";
import GameBundle from "../../Bundle/GameBundle";
import tool from "db://assets/Tool/Tool";
const { ccclass, property } = _decorator;

@ccclass("GameSnakeHead")
export class GameSnakeHead extends mk.ViewBase {
	@property({ displayName: "昵称", type: Node })
	nickNode!: Node;

	initData!: {
		/** 玩家Id */
		playerIdNum: number;
		/** 方向 */
		directionV3: Vec3;
		/** 格子位置 */
		positionV3: Vec3;
	};
	data = new (class {
		/** 方向 */
		directionV3 = v3();
		/** 格子位置 */
		positionV3 = v3();
		/** 尾巴节点 */
		tailNodeList: { node: Node; positionV3: Vec3 }[] = [];
	})();
	/* ------------------------------- segmentation ------------------------------- */
	protected create(): void {
		this.node.worldPosition = v3(99999, 99999, 0);
	}

	init(data_?: this["initData"] | undefined): void {
		// 清理尾巴
		this.data.tailNodeList.forEach((v) => {
			v.node.destroy();
		});

		this.data.tailNodeList = [];

		this.data.positionV3 = this.initData.positionV3.clone();
		this.data.directionV3 = this.initData.directionV3.clone();
		this.node.worldPosition = v3(
			GameBundle.data.mapOffsetV3.x + (this.initData.positionV3.x + 1) * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2,
			GameBundle.data.mapOffsetV3.y + (this.initData.positionV3.y + 1) * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2
		);

		mk.N(this.node).width = GameBundle.data.mapUnitSizeNum - 1;
		mk.N(this.node).height = GameBundle.data.mapUnitSizeNum - 1;
		mk.N(this.nickNode).label.string = GameBundle.data.self === this ? "自己" : `${this.initData.playerIdNum}`;
		mk.N(this.node).sprite.color = [Color.RED, Color.BLUE, Color.WHITE, Color.YELLOW][this.initData.playerIdNum % 4];
	}

	/** 前进 */
	step(): void {
		// 更新身体
		if (this.data.tailNodeList.length) {
			this.data.tailNodeList[this.data.tailNodeList.length - 1].positionV3 = this.data.positionV3.clone();
			this.data.tailNodeList.unshift(this.data.tailNodeList.pop()!);
			this.data.tailNodeList[0].node.worldPosition = v3(
				GameBundle.data.mapOffsetV3.x +
					(this.data.tailNodeList[0].positionV3.x + 1) * GameBundle.data.mapUnitSizeNum +
					GameBundle.data.mapUnitSizeNum / 2,
				GameBundle.data.mapOffsetV3.y +
					(this.data.tailNodeList[0].positionV3.y + 1) * GameBundle.data.mapUnitSizeNum +
					GameBundle.data.mapUnitSizeNum / 2
			);
		}

		// 更新头部
		this.data.positionV3.add(this.data.directionV3);
		this.node.worldPosition = v3(
			GameBundle.data.mapOffsetV3.x + (this.data.positionV3.x + 1) * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2,
			GameBundle.data.mapOffsetV3.y + (this.data.positionV3.y + 1) * GameBundle.data.mapUnitSizeNum + GameBundle.data.mapUnitSizeNum / 2
		);

		// 碰到自己身体/其他人身体或头
		{
			for (const v of mk.uiManage.get([GameSnakeHead])) {
				const isCollision = v.data.tailNodeList.some((v2) => Vec3.equals(this.data.positionV3, v2.positionV3));

				// 碰到身体
				if (isCollision) {
					this.born();

					return;
				}

				// 碰到其他人的头
				if (v !== this && Vec3.equals(this.data.positionV3, v.data.positionV3)) {
					if (this.data.tailNodeList.length > v.data.tailNodeList.length) {
						v.born();
					} else if (this.data.tailNodeList.length < v.data.tailNodeList.length) {
						this.born();
					} else {
						v.born();
						this.born();
					}

					return;
				}
			}
		}

		// 碰到食物
		{
			const foodIndexNum = GameBundle.data.foodPositionList.findIndex((v2) => v2.positionV3.equals(this.data.positionV3));

			if (foodIndexNum >= 0) {
				this.grow();
				// 销毁食物
				GameBundle.data.foodPositionList[foodIndexNum].node.destroy();
				GameBundle.data.foodPositionList.splice(foodIndexNum, 1);

				// 生成新食物
				GameBundle.data.generateFood();
			}
		}

		// 碰到墙壁，重新开始
		if (
			this.data.positionV3.x < 0 ||
			this.data.positionV3.x >= GameBundle.data.mapSizeV3.x - 2 ||
			this.data.positionV3.y < 0 ||
			this.data.positionV3.y >= GameBundle.data.mapSizeV3.y - 2
		) {
			this.born();

			return;
		}
	}

	/** 成长 */
	grow(): void {
		const tailNode = instantiate(this.node);

		tailNode.parent = this.node.parent;
		tailNode.children[0].active = false;
		mk.N(tailNode).width = mk.N(this.node).width * 0.8;
		mk.N(tailNode).height = mk.N(this.node).height * 0.8;
		this.data.tailNodeList.push({ node: tailNode, positionV3: this.data.positionV3.clone().add(this.data.directionV3.clone().negative()) });
		// 更新位置
		tailNode.worldPosition = v3(
			GameBundle.data.mapOffsetV3.x +
				(this.data.positionV3.x - this.data.directionV3.x + 1) * GameBundle.data.mapUnitSizeNum +
				GameBundle.data.mapUnitSizeNum / 2,
			GameBundle.data.mapOffsetV3.y +
				(this.data.positionV3.y - this.data.directionV3.y + 1) * GameBundle.data.mapUnitSizeNum +
				GameBundle.data.mapUnitSizeNum / 2
		);
	}

	/** 出生 */
	born(): void {
		const directionNum = Math.floor(tool.frameManage.random() * 4);

		this.init({
			playerIdNum: this.initData.playerIdNum,
			directionV3: v3(directionNum === 0 ? 1 : directionNum === 1 ? -1 : 0, directionNum === 2 ? 1 : directionNum === 3 ? -1 : 0, 0),
			positionV3: v3(
				Math.floor(tool.frameManage.random() * (GameBundle.data.mapSizeV3.x - 2)),
				Math.floor(tool.frameManage.random() * (GameBundle.data.mapSizeV3.y - 2)),
				0
			),
		});
	}
}

export default GameSnakeHead;
