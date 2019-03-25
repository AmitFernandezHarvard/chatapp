import os
import jsonpickle, datetime
import uuid
from typing import List
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)


class Chat:
    """
    This class is used to store the chat messages
    """
    def __init__(self, userName, message, timecreated,uuid):
        """
        Creates the variables associated with the class Chat:
        :type userName: string
        :param userName: Name of the user posting the chat

        :type message: string
        :param message: Actual chat message

        :type timecreated: string
        :param timecreated: Formatted date and time of the message

        :type uuid: string
        :param uuid: Unique identifier for the message
        """
        self.userName = userName
        self.message = message
        self.timecreated = timecreated
        self.uuid = uuid

class Channel:
        """
        This class is used to store the Channel Information
        """
        def __init__(self, name, category, chats: List[Chat]):
            """
            Creates the variables associated with the class Chat:
            :type name: string
            :param name: Name of the channel

            :type category: string
            :param category: Category of the channel

            :type chats: List[Chat]
            :param chats: Stores all the chats

            """
            self.name = name
            self.category = category
            self.chats = chats


Channels=[]

@app.route("/")
def index():
    """
    Default load of the page
    """
    # Creates a empty Channel when there is no channel
    if Channels == []:
        newChl = Channel("Common Chat", "Technology",[])
        Channels.append(newChl)

    return render_template("index.html", channelsdata= Channels)

@socketio.on("addChannel")
def addChannel(data):
    """
    Adds the channels to the memory
    Trigers socket io to update all the channels with the new channel
    channel-add-success - when the addition is successful
    channel-add-fail - When channel already exists
    """
    if IsValidChannel(data["chlName"]):
        newChl = Channel(data["chlName"], data["chlCat"],[])
        Channels.append(newChl)
        # Used jsonpickle to serialize the class
        emit("channel-add-success", jsonpickle.encode(newChl), broadcast=True)
    else:
        emit("channel-add-fail", "Fail")


@socketio.on("sendMessage")
def sendMessage(data):
    """
    Creates a new message and adds to the channel
    Emits message-add to all active windows to update the chat
    Used jsonpickle to serialize the dataset
    used UUID to create new GUID
    """
    newChat = Chat(
    data["userName"],
    data["messageText"],
    datetime.datetime.now().strftime("%m/%d, %H:%M"),
    # used uuid to create a GUID to identify the chat
    str(uuid.uuid4()))

    for chl in Channels:
        if chl.name == data["channelName"]:
            if len(chl.chats) >= 100:
                del chl.chats[0]
            chl.chats.append(newChat)
            emit("message-add",{'channelname':data["channelName"],'chat': jsonpickle.encode(newChat)}, broadcast=True)


@app.route("/channel/<string:channelName>")
def getChanneldata(channelName):
    """
    Fetches the channel with its chats
    uses filter and lamba to filter the channel
    """
    selectedChannel = filter(lambda chl: chl.name == channelName, Channels)
    return jsonpickle.encode(next(selectedChannel));

@socketio.on("deletemessage")
def deletemessage(data):
    """
    Deletes a message on the channel
    Uses UUID to do the deletion
    """
    for chl in Channels:
        if chl.name == data["channelName"]:
            for chat in chl.chats:
                if(chat.uuid == data["msg_uuid"]):
                    chl.chats.remove(chat)
                    emit("message-delete",{'channelname':data["channelName"],'uuid': data["msg_uuid"]}, broadcast=True)


def IsValidChannel(channelName):
    for chl in Channels:
        print(chl.name + channelName)
        if chl.name == channelName:
            return False;
    return True;
