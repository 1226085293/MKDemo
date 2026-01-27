import { EDITOR } from "cc/env";
import mk from "mk";

let gameNetwork!: mk.network.Websocket;

if (!(EDITOR && !(window as any).cc.GAME_VIEW)) {
	const codec = new (class extends mk.CodecBase {
		decode(data: string): any {
			return JSON.parse(data);
		}

		encode(data: any): string {
			return JSON.stringify(data);
		}
	})();

	gameNetwork =
		EDITOR && !(window as any).cc.GAME_VIEW
			? null!
			: new mk.network.Websocket({
					codec: codec,
					// 从消息体解析得到消息号
					parseMessageIdFunc: (data: any) => {
						return data.__id;
					},
					// 从消息体解析得到消息序列号
					parseMessageSequenceFunc: (data: any) => {
						return data.__sequence;
					},
			  });
}

export default gameNetwork;
