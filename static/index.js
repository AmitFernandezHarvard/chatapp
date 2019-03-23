const chlTemplate = Handlebars.compile(document.querySelector('#channelTemplate').innerHTML);
const msgStartTemplate = Handlebars.compile(document.querySelector('#messageTemplateStart').innerHTML);
const msgEndTemplate = Handlebars.compile(document.querySelector('#messageTemplateEnd').innerHTML);

document.addEventListener('DOMContentLoaded', () => {

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  var displayname = localStorage.getItem('wowchat.activeusers');
  if (displayname != null && displayname !== "") {
    document.querySelector('#txtDisplayName').value = displayname;
    //enableNewUser(false);
  } else {
    //enableNewUser(true);
  }
  document.querySelector('#btnAddDisplayName').onclick = addDisplayName;

  document.querySelector('#btnAddChannel').onclick = () => {
    chlName = document.querySelector('#txtNewChannelName').value;
    chlCat = document.querySelector('#optChlCat');
    socket.emit('addChannel',
    {
      'chlName': chlName,
      'chlCat': chlCat.options[chlCat.selectedIndex].value
    });
  };

  document.querySelector('#btnSendMessage').onclick = () => {
    socket.emit('sendMessage',
    {
      'channelName': document.querySelector('#selectedChannelName').innerText,
      'userName': localStorage.getItem('wowchat.activeusers'),
      'messageText': document.querySelector('#messagearea').value
    });
    document.querySelector('#messagearea').value='';
  };


  document.querySelectorAll('.sel-channel').forEach(channel => {
            channel.onclick = () => {
              document.querySelectorAll('.sel-channel').forEach(channel => {
                    channel.classList.remove("active");
                  });
                channel.classList.add("active");
                loadchat(channel.dataset.chlname);;
            };
        });

  socket.on('channel add', data => {
    var chl = JSON.parse(data)
    const content = chlTemplate({
      'chlCat': chl['category'],
      'chlName': chl['name']
    });
    document.querySelector('#existingChannels').innerHTML =
    content + document.querySelector('#existingChannels').innerHTML;

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


    if(document.querySelector('#selectedChannelName').innerText === channelName){
      if(localStorage.getItem('wowchat.activeusers') === JSON.parse(data.chat).userName){
        const content = msgEndTemplate({
          'messageText': JSON.parse(data.chat).message,
          'timecreated': JSON.parse(data.chat).timecreated,
          'userName': JSON.parse(data.chat).userName
        });
        document.querySelector('.chat_body').innerHTML += content
      }
      else{
        const content = msgStartTemplate({
          'messageText': JSON.parse(data.chat).message,
          'timecreated': JSON.parse(data.chat).timecreated,
          'userName': JSON.parse(data.chat).userName
        });
        document.querySelector('.chat_body').innerHTML += content
      }


    }

  });

});


function enableNewUser(enable) {
  if (enable) {
    document.querySelector('#txtDisplayName').disabled = false;
    //document.querySelector('#allchannels').style.display = "none";
    //document.querySelector('#selectedchannel').style.display = "none";
    document.querySelector('#btnAddDisplayName').style.display = "block";

  } else {
    document.querySelector('#txtDisplayName').disabled = true;
    //document.querySelector('#allchannels').style.display = "block";
    //document.querySelector('#selectedchannel').style.display = "block";
    document.querySelector('#btnAddDisplayName').style.display = "none";
  }
}

function addDisplayName() {
  var name = document.querySelector('#txtDisplayName').value;
  localStorage.setItem('wowchat.activeusers', name);
  enableNewUser(false);
}

function loadchat(channelName) {
  const request = new XMLHttpRequest();
  request.open('GET', `channel/${channelName}`);
  request.onload = () => {
      const response = request.responseText;
      var chl = JSON.parse(request.responseText);
      document.querySelector('.chat_body').innerHTML ='';
      document.querySelector('#selectedChannelName').innerText = chl.name;
      const username = localStorage.getItem('wowchat.activeusers');
      chl.chats.forEach(chat => {
                showsinglemessage(username,chat);
            });

  };
  request.send();
}

function showsinglemessage (username, chat)
{
  if(username === chat.userName){
    const content = msgEndTemplate({
      'messageText': chat.message,
      'timecreated': chat.timecreated,
      'userName': chat.userName
    });
    document.querySelector('.chat_body').innerHTML += content
  }
  else{
    const content = msgStartTemplate({
      'messageText': chat.message,
      'timecreated': chat.timecreated,
      'userName': chat.userName
    });
    document.querySelector('.chat_body').innerHTML += content
  }
}
