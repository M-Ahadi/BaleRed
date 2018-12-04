/**
 * Created by Mojtaba Ahadi
 **/
//todo handle bale cannot connect to the server and show proper status
//todo add purchase handler
//todo add module for money request
//todo add module for template message
//todo make it compatible to mix buttons with photos

module.exports = function (RED) {
    const Platform = require("balebot/index");
    const Bot = Platform.BaleBot;
    const User = Platform.User;
    const TextMessage = Platform.TextMessage;
    const PhotoMessage = Platform.PhotoMessage;
    const VideoMessage = Platform.VideoMessage;
    const AudioMessage = Platform.AudioMessage;
    const ReceiptMessage = Platform.ReceiptMessage;
    const TemplateMessage = Platform.TemplateMessage;
    const PurchaseMessage = Platform.PurchaseMessage;
    const FileMessage = Platform.FileMessage;
    const LocationMessage = Platform.LocationMessage;
    const ContactMessage = Platform.ContactMessage;

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
                            self.status = "connected";

                            this.baleBot._apiConnection._serverConnection._socketConnection._reconnectingWebSocket.onopen = () => {
                                self.setNodesStatus({fill: "green", shape: "ring", text: "connected" });
                                console.log('Socket Connected!')
                            };

                            this.baleBot._apiConnection._serverConnection._socketConnection._reconnectingWebSocket.onerror = (e) => {
                                self.warn(e);

                                self.abortBot(e, function () {
                                    self.warn("Bot stopped: Fatal Error.");
                                });
                            };
                        }
                    }
                }
            }

            return this.baleBot;
        };


        this.on('close', function (done) {
            self.abortBot("closing", done);
        });

        this.abortBot = function (hint, done) {
            if (self.baleBot._apiConnection._serverConnection._socketConnection._isOnline) {
                self.baleBot._apiConnection._serverConnection._socketConnection._reconnectingWebSocket.close().then(function () {
                    self.baleBot = null;
                    self.status = "disconnected";
                    self.setNodesStatus({fill: "red", shape: "ring", text: "bot stopped. " });
                    done();
                })
            }
            else {
                self.status = "disconnected";
                self.setNodesStatus({fill: "red", shape: "ring", text: "bot stopped. " });
                done();
            }
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
                    var msg = {payload: {}};
                    msg.payload.user_id = responder._peer._id;
                    msg.payload.accessHash = responder._peer._accessHash;
                    msg.payload.$type = responder._peer.$type;
                    msg.payload.effective_msg = message;

                    if (message instanceof TextMessage) {
                        msg.payload.type = "text";
                        msg.payload.content = message.text;
                    }
                    else if (message instanceof PhotoMessage) {
                        msg.payload.type = "photo";
                        msg.payload.content = {};
                        msg.payload.content.caption = message._captionText;
                        msg.payload.content.file_id = message._fileId;
                        msg.payload.content.file_hash = message._accessHash;
                        msg.payload.content.file_name = message._name;
                        msg.payload.content.file_size = message._fileSize;
                        msg.payload.content.thumb = message._thumb;
                        msg.payload.content.width = message._width;
                        msg.payload.content.height = message._height;
                        msg.payload.content.mimeType = message._mimeType;
                        msg.payload.blob = true;

                    }
                    else if (message instanceof VideoMessage) {
                        msg.payload.type = "video";

                        msg.payload.content = {};
                        msg.payload.content.caption = message._captionText;
                        msg.payload.content.file_id = message._fileId;
                        msg.payload.content.file_hash = message._accessHash;
                        msg.payload.content.file_name = message._name;
                        msg.payload.content.file_size = message._fileSize;
                        msg.payload.content.thumb = message._thumb;
                        msg.payload.content.width = message._width;
                        msg.payload.content.height = message._height;
                        msg.payload.content.mimeType = message._mimeType;
                        msg.payload.content.duration = message._duration;
                        msg.payload.blob = true;

                    }
                    else if (message instanceof AudioMessage) {
                        msg.payload.type = "audio";
                        msg.payload.content = {};
                        msg.payload.content.caption = message._captionText;
                        msg.payload.content.file_id = message._fileId;
                        msg.payload.content.file_hash = message._accessHash;
                        msg.payload.content.file_name = message._name;
                        msg.payload.content.file_size = message._fileSize;
                        msg.payload.content.mimeType = message._mimeType;
                        msg.payload.content.duration = message._duration;
                        msg.payload.blob = true;
                    }
                    else if (message instanceof FileMessage) {
                        msg.payload.type = "document";
                        msg.payload.content = {};
                        msg.payload.content.caption = message._captionText;
                        msg.payload.content.file_id = message._fileId;
                        msg.payload.content.file_hash = message._accessHash;
                        msg.payload.content.file_name = message._name;
                        msg.payload.content.file_size = message._fileSize;
                        msg.payload.content.mimeType = message._mimeType;
                        msg.payload.blob = true;
                    }
                    else if (message instanceof LocationMessage){
                        msg.payload.type = "location";
                        msg.payload.content = {};
                        msg.payload.content.latitude = message._latitude;
                        msg.payload.content.longitude = message._longitude;
                    }
                    else if (message instanceof ContactMessage){
                        msg.payload.type = "contact";
                        msg.payload.content = {};
                        msg.payload.content.name = message._name;
                        msg.payload.content.emails = message._emails;
                        msg.payload.content.phones = message._phones;
                    }
                    node.status({fill: "green", shape: "ring", text: "connected"});
                    // console.log(msg);
                    if (node.config.isAuthorizedUser(msg.payload.user_id)){
                        node.send([msg,null]);
                    } else {
                        node.send([null,msg]);
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
            if (msg.payload) {
                if (msg.payload.user_id) {
                    if (msg.payload.type) {

                        var user_id = msg.payload.user_id;
                        var accessHash = msg.payload.accessHash;

                        let user_peer = new User(user_id, accessHash);
                        var type = msg.payload.type;
                        switch (type) {
                            case 'text':

                                if (this.hasContent(msg)) {
                                    // the maximum message size is 4096 so we must split the message into smaller chunks.
                                    var chunkSize = 4000;
                                    var message = msg.payload.content;

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
                                        node.baleBot.send(effective_msg, new User(user_id, accessHash)).then(function (sent) {
                                            msg.payload.effective_msg = sent.effective_msg;
                                            node.send(msg);
                                        }).catch(function (err) {
                                            // markdown error? try plain mode
                                            if (
                                                String(err).includes("can't parse entities in message text:")
                                            ) {

                                                node.baleBot.send(effective_msg, user_peer).then(function (sent) {
                                                    msg.payload.effective_msg = sent.effective_msg;
                                                    node.send(msg);
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

                                    let messageObjOrFileId = msg.payload.content.file_id;
                                    let file_Hash = msg.payload.content.file_hash;
                                    let file_name = msg.payload.content.file_name;
                                    let fileSize = msg.payload.content.file_size;
                                    let mimeType = msg.payload.content.mimeType;
                                    let captionText = msg.payload.content.caption;
                                    let width = msg.payload.content.width;
                                    let height = msg.payload.content.height;
                                    let thumb = msg.payload.content.thumb;
                                    let effective_msg = new PhotoMessage(messageObjOrFileId, file_Hash.toString(), file_name, fileSize, mimeType, captionText, width, height, thumb);

                                    node.baleBot.send(effective_msg, user_peer).then(function (sent) {
                                        msg.payload.effective_msg = sent.effective_msg;
                                        node.send(msg);
                                    });
                                }
                                break;
                            case 'audio':

                                if (this.hasContent(msg)) {
                                    let messageObjOrFileId = msg.payload.content.file_id;
                                    let file_Hash = msg.payload.content.file_hash;
                                    let file_name = msg.payload.content.file_name;
                                    let fileSize = msg.payload.content.file_size;
                                    let mimeType = msg.payload.content.mimeType;
                                    let captionText = msg.payload.content.caption;
                                    let duration = msg.payload.content.duration;
                                    let effective_msg = new AudioMessage(messageObjOrFileId, file_Hash, file_name, fileSize, mimeType, captionText, duration);

                                    node.baleBot.send(effective_msg, user_peer).then(function () {
                                        node.send(msg);
                                    });
                                }
                                break;
                            case 'document':
                                if (this.hasContent(msg)) {

                                    let messageObjOrFileId = msg.payload.content.file_id;
                                    let file_Hash = msg.payload.content.file_hash;
                                    let file_name = msg.payload.content.file_name;
                                    let fileSize = msg.payload.content.file_size;
                                    let mimeType = msg.payload.content.mimeType;
                                    let captionText = msg.payload.content.caption;

                                    let effective_msg = new FileMessage(messageObjOrFileId, file_Hash, file_name, fileSize, mimeType, captionText);
                                    node.baleBot.send(effective_msg, user_peer).then(function () {
                                        node.send(msg);
                                    });
                                }
                                break;
                            case 'video':
                                if (this.hasContent(msg)) {
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
                                    let effective_msg = new VideoMessage(messageObjOrFileId, file_Hash, file_name, fileSize, mimeType, captionText, width, height, thumb, duration);
                                    node.baleBot.send(effective_msg, user_peer).then(function () {
                                        node.send(msg);
                                    });
                                }
                                break;
                            case 'voice':
                                if (this.hasContent(msg)) {
                                    let messageObjOrFileId = msg.payload.content.file_id;
                                    let file_Hash = msg.payload.content.file_hash;
                                    let file_name = msg.payload.content.file_name;
                                    let fileSize = msg.payload.content.file_size;
                                    let mimeType = msg.payload.content.mimeType;
                                    let captionText = msg.payload.content.caption;
                                    let duration = msg.payload.content.duration;
                                    let effective_msg = new AudioMessage(messageObjOrFileId, file_Hash, file_name, fileSize, mimeType, captionText, duration);

                                    node.baleBot.send(effective_msg, user_peer).then(function () {
                                        node.send(msg);
                                    });
                                }
                                break;

                            case "location":
                                if (this.hasContent(msg)){
                                    let messageObjOrFileId = msg.payload.content.latitude;
                                    let longitude = msg.payload.content.longitude;
                                    let effective_msg = new LocationMessage(messageObjOrFileId, longitude);
                                    node.baleBot.send(effective_msg, user_peer).then(function () {
                                        node.send(msg);
                                    });
                                }
                                break;

                            case "contact":
                                if (this.hasContent(msg)){
                                    let messageObjOrFileId = msg.payload.content.name;
                                    let emails = msg.payload.content.emails;
                                    let phones = msg.payload.content.phones;
                                    let effective_msg = new ContactMessage(messageObjOrFileId, emails, phones);
                                    node.baleBot.send(effective_msg, user_peer).then(function () {
                                        node.send(msg);
                                    });
                                }
                                break;
                            default:{

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
                                            console.error(err);
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

                                            node.send({payload: "File downloaded successfully.\n" + file_name});
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
            if (msg.payload) {
                if (msg.payload.file_address) {


                    fs.readFile(msg.payload.file_address, function (err, imageBuffer) {
                        node.baleBot.UploadFile(imageBuffer, 'file').then(response => {

                            var stats = fs.statSync(msg.payload.file_address);
                            var fileSizeInBytes = stats.size;
                            let mime_type = mime.getType(msg.payload.file_address);
                            let fileId = response.fileId;
                            let fileAccessHash = response.accessHash;
                            new_msg = {
                                payload: {
                                    type: "",
                                    content: {
                                        file_id: fileId,
                                        file_hash: fileAccessHash,
                                        mimeType: mime_type,
                                        file_size: fileSizeInBytes,
                                        file_name: path.basename(msg.payload.file_address),
                                        caption: ""
                                    }
                                }
                            };


                            var thumbBuffer = null;

                            if (mime_type.indexOf("video") > -1) {
                                new_msg.payload.type = "video";

                                ffmpeg.ffprobe(msg.payload.file_address, function (err, metadata) {
                                    // console.dir(metadata.streams[1]); // all metadata
                                    new_msg.payload.content.duration = metadata.format.duration;
                                    new_msg.payload.content.width = metadata.streams[1].width;
                                    new_msg.payload.content.height = metadata.streams[1].height;

                                });

                                var temp_path = msg.payload.file_address.replace(path.basename(msg.payload.file_address), "");
                                var temp_file_name = random_file_name() + ".png";

                                ffmpeg(msg.payload.file_address)
                                    .on('filenames', function (filenames) {

                                    })
                                    .on('end', function () {
                                        fs.readFile(temp_path + temp_file_name, function (err, imageBuffer) {
                                            thumbBuffer = new Buffer(imageBuffer).toString('base64');
                                            new_msg.payload.content.thumb = thumbBuffer;
                                            node.send(new_msg);
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
                                new_msg.payload.type = "photo";
                                sharp(imageBuffer)
                                    .metadata()
                                    .then(info => {
                                        new_msg.payload.content.width = info.width;
                                        new_msg.payload.content.height = info.height;

                                    });
                                sharp(imageBuffer)
                                    .resize(180, 180, {
                                        fit: sharp.fit.inside,
                                        withoutEnlargement: true
                                    })
                                    .toBuffer()
                                    .then(function (outputBuffer) {
                                        thumbBuffer = new Buffer(outputBuffer).toString('base64');
                                        new_msg.payload.content.thumb = thumbBuffer;
                                        node.send(new_msg);
                                    });

                            } else if (mime_type.indexOf("audio") > -1) {
                                new_msg.payload.type = "audio";
                                audio_metadata.parseFile(msg.payload.file_address, {native: true})
                                    .then(metadata => {
                                        // console.log(metadata.format.duration);
                                        new_msg.payload.content.duration = metadata.format.duration;
                                        node.send(new_msg);
                                    })
                                    .catch(err => {
                                        console.error(err.message);
                                    });


                            } else {
                                new_msg.payload.type = "document";
                                node.send(new_msg);
                            }

                        });
                    });

                } else {
                    node.warn("msg.payload.file_address is empty");
                }
            } else {
                node.warn("msg.payload is empty");
            }

        });
    }

    RED.nodes.registerType("bale uploader", baleuploader);

};