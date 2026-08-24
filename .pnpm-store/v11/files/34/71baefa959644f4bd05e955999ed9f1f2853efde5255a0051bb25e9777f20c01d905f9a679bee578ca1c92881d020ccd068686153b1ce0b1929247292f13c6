"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTask = void 0;
const backgroundTaskOut_1 = require("../models/backgroundTaskOut");
const listResponseBackgroundTaskOut_1 = require("../models/listResponseBackgroundTaskOut");
const request_1 = require("../request");
class BackgroundTask {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    list(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task");
        request.setQueryParams({
            status: options === null || options === void 0 ? void 0 : options.status,
            task: options === null || options === void 0 ? void 0 : options.task,
            limit: options === null || options === void 0 ? void 0 : options.limit,
            iterator: options === null || options === void 0 ? void 0 : options.iterator,
            order: options === null || options === void 0 ? void 0 : options.order,
        });
        return request.send(this.requestCtx, listResponseBackgroundTaskOut_1.ListResponseBackgroundTaskOutSerializer._fromJsonObject);
    }
    listByEndpoint(options) {
        return this.list(options);
    }
    get(taskId) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task/{task_id}");
        request.setPathParam("task_id", taskId);
        return request.send(this.requestCtx, backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject);
    }
}
exports.BackgroundTask = BackgroundTask;
//# sourceMappingURL=backgroundTask.js.map