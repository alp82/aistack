import "./utils/index.mjs";
import localstorage from "./localstorage.mjs";
const DRIVER_NAME = "session-storage";
const driver = (opts = {}) => {
	return {
		...localstorage({
			windowKey: "sessionStorage",
			...opts
		}),
		name: DRIVER_NAME
	};
};
export default driver;
