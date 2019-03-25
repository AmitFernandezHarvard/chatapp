# Project 2 - WoW Chatroom
[https://amit-chatapp.herokuapp.com/](https://amit-chatapp.herokuapp.com/)

### Requirements
* Display Name :
	* When the page loads user will be asked to enter the display name.
	* This information is stored in localstorage.
	* Until the name is entered, user will not be able to access the chat information.
	* If the user comes back, the name will be fetched from localstorage.
* Channels:
	* By default one channel "Common Chat" is created.
	* Users can add a new channel.
	* The data is stored in the server.
	* There is a category which is tied to an image and user can add a category to his channel.
	* If the name exists, error will be displayed.
	* The channel is stored in the local storage and if the user visits the same channel will be selected
* Messages
	* When the channel is selected, messages will be displayed
	* Max of 100 messages will be displayed on the screen
	* After 100, the first message will be removed to allow the new ones
	* The same will be removed from the server as well.
	* With socket.io, anyone subscribed will see the message if they have the same channel open.
  * Click on the send icon or "Enter" will post the message
* Personal touch - Delete Feature
	* I have implemented delete feature of your messages.
	* Only the user who added the message can delete it



### Implementation
* I used layout.html even when it is only one page. Templates are coded there.
* I created 2 classes to store the channel and chats. I used List from typing to implement this.
* I used jsonpickle to serialize the class to JSON
* Page will not be reloaded after the initial load
* Localstorage is used to store the name and the channel
* Used 3 templates to handle channel and message display
* Different styling is used for messages send by you and received from others
* The window will always scroll down to see the latest message. Used scroll height to do this.
* Used UUID as a chat identifier. This is needed to keep track of the message during deletion.
* Deployed to Heroku but didnt add the additional details in requirements.txt [https://amit-chatapp.herokuapp.com/](https://amit-chatapp.herokuapp.com/)

### Requirements.txt

*	Flask
*	Flask-SocketIO
*	typing
*	jsonpickle
