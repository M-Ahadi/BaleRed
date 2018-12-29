const Platform = require("balebot_plus/index");
const FileMessage = Platform.FileMessage;

module.exports = {

    get_json : function (message) {
        let content = {};
        content.caption = message._captionText;
        content.file_id = message._fileId;
        content.file_hash = message._accessHash;
        content.file_name = message._name;
        content.file_size = message._fileSize;
        content.mimeType = message._mimeType;
        return content;
    },
    load_json: function (msg) {

        let messageObjOrFileId = msg.payload.content.file_id;
        let file_Hash = msg.payload.content.file_hash;
        let file_name = msg.payload.content.file_name;
        let fileSize = msg.payload.content.file_size;
        let mimeType = msg.payload.content.mimeType;
        let captionText = msg.payload.content.caption;
        return new FileMessage(messageObjOrFileId, file_Hash, file_name, fileSize, mimeType, captionText);
    }
};