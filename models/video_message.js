const Platform = require("balebot_plus/index");
const VideoMessage = Platform.VideoMessage;

module.exports = {

    get_json : function (message) {
        let content = {};
        content.caption = message._captionText;
        content.file_id = message._fileId;
        content.file_hash = message._accessHash;
        content.file_name = message._name;
        content.file_size = message._fileSize;
        content.thumb = message._thumb;
        content.width = message._width;
        content.height = message._height;
        content.mimeType = message._mimeType;
        content.duration = message._duration;
        return content;
    },
    load_json: function (msg) {

        let messageObjOrFileId = msg.payload.content.file_id;
        let file_Hash = msg.payload.content.file_hash;
        let file_name = msg.payload.content.file_name;
        let fileSize = msg.payload.content.file_size;
        let mimeType = msg.payload.content.mimeType;
        let captionText = msg.payload.content.caption;
        let duration = msg.payload.content.duration;
        let width = msg.payload.content.width;
        let height = msg.payload.content.height;
        let thumb = msg.payload.content.thumb;
        return new VideoMessage(messageObjOrFileId, file_Hash, file_name, fileSize, mimeType, captionText, width, height, thumb, duration);
    }
};