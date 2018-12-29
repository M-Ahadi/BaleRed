const Platform = require("balebot_plus/index");
const ContactMessage = Platform.ContactMessage;

module.exports = {

    get_json : function (message) {
        let content = {};
        content.name = message._name;
        content.emails = message._emails;
        content.phones = message._phones;
        return content;
    },
    load_json: function (msg) {
        let messageObjOrFileId = msg.payload.content.name;
        let emails = msg.payload.content.emails;
        let phones = msg.payload.content.phones;
        return new ContactMessage(messageObjOrFileId, emails, phones);
    }
};