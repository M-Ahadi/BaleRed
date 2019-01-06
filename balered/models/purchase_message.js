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
        if (!msg.payload.content.file_id) {
            msg.payload.content.file_id = "-5690315721366238208";
            msg.payload.content.file_hash = "1014016869";
            msg.payload.content.mimeType = "image/jpeg";
            msg.payload.content.file_size = 5704;
            msg.payload.content.file_name = "balered.jpg";
            msg.payload.content.width = 225;
            msg.payload.content.height = 225;
            msg.payload.content.thumb = "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"
        }

        let photo = PhotoMessageJson.load_json(msg);
        let card_number = msg.payload.content.card_number;
        let amount = msg.payload.content.amount;
        return new PurchaseMessage(photo, card_number.toString(), amount.toString(), new MoneyRequestType().normal);
    }
};