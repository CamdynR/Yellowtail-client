// messenger.js - used to send and receive messages from other party

// Messenger Object to keep code isolated in lieu of modules
const messenger = {};

messenger.socket = null; // Stores socket connection
messenger.socketURL = 'https://yellowtail.app'; // URL to link to for socket
messenger.serverCheck = null; // Stores socket connection check setInterval

// Send a message saying 'Ready to join' so the popup can determine
// if a room is trying to be joined right now
document.addEventListener('DOMContentLoaded', () => {
  messenger.msgPopupScriptAndSW({ message: 'Ready to join' });
});

// Receives messages from the popup
browser.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    messenger.parseMessage(request, sender, sendResponse);
  }
);

/**
 * Initialize Socket.IO by connecting to server, attack Socket message listeners
 */
messenger.initSocketIO = function () {
  // Connect to Socket Server
  this.socket = io(this.socketURL, { path: '/socket/socket.io', secure: false });

  // Poll every 5 seconds to make sure server is still connected
  this.serverCheck = setInterval(this.checkServerConnection, 5000);

  // Store your own Socket ID for later
  this.socket.on('socketID', content => {
    yt.participants.me.socketID = content.socketID;
  });

  // Message handler for incoming server notifications
  this.socket.on('notification', content => {
    switch (content.status) {
      case 'room created':
        visuals.roomCreated(content.roomCode);
        this.msgPopupScriptAndSW({
          message: 'Set Room Code',
          roomCode: content.roomCode
        });
        break;
      case 'room joined':
        visuals.roomJoined(content.roomInfo);
        this.msgPopupScriptAndSW({
          message: 'Set Room Code',
          roomCode: content.roomInfo.code
        });
        break;
      case 'guest joined':
        // If the guest who joined isn't you
        if (content.participant.socketID != yt.participants.me.socketID) {
          let newGuest = {};
          newGuest[content.participant.socketID] = {
            nickname: content.participant.nickname,
            avatar: content.participant.avatar
          };
          yt.addParticipant(newGuest);
          yt.updateMemberList();
          // If you're the host, send your current time to sync the new person
          if (yt.host == yt.participants.me.socketID) {
            this.msgSocketServer('video', {
              state: 'seeked', time: player.getCurrentTime(), roomCode: yt.roomCode
            });
          }
        }
        break;
      case 'guest left':
        yt.removeParticipant(content.participant, false);
        // If the host has changed, save the new host
        if (content.host != yt.host) {
          let newHost = content.host;
          if (newHost == yt.participants.me.socketID) { newHost = 'me' }
          yt.addMessage('is now the host', newHost, true);
          yt.host = content.host;
        }
        break;
      case 'guest was kicked':
        yt.removeParticipant(content.participant, true);
        break;
      case 'loading new video':
        yt.addMessage('loading new video, temporarily disconnecting', content.participant, true);
        yt.removeParticipant(content.participant, false, true);
        break;
    }
  });

  // Message handler for incoming messages from other users
  this.socket.on('message', content => {
    yt.addMessage(content.message, content.socketID, false);
  });

  // Message handler for incoming video status updates from other users
  this.socket.on('video', content => {
    let participant = {};
    participant['time'] = content.time;
    participant['socketID'] = content.socketID;

    switch (content.state) {
      case 'pause':
        player.videoParticipants.pause.push(participant);
        player.videoController('pause');
        break;
      case 'play':
        player.videoParticipants.play.push(participant);
        player.videoController('play');
        break;
      case 'seeked':
        player.videoParticipants.seeked.push(participant);
        player.videoController('seeked or sync', content.time);
        break;
      case 'sync':
        player.videoParticipants.sync.push(participant);
        player.videoController('seeked or sync', content.time);
        break;
      case 'buffer':
        player.videoController('buffer', content.time);
        break;
    }
  });

  // Receive new updated participant nickname / avatar
  this.socket.on('update', content => {
    let updatedParticipant = {};
    updatedParticipant[content.socketID] = content.participant;
    yt.updateParticipants(updatedParticipant);
  });

  this.socket.on('new URL', content => {
    console.log(`New URL from Server: ${content.url}`);
    this.msgPopupScriptAndSW({ message: 'Change URL', url: content.url });
  });

  // If I receive a message to kick myself, send it to the server
  this.socket.on('kick me', content => {
    console.log('kick me');
    if (content.socketID == yt.participants.me.socketID) {
      this.msgSocketServer('kick me');
      yt.toggleErrorMessage(`The host has kicked you from this room`, true);
    }
  });

  // Message handler for incoming errors
  this.socket.on('error', content => {
    yt.toggleErrorMessage(content.message, true);
    console.log(`Error: ${content.message}`);
  });
}

