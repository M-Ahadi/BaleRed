/**
 * Created by Mojtaba Ahadi
 **/

module.exports = function (RED) {
    const PhotoMessageJson = require("./models/photo_message");
    const VideoMessageJson = require("./models/video_message");
    const DocumentMessageJson = require("./models/document_message");
    const AudioMessageJson = require("./models/audio_message");
    const LocationMessageJson = require("./models/location_message");
    const ContactMessageJson = require("./models/contact_message");
    const PurchaseMessageJson = require("./models/purchase_message");
    const TemplateMessageJson = require("./models/template_message");

    const Platform = require("balebot_plus/index");
    const Bot = Platform.BaleBot;
    const User = Platform.User;
    const Group = Platform.Group;
    const TextMessage = Platform.TextMessage;
    const PhotoMessage = Platform.PhotoMessage;
    const VideoMessage = Platform.VideoMessage;
    const AudioMessage = Platform.AudioMessage;
    const ReceiptMessage = Platform.ReceiptMessage;
    const FileMessage = Platform.FileMessage;
    const LocationMessage = Platform.LocationMessage;
    const ContactMessage = Platform.ContactMessage;
    const TemplateResponseMessage = Platform.TemplateResponseMessage;
    const fs = require('fs');
    const mime = require('mime');
    const sharp = require('sharp');
    const path = require("path");
    const ffmpeg = require('fluent-ffmpeg');
    const audio_metadata = require('music-metadata');
    let options = {
        log: {
            enabled: false,
            level: "DEBUG" // other options: "TRACE", "DEBUG", "WARN", "ERROR", "FATAL"
        },
        requestQueue: {
            fetchInterval: 0, // in ms. the time between sending two consecutive requests.
            retryInterval: 0, // in ms. the time to wait before resending a failed request.
            timeout: 10000, // in ms. the time period to try for sending each request. if the request failed again after this time it will be rejected with the "TIME_OUT" message.
        },
        socket: {
            reconnectInterval: 300 // in ms. when the socket disconnects, waits as much as this time and the tries to reconnect.
        }
    };


    function BaleBotNode(n) {
        RED.nodes.createNode(this, n);

        const self = this;
        this.botname = n.botname;
        this.status = "disconnected";

        this.nodes = [];
        this.user_ids = [];
        if (n.user_ids) {
            this.user_ids = n.user_ids.split(',').map(function (item) {
                return parseInt(item, 10);
            });
        }

        // Activates the bot or returns the already activated bot.
        this.getBaleBot = function () {
            if (!this.baleBot) {
                if (this.credentials) {
                    this.token = this.credentials.token;
                    if (this.token) {
                        this.token = this.token.trim();
                        if (!this.baleBot) {
                            this.baleBot = new Bot(this.token, options);
                            //self.status = "connected";

                            this.baleBot._apiConnection._serverConnection._socketConnection._reconnectingWebSocket.onopen = () => {
                                self.setNodesStatus({fill: "green", shape: "ring", text: "connected"});
                                console.log('Socket Connected!')
                            };

                            this.baleBot._apiConnection._serverConnection._socketConnection._reconnectingWebSocket.onerror = (e) => {
                                self.warn(e);

                                self.abortBot(e, function () {
                                    self.warn("Bot stopped: Fatal Error.");
                                    console.log("Bot stopped: Fatal Error.");
                                });
                            };
                        }
                    }
                }
            }

            return this.baleBot;
        };


        this.on('close', function (done) {
            self.abortBot(done);
        });

        this.abortBot = function (done) {
            // if (self.baleBot._apiConnection._serverConnection._socketConnection._isOnline) {
            self.baleBot._apiConnection._serverConnection._socketConnection._reconnectingWebSocket.close().then(function () {
                self.baleBot = null;
                self.status = "disconnected";
                self.setNodesStatus({fill: "red", shape: "ring", text: "bot stopped. "});
            }).catch((err) => {
                node.send(err)
            });
            // }
            // else {
            //     self.status = "disconnected";
            //     self.setNodesStatus({fill: "red", shape: "ring", text: "bot stopped. "});
            // }
        };

        this.isAuthorizedChat = function (user_id) {
            var isAuthorized = false;
            var length = self.user_ids.length;
            if (length > 0) {
                for (var i = 0; i < length; i++) {
                    var id = self.user_ids[i];
                    if (id === user_id) {
                        isAuthorized = true;
                        break;
                    }
                }
            }

            return isAuthorized;
        };

        this.isAuthorizedUser = function (user) {
            var isAuthorized = false;
            if (self.user_ids.length === 0) {
                return true;
            }
            if (self.user_ids.length > 0) {
                if (self.user_ids.indexOf(user) >= 0) {
                    isAuthorized = true;
                }
            }

            return isAuthorized;
        };


        this.register = function (node) {
            if (self.nodes.indexOf(node) === -1) {
                self.nodes.push(node);
            }
            else {
                self.warn("Node " + node.id + " registered twice at the configuration node: ignoring.");
            }
        };

        this.setNodesStatus = function (status) {
            self.nodes.forEach(function (node) {
                node.status(status);
            });
        }

    }

    RED.nodes.registerType("bale bot", BaleBotNode, {
        credentials: {
            token: {type: "text"}
        }
    });


    function random_file_name() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function format_msg(responder, message) {
        var msg = {payload: {}};
        // console.log(message);
        msg.payload.user_id = responder._peer._id.toString();
        msg.payload.accessHash = responder._peer._accessHash.toString();
        msg.payload.$type = responder._peer.$type;
        msg.effective_msg = message;

        if (message instanceof TextMessage) {
            msg.payload.type = "text";
            msg.payload.content = {};
            msg.payload.content.caption = message.text;
        }
        else if (message instanceof PhotoMessage) {
            msg.payload.type = "photo";
            msg.payload.content = PhotoMessageJson.get_json(message);
            msg.payload.blob = true;
        }
        else if (message instanceof VideoMessage) {
            msg.payload.type = "video";
            msg.payload.content = VideoMessageJson.get_json(message);
            msg.payload.blob = true;
        }
        else if (message instanceof AudioMessage) {
            msg.payload.type = "audio";
            msg.payload.content = AudioMessageJson.get_json(message);
            msg.payload.blob = true;
        }
        else if (message instanceof FileMessage) {
            msg.payload.type = "document";
            msg.payload.content = DocumentMessageJson.get_json(message);
            msg.payload.blob = true;
        }
        else if (message instanceof LocationMessage) {
            msg.payload.type = "location";
            msg.payload.content = LocationMessageJson.get_json(message);
        }
        else if (message instanceof ContactMessage) {
            msg.payload.type = "contact";
            msg.payload.content = ContactMessageJson.get_json(message)
        }
        else if (message instanceof ReceiptMessage) {
            msg.payload.type = "receipt";
            msg.payload.content = PurchaseMessageJson.get_json(message);
        }
        else if (message instanceof TemplateResponseMessage) {
            msg.payload.type = "text";
            msg.payload.content = TemplateMessageJson.get_json(message);
        }
        return msg
    }

// --------------------------------------------------------------------------------------------
    // The input node receives messages from the chat.
    // the message details are stored in the payload
    // user_id
    // accessHash
    // type
    // content
    // The original message is stored next to payload.
    //
    // The message is sent to output 1 if the message is from an authorized user
    // and to output2 if the message is not from an authorized user.
    //
    // text    : content string
    // photo   : content file_id and file_hash and other properties
    // audio   : content file_id and file_hash and other properties
    // document: content file_id and file_hash and other properties
    // video   : content file_id and file_hash and other properties
    // voice   : content file_id and file_hash and other properties
    // location: content is object with latitude and longitude
    // contact : content is full contact object
    function BaleInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.bot = config.bot;

        this.config = RED.nodes.getNode(this.bot);
        if (this.config) {
            this.config.register(node);

            this.status({fill: "red", shape: "ring", text: "disconnected"});
            node.baleBot = this.config.getBaleBot();
            if (node.baleBot) {
                this.status({fill: "green", shape: "ring", text: "connected"});
                node.baleBot.setDefaultCallback((message, responder) => {
                    msg = format_msg(responder, message);

                    if (msg.payload.$type === "Group") {
                        node.send([null, null, msg]);
                    }
                    else if (node.config.isAuthorizedUser(msg.payload.user_id)) {
                        node.send([msg, null, null]);
                    } else {
                        node.send([null, msg, null]);
                    }

                    node.status({fill: "green", shape: "dot", text: "receiving message"});
                    setTimeout(myFunc, 500);

                    function myFunc() {
                        node.status({fill: "green", shape: "ring", text: "connected"});
                    }


                });

            } else {
                node.warn("bot not initialized");
                this.status({fill: "red", shape: "ring", text: "bot not initialized"});
            }
        } else {
            node.warn("config node failed to initialize.");
            this.status({fill: "red", shape: "ring", text: "config node failed to initialize."});
        }

        // this.on("close", function () {
        //     node.baleBot.off('message');
        //     node.status({});
        // });
    }

    RED.nodes.registerType("bale receiver", BaleInNode);


    // --------------------------------------------------------------------------------------------
    // The output node sends to the chat and passes the msg through.
    // The payload needs three fields
    // user_id  : id of the user
    // accessHash : accessHash of the user
    // type    : string type of message to send
    // The type is a string can be any of the following:
    // text content is String
    // photo    content is String
    // audio    content is String
    // document content is String
    // video    content is String
    // location content is an object that contains latitude and longitude
    // contact  content is full contact object

    function baleOutNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.bot = config.bot;

        this.config = RED.nodes.getNode(this.bot);
        if (this.config) {
            this.config.register(node);

            this.status({fill: "red", shape: "ring", text: "disconnected"});

            node.baleBot = this.config.getBaleBot();
            if (node.baleBot) {
                this.status({fill: "green", shape: "ring", text: "connected"});
            } else {
                node.warn("bot not initialized.");
                this.status({fill: "red", shape: "ring", text: "bot not initialized"});
            }
        } else {
            node.warn("config node failed to initialize.");
            this.status({fill: "red", shape: "ring", text: "config node failed to initialize."});
        }

        this.hasContent = function (msg) {
            var hasContent;
            if (msg.payload.content) {
                hasContent = true;
            }
            else {
                node.warn("msg.payload.content is empty");
                hasContent = false;
            }

            return hasContent;
        };

        this.on('input', function (msg) {
            if (!msg.payload.type) {
                msg.payload.type = "text"
            }
            if (msg.payload) {
                if (msg.payload.user_id) {
                    if (msg.payload.type) {

                        var user_id = msg.payload.user_id.toString();
                        var accessHash = msg.payload.accessHash.toString();
                        var user_peer;
                        if (msg.payload.$type === "Group") {
                            user_peer = new Group(user_id, accessHash);
                        }
                        else {
                            user_peer = new User(user_id, accessHash);
                        }
                        var type = msg.payload.type;
                        node.status({fill: "green", shape: "dot", text: "sending message"});
                        setTimeout(myFunc, 500);

                        function myFunc() {
                            node.status({fill: "green", shape: "ring", text: "connected"});
                        }

                        switch (type) {
                            case 'text':
                                if (this.hasContent(msg)) {
                                    // the maximum message size is 4096 so we must split the message into smaller chunks.
                                    var chunkSize = 4000;
                                    var message = msg.payload.content.caption;

                                    var done = false;
                                    do {
                                        var messageToSend;
                                        if (message.length > chunkSize) {
                                            messageToSend = message.substr(0, chunkSize);
                                            message = message.substr(chunkSize);
                                        } else {
                                            messageToSend = message;
                                            done = true;
                                        }
                                        let effective_msg = new TextMessage(messageToSend);
                                        node.baleBot.send(effective_msg, user_peer).then(function () {
                                            msg.effective_msg = effective_msg;
                                            node.send(msg);
                                        }).catch(function (err) {
                                            // markdown error? try plain mode
                                            if (
                                                String(err).includes("can't parse entities in message text:")
                                            ) {

                                                node.baleBot.send(effective_msg, user_peer).then(() => {
                                                    msg.effective_msg = effective_msg;
                                                    node.send(msg);
                                                }).catch((err) => {
                                                    node.send(err)
                                                });
                                                return;
                                            }
                                            throw err;
                                        });

                                    } while (!done)
                                }
                                break;
                            case 'photo':
                                if (this.hasContent(msg)) {
                                    let effective_msg = PhotoMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;
                            case 'audio':

                                if (this.hasContent(msg)) {
                                    let effective_msg = AudioMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;
                            case 'document':
                                if (this.hasContent(msg)) {
                                    let effective_msg = DocumentMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;
                            case 'video':
                                if (this.hasContent(msg)) {
                                    let effective_msg = VideoMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;

                            case "location":
                                if (this.hasContent(msg)) {
                                    let effective_msg = LocationMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;

                            case "contact":
                                if (this.hasContent(msg)) {
                                    let effective_msg = ContactMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;
                            case "money":
                                if (this.hasContent(msg)) {
                                    let effective_msg = PurchaseMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;
                            case "button":
                                if (this.hasContent(msg)) {
                                    let effective_msg = TemplateMessageJson.load_json(msg);
                                    node.baleBot.send(effective_msg, user_peer).then(() => {
                                        msg.effective_msg = effective_msg;
                                        node.send(msg);
                                    }).catch((err) => {
                                        node.send(err)
                                    });
                                }
                                break;
                            default: {

                            }

                        }
                    } else {
                        node.warn("msg.payload.type is empty");
                    }
                } else {
                    node.warn("msg.payload.user_id is empty");
                }

            } else {
                node.warn("msg.payload is empty");
            }
        });
    }

    RED.nodes.registerType("bale sender", baleOutNode);


    // --------------------------------------------------------------------------------------------
    // The output node sends to the chat and passes the msg through.
    // The payload needs two fields
    // file_id    : file_id of the file
    // file_hash : file_hash of the file
    // file_name : name of the file, if it is empty, a random name will be generated

    function baledownloader(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.bot = config.bot;

        this.config = RED.nodes.getNode(this.bot);
        if (this.config) {
            this.config.register(node);

            this.status({fill: "red", shape: "ring", text: "disconnected"});

            node.baleBot = this.config.getBaleBot();
            if (node.baleBot) {
                this.status({fill: "green", shape: "ring", text: "connected"});
            } else {
                node.warn("bot not initialized.");
                this.status({fill: "red", shape: "ring", text: "bot not initialized"});
            }
        } else {
            node.warn("config node failed to initialize.");
            this.status({fill: "red", shape: "ring", text: "config node failed to initialize."});
        }

        var saveDataDir = config.saveDataDir;
        if (!saveDataDir) {
            saveDataDir = "./"
        }

        this.on('input', function (msg) {
            if (msg.payload.blob) {
                if (saveDataDir) {
                    if (msg.payload) {
                        if (msg.payload.content) {
                            if (msg.payload.content.file_id) {
                                if (msg.payload.content.file_hash) {
                                    let file_id = msg.payload.content.file_id;
                                    let file_Hash = msg.payload.content.file_hash;
                                    var file_name = '';
                                    if (msg.payload.content.file_name) {
                                        file_name = msg.payload.content.file_name;
                                    } else {
                                        file_name = random_file_name()
                                    }

                                    if (saveDataDir.endsWith("/")) {
                                        file_name = saveDataDir + file_name;
                                    }
                                    else {
                                        file_name = saveDataDir + "/" + file_name;
                                    }
                                    fs.access(file_name, fs.F_OK, (err) => {
                                        if (err) {
                                            //console.error(err);
                                        }
                                        var file_name2 = file_name.split(".");
                                        let extention = file_name2.pop();
                                        file_name = file_name2.join(".");
                                        file_name = file_name + "_" + random_file_name() + "." + extention

                                    });


                                    node.baleBot.DownloadFile(file_id, file_Hash, 'file', file_name).then(response => {
                                        fs.writeFile(file_name, response, function (err) {
                                            if (err) {
                                                node.warn(err);
                                            }

                                            node.send({
                                                payload: "File downloaded successfully.",
                                                "filename": file_name,
                                                "effective_msg": msg.effective_msg
                                            });
                                        });
                                    }).catch((err) => {
                                        node.warn(err);
                                    });
                                } else {
                                    node.warn("msg.payload.content.file_hash is empty");
                                }
                            } else {
                                node.warn("msg.payload.content.file_id is empty");
                            }
                        } else {
                            node.warn("msg.payload.content is empty");
                        }
                    } else {
                        node.warn("msg.payload is empty");
                    }
                } else {
                    node.warn("saveDataDir is empty");
                }
            }
        });

    }

    RED.nodes.registerType("bale downloader", baledownloader);


    function baleuploader(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.bot = config.bot;

        this.config = RED.nodes.getNode(this.bot);
        if (this.config) {
            this.config.register(node);

            this.status({fill: "red", shape: "ring", text: "disconnected"});

            node.baleBot = this.config.getBaleBot();
            if (node.baleBot) {
                this.status({fill: "green", shape: "ring", text: "connected"});
            } else {
                node.warn("bot not initialized.");
                this.status({fill: "red", shape: "ring", text: "bot not initialized"});
            }
        } else {
            node.warn("config node failed to initialize.");
            this.status({fill: "red", shape: "ring", text: "config node failed to initialize."});
        }

        this.on('input', function (msg) {
                if (msg.filename) {
                    fs.readFile(msg.filename, function (err, imageBuffer) {
                            node.baleBot.UploadFile(imageBuffer, 'file').then(response => {

                                var stats = fs.statSync(msg.filename);
                                var fileSizeInBytes = stats.size;
                                let mime_type = mime.getType(msg.filename);
                                let fileId = response.fileId;
                                let fileAccessHash = response.accessHash;
                                if (!msg.payload){
                                    msg.payload = {}
                                }
                                if (!msg.payload.content){
                                    msg.payload.content = {}
                                }
                                if (msg.payload.content) {
                                    msg.payload.content.file_id = fileId;
                                    msg.payload.content.file_hash = fileAccessHash;
                                    msg.payload.content.mimeType = mime_type;
                                    msg.payload.content.file_size = fileSizeInBytes;
                                    msg.payload.content.file_name = path.basename(msg.filename);
                                }

                                if (!msg.payload.content.caption) {
                                    msg.payload.content.caption = "";
                                }

                                var thumbBuffer = null;

                                if (mime_type.indexOf("video") > -1) {
                                    msg.payload.type = "video";

                                    ffmpeg.ffprobe(msg.filename, function (err, metadata) {
                                        msg.payload.content.duration = metadata.format.duration;
                                        msg.payload.content.width = metadata.streams[1].width;
                                        msg.payload.content.height = metadata.streams[1].height;

                                    });

                                    var temp_path = msg.filename.replace(path.basename(msg.filename), "");
                                    var temp_file_name = random_file_name() + ".png";

                                    ffmpeg(msg.filename)
                                        .on('filenames', function (filenames) {

                                        })
                                        .on('end', function () {
                                            fs.readFile(temp_path + temp_file_name, function (err, imageBuffer) {
                                                thumbBuffer = new Buffer(imageBuffer).toString('base64');
                                                msg.payload.content.thumb = thumbBuffer;
                                                node.send(msg);
                                                fs.unlinkSync(temp_path + temp_file_name)
                                            })

                                        })
                                        .screenshots({
                                            // Will take screens at 20%, 40%, 60% and 80% of the video
                                            timestamps: ['50%'],
                                            filename: temp_file_name,
                                            count: 1,
                                            folder: temp_path
                                        });


                                } else if (mime_type.indexOf("image") > -1) {
                                    msg.payload.type = "photo";
                                    sharp(imageBuffer)
                                        .metadata()
                                        .then(info => {
                                            msg.payload.content.width = info.width;
                                            msg.payload.content.height = info.height;

                                        });
                                    sharp(imageBuffer)
                                        .resize(180, 180, {
                                            fit: sharp.fit.inside,
                                            withoutEnlargement: true
                                        })
                                        .toBuffer()
                                        .then(function (outputBuffer) {
                                            thumbBuffer = new Buffer(outputBuffer).toString('base64');
                                            msg.payload.content.thumb = thumbBuffer;
                                            node.send(msg);
                                        });

                                } else if (mime_type.indexOf("audio") > -1) {
                                    msg.payload.type = "audio";
                                    audio_metadata.parseFile(msg.filename, {native: true})
                                        .then(metadata => {
                                            // console.log(metadata.format.duration);
                                            msg.payload.content.duration = metadata.format.duration;
                                            node.send(msg);
                                        })
                                        .catch(err => {
                                            console.error(err.message);
                                        });


                                } else {
                                    msg.payload.type = "document";
                                    node.send(msg);
                                }

                            });
                        }
                    );

                }

                else {
                    node.warn("msg.payload.filename is empty");
                }

        })
        ;
    }

    RED.nodes.registerType("bale uploader", baleuploader);


    // --------------------------------------------------------------------------------------------
    // The output node sends to the chat and passes the msg through.
    // The payload needs two fields
    // amount    : amount of the money
    // card_number : the card number transfer the money to

    function balemoney(config) {
        RED.nodes.createNode(this, config);
        var node = this;


        var cardNumber = config.cardNumber.toString();
        var amount = config.Amount;

        this.on('input', function (msg) {

            msg.payload.type = "money";
            if (msg.payload.content.card_number) {
                cardNumber = msg.payload.content.card_number.toString();
            }
            if (msg.payload.content.amount) {
                amount = msg.payload.content.amount;
            }

            if (!cardNumber) {
                node.warn("card number is unknown");
            } else {
                if (!amount) {
                    amount = "0"
                }
                if (cardNumber) {
                    msg.payload.content.amount = amount;
                    msg.payload.content.card_number = cardNumber;

                    node.send(msg)
                }
            }

        });

    }

    RED.nodes.registerType("bale money", balemoney);


    function baleutton(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.buttons = config.rules || [];
        this.on('input', function (msg) {
            if (msg.payload) {
                msg.payload.type = "button";
                msg.payload.content.buttons = this.buttons;
                node.send(msg)

            } else {
                node.warn("msg.payload is empty");
            }

        })

    }


    RED.nodes.registerType("bale button", baleutton);


    // --------------------------------------------------------------------------------------------
    // The output node sends to the chat and passes the msg through.
    // The payload needs two fields
    // caption    : caption of the message
    // type : is "text"

    function baletext(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var message = config.message.toString() || "";

        this.on('input', function (msg) {

            if (!msg.payload.content) {
                msg.payload["content"] = {}
            }
            msg.payload.content.caption = message;
            node.send(msg)
        });
    }

    RED.nodes.registerType("bale text", baletext);
}