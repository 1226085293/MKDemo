import { WebSocket, WebSocketServer } from "ws";
import globalData from "./GlobalData";
import GameRoom, { GameRoom_ } from "./GameRoom";
import GameMessages, { GameMessages_ } from "../assets/Game/Bundle/GameMessages";

const wss = new WebSocketServer({ port: 8849 });

wss.on("connection", function connection(ws) {
	const player = globalData.addPlayer(ws);
	let room: GameRoom = null!;
	let playerRoomData: GameRoom_.PlayerData | null;

	console.log(`客户端 ID ${player.idNum} 链接, 玩家总数量：${globalData.playerList.length}`);

	ws.on("close", () => {
		globalData.removePlayer(ws);

		console.log(`客户端 ID ${player.idNum} 断开, 玩家总数量：${globalData.playerList.length}`);
	});

	ws.on("message", async function message(data) {
		const message = JSON.parse(Buffer.from(data as any).toString());
		const messageTypeStr = message.__id;
		const messageSequenceNum = message.__sequence;
		let result: any = null;

		if (messageTypeStr === GameMessages.key.CJoinRoom) {
			room = GameRoom.getAvailableRoom();
			room.enter(player);
			result = GameMessages.createMessage(
				GameMessages.key.SJoinRoom,
				{
					playerIdNum: player.idNum,
					playerNum: room.gamePlayerNum,
				},
				{
					sequenceNum: messageSequenceNum,
				}
			);
		} else if (room) {
			switch (messageTypeStr) {
				case GameMessages.key.CVerifyData: {
					const data = message as GameMessages_.CVerifyData;

					if (!room.isStart) {
						return;
					}

					if (!playerRoomData) {
						playerRoomData = room.playerList.find((v) => v.base === player)!;
					}

					playerRoomData.verifyDataTab[data.indexNum] = data.dataStrList;
					for (const v of room.playerList) {
						if (v === playerRoomData || !v.verifyDataTab[data.indexNum]) {
							continue;
						}

						const indexNum = v.verifyDataTab[data.indexNum].findIndex((vStr, kNum) => vStr !== data.dataStrList[kNum]);

						if (indexNum !== -1) {
							// v.verifyDataTab[data.indexNum][indexNum]
							// data.dataStrList[indexNum]

							console.error("数据出现差异", data.indexNum, Math.floor(data.indexNum / 60));
							// eslint-disable-next-line no-debugger
							// debugger;
						}
					}

					break;
				}
			}
		}

		const resultList = !room ? [] : await room.event.request(messageTypeStr, player, message);

		if (!result && resultList.length === 1 && resultList[0] !== undefined) {
			result = resultList[0];
		}

		// 回信
		if (result && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(result), { binary: false });
		}
	});
});

console.log("启动成功");
