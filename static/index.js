const chlTemplate = Handlebars.compile(document.querySelector('#channelTemplate').innerHTML);
const msgStartTemplate = Handlebars.compile(document.querySelector('#messageTemplateStart').innerHTML);
const msgEndTemplate = Handlebars.compile(document.querySelector('#messageTemplateEnd').innerHTML);

document.addEventListener('DOMContentLoaded', () => {

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  loaduser();

  document.querySelector('#btnAddDisplayName').onclick = () => {
    var name = document.querySelector('#txtDisplayName').value;
    localStorage.setItem('wowchat.activeusers', name);
    enableNewUser(false);
  }

  document.querySelector('#btnAddChannel').onclick = () => {
    chlName = document.querySelector('#txtNewChannelName').value;
    chlCat = document.querySelector('#optChlCat');
    if (chlName !== "") {
      socket.emit('addChannel', {
        'chlName': chlName,
        'chlCat': chlCat.options[chlCat.selectedIndex].value
      });
    }
  };

  document.querySelector('#btnSendMessage').onclick = () => {
    socket.emit('sendMessage', {
      'channelName': document.querySelector('#selectedChannelName').innerText,
      'userName': localStorage.getItem('wowchat.activeusers'),
      'messageText': document.querySelector('#messagearea').value
    });
    document.querySelector('#messagearea').value = '';
  };

  document.querySelectorAll('.sel-channel').forEach(channel => {
    channel.onclick = () => {
      document.querySelectorAll('.sel-channel').forEach(channel => {
        channel.classList.remove("active");
      });
      channel.classList.add("active");
      loadchat(channel.dataset.chlname);
    };
  });

  document.querySelectorAll('.del-message').forEach(message => {
    message.onclick = () => {
      socket.emit('deletemessage', {
        'channelName': localStorage.getItem('wowchat.activechannelName'),
        'msg_uuid': msg.dataset.uuid
      });
    };
  });

  loadDefaultChat();

  document.querySelector('#messagearea').addEventListener("keyup",
    function(event) {
      event.preventDefault();
      if (event.keyCode === 13) {
        document.querySelector("#btnSendMessage").click();
      }
    });

  socket.on('channel-add-fail', data => {
    document.querySelector('#errormessage').innerHTML = "Channel already Exists!!!";
    document.querySelector('#errormessage').style.display = "block";
  });

  socket.on('channel-add-success', data => {

    var chl = JSON.parse(data)

    const content = chlTemplate({
      'chlCat': chl['category'],
      'chlName': chl['name']
    });
    document.querySelector('#existingChannels').innerHTML =
      content + document.querySelector('#existingChannels').innerHTML;
    document.querySelector('#errormessage').style.display = "none";
    document.querySelectorAll('.sel-channel').forEach(channel => {
      channel.onclick = () => {
        document.querySelectorAll('.sel-channel').forEach(channel => {
          channel.classList.remove("active");
        });
        channel.classList.add("active");
        loadchat(channel.dataset.chlname);
      };
    });
  });

  socket.on('message-add', data => {
    var channelName = data.channelname;
    if (document.querySelector('#selectedChannelName').innerText === channelName) {
      showsinglemessage(localStorage.getItem('wowchat.activeusers'), JSON.parse(data.chat));
      if (document.querySelectorAll('.messagefmt').length >= 100) {
        document.querySelectorAll('.messagefmt').item(0).remove();
      }
      document.querySelector('.chat_body').scrollTop = document.querySelector('.chat_body').scrollHeight;
      document.querySelectorAll('.del-message').forEach(message => {
        message.onclick = () => {
          socket.emit('deletemessage', {
            'channelName': localStorage.getItem('wowchat.activechannelName'),
            'msg_uuid': message.dataset.uuid
          });
        };
      });
    }
  });

  socket.on('message-delete', data => {
    var channelName = data.channelname;
    if (document.querySelector('#selectedChannelName').innerText === channelName) {
      document.querySelectorAll('.messagefmt').forEach(message => {
        if (message.dataset.uuid == data.uuid) {
          message.remove();
        }
      });

    }
  });

});

function loaduser() {
  var displayname = localStorage.getItem('wowchat.activeusers');
  if (displayname != null && displayname !== "") {
    document.querySelector('#txtDisplayName').value = displayname;
    enableNewUser(false);
  } else {
    enableNewUser(true);
  }
}

function enableNewUser(enable) {
  if (enable) {
    document.querySelector('#txtDisplayName').disabled = false;
    document.querySelector('.chat').style.display = "none";
    document.querySelector('.chat-content').style.display = "none";
    document.querySelector('#btnAddDisplayName').style.display = "block";
  } else {
    document.querySelector('#txtDisplayName').disabled = true;
    document.querySelector('.chat').style.display = "block";
    document.querySelector('.chat-content').style.display = "block";
    document.querySelector('#btnAddDisplayName').style.display = "none";
  }
}

function loadDefaultChat() {
  var activeChannelName = localStorage.getItem('wowchat.activechannelName');
  if (document.querySelectorAll('.sel-channel').length === 1) {
    document.querySelectorAll('.sel-channel').item(0).click();
  }
  if (activeChannelName != null && activeChannelName !== "") {
    document.querySelectorAll('.sel-channel').forEach(channel => {
      if (channel.dataset.chlname === activeChannelName) {
        channel.click();
      }
    });
  }
}

function loadchat(channelName) {
  localStorage.setItem('wowchat.activechannelName', channelName);
  const request = new XMLHttpRequest();
  request.open('GET', `channel/${channelName}`);
  request.onload = () => {
    const response = request.responseText;
    var chl = JSON.parse(request.responseText);
    document.querySelector('.chat_body').innerHTML = '';
    document.querySelector('#selectedChannelName').innerText = chl.name;
    document.querySelector('#selectedChannelCat').innerText = chl.category;
    document.querySelector('#selectedChannelImg').src = "/static/images/" + chl.category + "-Icon.png";
    const username = localStorage.getItem('wowchat.activeusers');
    chl.chats.forEach(chat => {
      showsinglemessage(username, chat);
    });
  };
  request.send();
}

function showsinglemessage(username, chat) {
  if (username === chat.userName) {
    const content = msgEndTemplate({
      'messageText': chat.message,
      'timecreated': chat.timecreated,
      'userName': "YOU",
      'uuid': chat.uuid
    });
    document.querySelector('.chat_body').innerHTML += content
  } else {
    const content = msgStartTemplate({
      'messageText': chat.message,
      'timecreated': chat.timecreated,
      'userName': chat.userName,
      'uuid': chat.uuid
    });
    document.querySelector('.chat_body').innerHTML += content
  }
}
