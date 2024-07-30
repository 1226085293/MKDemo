import mk from "mk";
import { EDITOR } from "cc/env";

class main extends mk.bundle_.bundle_manage_base {
	name_s = "main";
	event = new mk.event_target<any>();

	open(): void {
		if (EDITOR) {
			return;
		}
	}
}

export default new main();
