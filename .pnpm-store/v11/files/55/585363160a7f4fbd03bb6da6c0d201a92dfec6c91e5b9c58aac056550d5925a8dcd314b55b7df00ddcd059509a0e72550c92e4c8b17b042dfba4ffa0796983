"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhook = exports.WebhookVerificationError = void 0;
const standardwebhooks_1 = require("standardwebhooks");
var standardwebhooks_2 = require("standardwebhooks");
Object.defineProperty(exports, "WebhookVerificationError", { enumerable: true, get: function () { return standardwebhooks_2.WebhookVerificationError; } });
class Webhook {
    constructor(secret, options) {
        this.inner = new standardwebhooks_1.Webhook(secret, options);
    }
    verify(payload, headers_) {
        var _a, _b, _c, _d, _e, _f;
        const headers = {};
        for (const key of Object.keys(headers_)) {
            headers[key.toLowerCase()] = headers_[key];
        }
        headers["webhook-id"] = (_b = (_a = headers["svix-id"]) !== null && _a !== void 0 ? _a : headers["webhook-id"]) !== null && _b !== void 0 ? _b : "";
        headers["webhook-signature"] =
            (_d = (_c = headers["svix-signature"]) !== null && _c !== void 0 ? _c : headers["webhook-signature"]) !== null && _d !== void 0 ? _d : "";
        headers["webhook-timestamp"] =
            (_f = (_e = headers["svix-timestamp"]) !== null && _e !== void 0 ? _e : headers["webhook-timestamp"]) !== null && _f !== void 0 ? _f : "";
        return this.inner.verify(payload, headers);
    }
    sign(msgId, timestamp, payload) {
        return this.inner.sign(msgId, timestamp, payload);
    }
}
exports.Webhook = Webhook;
//# sourceMappingURL=webhook.js.map