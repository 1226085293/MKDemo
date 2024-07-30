import mk from "mk";
import { stars_event } from "./stars_event";

class stars extends mk.bundle_.bundle_manage_base {
	name_s = "stars";
	event = new mk.event_target<stars_event>();
}

export default new stars();
