const Platform = require("balebot_plus/index");
const PurchaseMessage = Platform.PurchaseMessage;
const PhotoMessageJson = require("./photo_message");
const MoneyRequestType=Platform.MoneyRequestType;

module.exports = {

    get_json : function (message) {
        let content = {};
        content.msgUID = message._transferInfo.get("msgUID");
        content.payer = message._transferInfo.get("payer");
        content.receiver = message._transferInfo.get("receiver");
        content.traceNo = message._transferInfo.get("traceNo");
        content.amount = message._transferInfo.get("date");
        content.date = message._transferInfo.get("date");
        content.receiptType = message._transferInfo.get("receiptType");
        content.regarding = message._transferInfo.get("regarding");
        content.responseCode = message._transferInfo.get("responseCode");
        content.msgPeerId = message._transferInfo.get("msgPeerId");
        content.msgRid = message._transferInfo.get("msgRid");
        content.msgDate = message._transferInfo.get("msgDate");
        content.requestId = message._transferInfo.get("requestId");
        content.msgPeerType = message._transferInfo.get("msgPeerType");
        return content;
    },
    load_json: function (msg) {

        let photo = PhotoMessageJson.load_json(msg);
        let card_number = msg.payload.content.card_number;
        let amount = msg.payload.content.amount;
        return new PurchaseMessage(photo, card_number.toString(), amount.toString(), new MoneyRequestType().normal);
    }
};