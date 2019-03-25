/**
 * chlTemplate - Template to display the channels
 * msgStartTemplate - Template to display the message send by Others
 * msgEndTemplate - Template to display the message send by the active user
 */

const chlTemplate = Handlebars.compile(document.querySelector('#channelTemplate').innerHTML);
const msgStartTemplate = Handlebars.compile(document.querySelector('#messageTemplateStart').innerHTML);
const msgEndTemplate = Handlebars.compile(document.querySelector('#messageTemplateEnd').innerHTML);

// Contains all the events linked to the page
document.addEventListener('DOMContentLoaded', () => {

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  loaduser();
  /**
   * Takes the display name and saves to the localStorage.
   * It also disables and hides the sections when display name is not entered
   */
  document.querySelector('#btnAddDisplayName').onclick = () => {
    var name = document.querySelector('#txtDisplayName').value;
    localStorage.setItem('wowchat.activeusers', name);
    enableNewUser(false);
  }

  /**
   * btnAddChannel click will emits server call to add the channel to the server
   * Server will push socket io calls channel-add-success and channel-add-fail
   */
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

  /**
   * btnSendMessage click will emits server call to add the message to the server
   * Server will push socket io call message-add
   * After adding the message the message text area is cleared
   */
  document.querySelector('#btnSendMessage').onclick = () => {
    if (document.querySelector('#messagearea').value !== "") {
      socket.emit('sendMessage', {
        'channelName': document.querySelector('#selectedChannelName').innerText,
        'userName': localStorage.getItem('wowchat.activeusers'),
        'messageText': document.querySelector('#messagearea').value
      });
      document.querySelector('#messagearea').value = '';
    }
  };

  /**
   * This triggers the chat window for the clicked channel
   * Highlights the selected channel and unselects the other channels
   */
  document.querySelectorAll('.sel-channel').forEach(channel => {
    channel.onclick = () => {
      document.querySelectorAll('.sel-channel').forEach(channel => {
        channel.classList.remove("active");
      });
      channel.classList.add("active");
      loadchat(channel.dataset.chlname);
    };
  });

  /**
   * This triggers the server calls to delete the message from the server
   * Server emits message-delete call
   */
  document.querySelectorAll('.del-message').forEach(message => {
    message.onclick = () => {
      socket.emit('deletemessage', {
        'channelName': localStorage.getItem('wowchat.activechannelName'),
        'msg_uuid': message.dataset.uuid
      });
    };
  });

  // Selected the default channel
  loadDefaultChat();

  // Code to handle "enter" click on the message
  document.querySelector('#messagearea').addEventListener("keyup",
    function(event) {
      event.preventDefault();
      if (event.keyCode === 13) {
        document.querySelector("#btnSendMessage").click();
      }
    });

  /**
   * Call triggered from the server btnAddChannel click
   * Displays the error message if failure
   */
  socket.on('channel-add-fail', data => {
    document.querySelector('#errormessage').innerHTML = "Channel already Exists!!!";
    document.querySelector('#errormessage').style.display = "block";
  });

  /**
   * Adds the new channel to the page
   * Clears if there were any error message
   * Adds click event to the newly added channel
   */
  socket.on('channel-add-success', data => {
    var chl = JSON.parse(data)
    //create new content for the channel
    const content = chlTemplate({
      'chlCat': chl['category'],
      'chlName': chl['name']
    });
    document.querySelector('#existingChannels').innerHTML =
      content + document.querySelector('#existingChannels').innerHTML;

    //clear if any error message
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

  /**
   * Adds the new message to the chat if the channel matches
   * Scrolls the mouse to the bottom
   * Adds the event to the template newly added
   * Removes the top message if message more than 100
   */
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

  /**
   * Deletes the message based on the UUID if the channel matches
   */
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

/** Loads the user if already exists in localstorage */
function loaduser() {
  var displayname = localStorage.getItem('wowchat.activeusers');
  if (displayname != null && displayname !== "") {
    document.querySelector('#txtDisplayName').value = displayname;
    enableNewUser(false);
  } else {
    enableNewUser(true);
  }
}

/** Enables and hides sections based on enable flag. */
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

/** Loads the chat based on the last used channel */
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

/** Makes a Get call to get the messages for a channel */
function loadchat(channelName) {
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
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


    document.querySelectorAll('.del-message').forEach(message => {
      message.onclick = () => {
        socket.emit('deletemessage', {
          'channelName': localStorage.getItem('wowchat.activechannelName'),
          'msg_uuid': message.dataset.uuid
        });
      };
    });
  };
  request.send();
}

/** Makes a Get call to get the messages for a channel */
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
