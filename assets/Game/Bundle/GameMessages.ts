export namespace GameMessages_ {
	/** 改变方向 */
	export class CChangeDirection {
		/** 方向 */
		directionTab!: { xNum: number; yNum: number };
	}

	/** 加入房间 */
	export class CJoinRoom {}

	/** 加入房间返回 */
	export class SJoinRoom {
		playerIdNum!: number;
		/** 玩家人数 */
		playerNum!: number;
	}

	/** 玩家准备 */
	export class CPlayerReady {}

	/** 玩家准备返回 */
	export class SPlayerReady {}

	/** 验证数据 */
	export class CVerifyData {
		/** 帧下标 */
		indexNum!: number;
		/** 数据 */
		dataStrList!: string[];
	}

	/** 游戏开始 */
	export class BGameStart {
		/** 时间戳 */
		timeStampNum!: number;
		/** 玩家ID列表 */
		playerIdNumList!: number[];
	}

	/** 游戏结束 */
	export class BGameEnd {}

	/** 重连 */
	export class BGameResume {
		frameList: BFrameData[] = [];
	}

	/** 帧数据 */
	export class BFrameData {
		/** 帧下标 */
		indexNum!: number;
		/** 玩家操作列表 */
		operateList!: { playerIdNum: number; operateList: any[] }[];
	}
}

class GameMessages {
	messageSequence = 0;
	key: { [k in keyof typeof GameMessages_]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});
	/* ------------------------------- segmentation ------------------------------- */
	createMessage<T extends keyof typeof GameMessages_, T2 extends (typeof GameMessages_)[T]["prototype"]>(
		type_: T,
		data_: T2,
		config_?: {
			sequenceNum: number;
		}
	): T2 {
		(data_ as any)["__id"] = type_;
		(data_ as any)["__sequence"] = config_?.sequenceNum ?? this.messageSequence++;

		return data_;
	}

	getMessageId(data_: any): string {
		return data_["__id"] ?? "";
	}
}

export default new GameMessages();
