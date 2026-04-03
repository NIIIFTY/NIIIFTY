"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var constants_js_1 = require("./lib/constants.js");
var Client = require("@storacha/client");
var Signer = require("@ucanto/principal/ed25519");
var proof_1 = require("@storacha/client/proof");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var principal, client, proof, space, blob, cid, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Loading principal...');
                    principal = Signer.parse(constants_js_1.STORACHA_KEY);
                    return [4 /*yield*/, Client.create({ principal: principal })];
                case 1:
                    client = _a.sent();
                    console.log('Adding space from proof...');
                    return [4 /*yield*/, (0, proof_1.parseProof)(constants_js_1.STORACHA_PROOF)];
                case 2:
                    proof = _a.sent();
                    console.log('Proof delegates:', proof.capabilities.map(function (c) { return c.can; }));
                    return [4 /*yield*/, client.addSpace(proof)];
                case 3:
                    space = _a.sent();
                    return [4 /*yield*/, client.setCurrentSpace(space.did())];
                case 4:
                    _a.sent();
                    console.log('Current space set:', space.did());
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    console.log('Uploading blob...');
                    blob = new Blob(['hello world from NIIIFTY!'], { type: 'text/plain' });
                    return [4 /*yield*/, client.uploadFile(blob)];
                case 6:
                    cid = _a.sent();
                    console.log('UPLOAD SUCCESS!', cid.toString());
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.error('UPLOAD FAILED!');
                    console.error('Error:', err_1.message);
                    if (err_1.cause) {
                        console.error('CAUSE DETAILS:', err_1.cause);
                        console.error('CAUSE MESSAGE:', err_1.cause.message);
                        console.error('CAUSE NAME:', err_1.cause.name);
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main()["catch"](console.error);
