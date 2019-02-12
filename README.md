# BaleRed

BaleRed helps you to use [Bale Bot](https://www.npmjs.com/package/balebot) SDK without coding.
With the Receiver and Sender nodes you can receive and send these types of messages:
- Text Message
- Photo Message
- Video Message
- Document Message
- Location Message
- Contact Message

The Downloader node helps you to download Photo, Video and Document messages in your local system.

The Uploader node helps you to upload any file in your local system to bale servers and send it to any user you want.


# What is Bale Red

Bale Red a series of Node-red nodes which helps to make bots in Bale Messenger platform. With these nodes you don't need to use bale SDK to make Bot. 

<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/50760366-dcbb0700-127c-11e9-8eb8-4335c7835bf7.png"  title="Bale Red Nodes">
</p>


These package includes Receiver, Sender, Downloader, and Uploader nodes. Name of the nodes makes it clear the role of each node. When a client sends message to the bot you can get
the message from Receiver output, and if you want to send a message to the client you can use Sender node. Uploader and Downloader nodes helps you 
to upload and download files to/from Bale servers, respectively.


As am example in order to make an Echo bot, you just need to connect Receiver and Sender nodes to each other.
<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/50537756-43ec0380-0b79-11e9-9d26-44f75df4c790.png"  title="Echo">
</p>

As another example, in order to download all files sent to your bot you can connect a Downloader node to Receiver node.
<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/50537765-6aaa3a00-0b79-11e9-8f91-5ef495fe312c.png"  title="Download all files">
</p>


## How to config Bale Red
The first step in using Bale Red is setting the Token which has been given by BotFather. In order to set the Token follow these steps.

<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/49872068-2dca0d80-fe2d-11e8-96b1-7a386f6fe7e2.png"  title="Node Configuration">
</p>
First double click a node and click on add button to make a config. In Bot-Name you can choose a name for your bot.
It does not matter what you choose as name. In Token section type you bot token. In user_ids section you can authorize users who can
send message to your bot. With this config you can choose who can work with your bot. After filling all sections click Add.

<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/49872146-771a5d00-fe2d-11e8-9379-c3187d659a20.png"  title="Node Configuration">
</p>

# Nodes

## Receiver Node

This node gets the message from clients and send the message through its output. The supported messages are :
Text Message, Photo Message, Video Message, Audio Message, Document Message, Contact Message, and  Location Message


- Text Message: A message which includes only a text
- Photo Message: Includes a Photo and its caption.
- Video Message: Includes a Video and its caption.
- Audio Message: Includes an Audio and its caption
- Document Message: Includes any files that does not included in past messages
- Contact Message: Includes details of the contact
- Location Message: Includes Latitude and Longitude of the location

Output of the Receiver node changes based on the message type.

### Text Message

The Receiver output includes these parameters when a text message is sent to the bot:
```
payload.user_id ="user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "text"
payload.content.caption = "text message data"
```
As can be seen the output has three main sections: user_id and accessHash of the user, message type, and message content

### Photo Message

The Receiver output includes these parameters when a photo message is sent to the bot:
```
payload.user_id = "user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "photo"
payload.content.caption = "caption of the photo"
payload.content.file_id = "file_id of the photo"
payload.content.file_hash = "accessHash of the photo"
payload.content.file_name = "name of the file"
payload.content.file_size = "size of the file"
payload.content.thumb = "thumbnail of the photo"
payload.content.width = "width of the photo"
payload.content.height = "height of the photo"
payload.content.mimeType = "mime type of the photo"
```
### Video Message

The Receiver output includes these parameters when a video message is sent to the bot:
```
payload.user_id = "user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "video"
payload.content.caption = "caption of the video"
payload.content.file_id = "file_id of the video"
payload.content.file_hash = "accessHash of the video"
payload.content.file_name = "name of the file"
payload.content.file_size = "size of the file"
payload.content.thumb = "thumbnail of the video"
payload.content.width = "width of the video"
payload.content.height = "height of the video"
payload.content.mimeType = "mime type of the video"
payload.content.ducation = "length of the video in seconds"
```
### Audio Message

The Receiver output includes these parameters when a audio message is sent to the bot:
```
payload.user_id = "user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "audio"
payload.content.caption = "caption of the audio"
payload.content.file_id = "file_id of the audio"
payload.content.file_hash = "accessHash of the audio"
payload.content.file_name = "name of the file"
payload.content.file_size = "size of the file"
payload.content.mimeType = "mime type of the audio"
payload.content.ducation = "length of the video in seconds"
```

### Document Message
The Receiver output includes these parameters when a document message is sent to the bot:

```
payload.user_id = "user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "document"
payload.content.caption = "caption of the file"
payload.content.file_id = "file_id of the file"
payload.content.file_hash = "accessHash of the file"
payload.content.file_name = "name of the file"
payload.content.file_size = "size of the file"
payload.content.mimeType = "mime type of the file"
```

### Contact Message

The Receiver output includes these parameters when a contact message is sent to the bot:
```
payload.user_id = "user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "contact"
payload.content.name = "name of the person"
payload.content.emails = "list of emails"
payload.content.phones = "list of phones"
```

### Location Message

The Receiver output includes these parameters when a location message is sent to the bot:
```
payload.user_id = "user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "location"
payload.content.latitude = "latitude of the location"
payload.content.longitude = "longitude of the location"
```

### Template Respond Message
```
payload.user_id ="user_id of the client"
payload.accessHash = "accessHash of the client"
payload.type = "text"
payload.content.caption = "value of the pressed button"
```


It is necessary to know these parameters if you need to store and use the data later.

### Receiver Node Outputs
The Receiver node has three outputs.
The first output is for authorized users. If no user has been added, all messages will be in this output.

The second output is for none authorized users.

The last output is for messages which comes from Groups and Channels.

## Sender Node
You should consider that if you want to send a message, the format of the input should be the same as the format of Receiver node's output.

## Downloader Node
In order to download a file it is necessary to give file_id, file_hash, and file_name to the node. The file location can be 
chosen in the node's config.
 
<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/49872959-e09b6b00-fe2f-11e8-957d-c8556bc0209f.png"  title="Select Download Directory">
</p>

## Uploader Node
In order to use the Uploader node, it is necessary to send the file location in local directory. After this node 
it is necessary to add user's data (user_id and accessHash). 
```
msg.filename = "the file address in my PC"
```

### Text Message Node
In order to add text to a message this node can be used


### Money Message Node
To send a money request this node can be used.


In order to give file address to the node it can be given by a function node.

<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/52635536-63e44600-2edf-11e9-8a74-05dfd6ac50de.png"  title="show data location">
</p>
<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/50537774-a2b17d00-0b79-11e9-8fb9-29b14afa8c97.png"  title="nodes to send a file">
</p>
<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/52635633-a0b03d00-2edf-11e9-9c7e-f0ef193ab130.png"  title="sent user data">
</p>


It can be seen how it is easy to upload and send any kind of messages by Bale Red

Image below shows the general usage of all the nodes.
<p align="center">
  <img src="https://user-images.githubusercontent.com/37385157/49873707-cd899a80-fe31-11e8-9408-83bfcd8df49d.png"  title="Bale Red">
</p>


# How to Install Bale Red

## Ubuntu

### Install Node-red

Start a Terminal and run these commends
```
sudo apt-get install nodejs-legacy
sudo apt-get install npm
sudo npm install -g --unsafe-perm node-red
```

In order to make the node-red to auto run after restart follow as below
```
sudo nano /etc/systemd/system/node-red.service
```
```
[Unit]

Description=Node-RED

After=syslog.target network.target

[Service]

ExecStart=/usr/local/bin/node-red --max-old-space-size=128 -v

Restart=on-failure

KillSignal=SIGINT

SyslogIdentifier=node-red

StandardOutput=syslog

WorkingDirectory=/home/UTILISATEUR/

User=UTILISATEUR

Group=UTILISATEUR

[Install]

WantedBy=multi-user.target
```

After saving the file follow these steps:
```
sudo systemctl enable node-red
sudo systemctl start node-red
```

If you need to stop node-red you can use this command:
```
sudo systemctl stop node-red
```

### Install Bale Red

In order to install Bale Red start a Terminal and run these commands:
```
cd ~/.node-red
npm install node-red-contrib-balered
```
After installing Bale Red restart node-red so new nodes be loaded. 

## Install in Windows

### Install Node-Red

Download and install node.js version LTS from [https://nodejs.org/en/](https://nodejs.org/en/)
After installing node.js start a powerShell as an administrator and run these commands: 
```
npm install --global --production windows-build-tools
npm install --global --production --add-python-to-path windows-build-tools
npm install -g --unsafe-perm node-red
```

If you need to make node-red to run after each reboot follow as below:

If you want to use Windows as a production platform for Node-RED, you will want to have a Windows Task Scheduler job set up. To do so:

Go to the start menu and type “task scheduler” and click on the result.
Click on “Create Task…” in the right-hand menu. Follow the steps to create a new task.
Make sure that you use the user login that you’ve used to set up and do the initial run of Node-RED. You can use an “At startup” trigger to always run Node-RED at system startup. Use the Action “Start a program” with details set to
```
d:\Users\<user>\AppData\Roaming\npm\node-red.cmd
```
(replacing <user> with your actual user name).


### Install Bale Red

In order to install Bale Red start a command windows and go to this directory
```
cd c:\users\<user>\.node-red
```
and run this command
```
npm install node-red-contrib-balered
```
now restart node-red to load new nodes.