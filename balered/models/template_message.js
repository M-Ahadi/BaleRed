const Platform = require("balebot_plus/index");
const SimpleTemplate = Platform.SimpleTemplate;
const TemplateMessage = Platform.TemplateMessage;
const TextMessage = Platform.TextMessage;
const PhotoMessage = Platform.PhotoMessage;
const Button = Platform.ButtonElement;

module.exports = {
    get_json : function (message) {
        let content = {};
        content.caption = message._text;
        return content;
    },
    load_json: function (msg) {
        if (!msg.payload.content.hasOwnProperty('buttons')) {
            msg.payload.content.buttons = [];
        }
        var buttons = msg.payload.content.buttons;
        var btn_list = [];
        for (var b in buttons){
            btn_list.push(new Button(buttons[b].button_name, buttons[b].button_value, Number(buttons[b].button_action)));
        }
        if (!msg.payload.content.hasOwnProperty("caption")){
            msg.payload.content.caption = ""
        }
        if (msg.payload.content.hasOwnProperty("thumb")){
            let messageObjOrFileId = msg.payload.content.file_id;
            let file_Hash = msg.payload.content.file_hash;
            let file_name = msg.payload.content.file_name;
            let fileSize = msg.payload.content.file_size;
            let mimeType = msg.payload.content.mimeType;
            let captionText = msg.payload.content.caption;
            let width = msg.payload.content.width;
            let height = msg.payload.content.height;
            let thumb = msg.payload.content.thumb;
            let message =  new PhotoMessage(messageObjOrFileId, file_Hash.toString(), file_name, fileSize, mimeType, captionText, width, height, thumb);
            let simpleTemplate = new SimpleTemplate(message, btn_list);
            return new TemplateMessage(simpleTemplate);
        }
        else{
            let simpleTemplate = new SimpleTemplate(new TextMessage(msg.payload.content.caption), btn_list, "1");

            return new TemplateMessage(simpleTemplate);
        }

    }
};