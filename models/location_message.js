const Platform = require("balebot_plus/index");
const LocationMessage = Platform.LocationMessage;

module.exports = {

    get_json : function (message) {
        let content = {};
        content.latitude = message._latitude;
        content.longitude = message._longitude;
        return content;
    },
    load_json: function (msg) {
        let messageObjOrFileId = msg.payload.content.latitude;
        let longitude = msg.payload.content.longitude;
        return new LocationMessage(messageObjOrFileId, longitude);
    }
};