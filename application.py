import os
import requests
import jsonpickle, datetime
from typing import List

from flask import Flask, jsonify, render_template, request, json, session
from flask_session import Session
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


class Chat:
    def __init__(self, userName, message, timecreated):
        self.userName = userName
        self.message = message
        self.timecreated = timecreated

class Channel:
    def __init__(self, name, category, chats: List[Chat]):
        self.name = name
        self.category = category
        self.chats = chats

class Channels(object):
    def __init__(self, channels: List[Channel]):
        self.channels = channels

Channels=[]

@app.route("/")
def index():
    if Channels == []:
        newChl = Channel("Common Chat", "Technology",[])
        Channels.append(newChl)
    print(jsonpickle.encode(Channels))
    return render_template("index.html", channelsdata= Channels)

@socketio.on("addChannel")
def addChannel(data):
    if IsValidChannel(data["chlName"]):
        newChl = Channel(data["chlName"], data["chlCat"],[])
        Channels.append(newChl)
        emit("channel-add-success", jsonpickle.encode(newChl), broadcast=True)
    else:
        emit("channel-add-fail", "Fail")

@socketio.on("sendMessage")
def sendMessage(data):
    newChat = Chat(
    data["userName"],
    data["messageText"],
    datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S"))

    for chl in Channels:
        if chl.name == data["channelName"]:
            if len(chl.chats) >= 100:
                del chl.chats[0]
            chl.chats.append(newChat)
            emit("message-add",{'channelname':data["channelName"],'chat': jsonpickle.encode(newChat)}, broadcast=True)

@app.route("/channel/<string:channelName>")
def getChanneldata(channelName):
    selectedChannel = filter(lambda chl: chl.name == channelName, Channels)
    return jsonpickle.encode(next(selectedChannel));


def IsValidChannel(channelName):
    for chl in Channels:
        print(chl.name + channelName)
        if chl.name == channelName:
            return False;
    return True;