/**
 * Disconnect from the Socket.IO server
 */
messenger.disconnectSocketIO = function () {
  if (this.socket) {
    this.socket.disconnect();
  }
}

/**
 * Check to see if server is able to be connected, if not display error message
 */
messenger.checkServerConnection = function () {
  // using messenger.socket instead of this.socket since here this refers to the window
  if (!messenger.socket.connected && !yt.errorMessageOpen()) {
    yt.toggleErrorMessage('Unable to connect to server', true);
    console.log(`Error: Unable to connect to server`);
  }
}

/**
 * Sends message to the Socket.io server
 * @param {String} type the kind of message being sent (request, message, etc)
 * @param {Object} content the message that is being sent
 */
messenger.msgSocketServer = function (type, content) {
  this.socket.emit(type, content);
}

/**
 * Sends a message to extension popup and service worker (background)
 * @param {Object} message The message to send
 * @param {Function} parseResponse Optional callback function to receive the response message
 */
messenger.msgPopupScriptAndSW = async function (message, parseResponse) {
  browser.runtime.sendMessage(message, response => {
    if (browser.runtime.lastError) {
      console.log('Yellowtail: could not contact popup window or service worker');
      if (typeof parseResponse == 'function') {
        parseResponse(null);
      }
    } else {
      if (typeof parseResponse == 'function') {
        parseResponse(response);
      }
    }
  });
}

/**
 * The message handler for incoming messages
 * @param {Object} request Object pertaining to message request
 * @param {Object} sender Object pertaining to the sender of the message
 * @param {Function} sendResponse Function used to send message response
 */
messenger.parseMessage = function (request, sender, sendResponse) {
  switch (request.message) {

    case 'create room':
      this.initSocketIO();
      visuals.initSidebar();
      player.initializeURL();
      this.msgPopupScriptAndSW({ message: 'Sidebar Open', roomCode: yt.roomCode });
      // Message server with the new room
      this.msgSocketServer('create room', {
        participant: yt.participants.me,
        url: request.url
      });
      sendResponse({ status: 'room creation requested' });
      break;

    case 'join room':
      this.initSocketIO();
      // Name defaults to Host, so if you aren't host, change it to Guest
      if (yt.participants.me.nickname == 'Host') {
        yt.participants.me.nickname = 'Guest';
      }
      visuals.initSidebar();
      player.initializeURL();
      this.msgPopupScriptAndSW({ message: 'Sidebar Open', roomCode: yt.roomCode });
      // Message server with room join request
      this.msgSocketServer('join room', {
        participant: yt.participants.me,
        code: request.roomCode
      });
      sendResponse({ status: 'room joined' });
      break;

    case 'leave room':
      this.msgPopupScriptAndSW({ message: 'Sidebar Closed' });
      this.leaveRoom(sendResponse);
      break;

    case 'is active?':
      let status = yt.isActive() ? 'active' : 'inactive';
      sendResponse({ status: status });
      break;

    case 'new URL':
      if (messenger.socket) {
        if (player.roomURL != request.url) {
          player.roomURL = request.url;
          yt.addMessage('changed the video', 'me', true);
          messenger.msgSocketServer('new URL', {
            roomCode: yt.roomCode,
            url: request.url
          });
        }
      }
  }
}

/**
 * Leave and close a yellow-tail room
 * @param {Function} sendResponse Optional - function used to send message response
 */
messenger.leaveRoom = function (sendResponse) {
  // Disconnect from the socket
  this.disconnectSocketIO();
  // Remove the network check interval
  clearInterval(this.serverCheck);
  // Hide the sidebar / return page back to normal
  visuals.leaveRoom();
  // Respond if a callback function was supplied
  if (typeof sendResponse == 'function') {
    sendResponse({ status: 'room left' });
  }
}