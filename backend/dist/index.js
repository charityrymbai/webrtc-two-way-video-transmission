"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const server = https_1.default.createServer({
    cert: fs_1.default.readFileSync(path_1.default.join(__dirname, "../certificate.pem")),
    key: fs_1.default.readFileSync(path_1.default.join(__dirname, "../private-key.pem")),
});
const wss = new ws_1.WebSocketServer({ server });
let senderSocket = null;
let receiverSocket = null;
wss.on("connection", function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", function message(data) {
        const message = JSON.parse(data);
        if (message.type === "sender") {
            senderSocket = ws;
            console.log("Sender set");
        }
        else if (message.type === "receiver") {
            receiverSocket = ws;
            console.log("Receiver set");
        }
        else if (message.type === "createOffer") {
            receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }));
            console.log("Offer sent");
        }
        else if (message.type === "createAnswer") {
            senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }));
            console.log("Answer sent");
        }
        else if (message.type === "iceCandidate") {
            if (senderSocket === ws) {
                receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
                console.log("Ice candidate sent");
            }
            else {
                senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
                console.log("Ice candidate sent");
            }
        }
    });
});
server.listen(8080);
