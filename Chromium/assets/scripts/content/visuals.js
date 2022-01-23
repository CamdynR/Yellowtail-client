// visuals.js

// Visuals object holds variables and methods related to UI changes
const visuals = {};

/**
 * Toggles fullscreen UI changes for the Crunchyroll page,
 * essentially just shrinks <video> player & controls
 */
visuals.toggleFullScreen = function() {
  if (document.fullscreenElement) {
    // Modify the video and controlls width when in fullscreen
    document.querySelector('#velocity-player-package').classList.add('video-width');
    document.querySelector('#velocity-controls-package').classList.add('video-width');
  } else {
    // Modify the video and controlls width when leaving full screen
    document.querySelector('#velocity-player-package').classList.remove('video-width');
    document.querySelector('#velocity-controls-package').classList.remove('video-width');
  }
}

/**
 * Initialize the sidebar when the application is launched
 */
visuals.initSidebar = function() {
  // Find yellow-tail, toggle it open, add created room message, adjust CSS
  yt.toggleSidebar();
  yt.addMessage('connecting...', 'me', true);
  document.body.classList.add('body-width');

  // Add event listener for exit button on error message
  let errorBtn = yt.ytElem.querySelector('yt-err-msg > button');
  errorBtn.onclick = function() {
    messenger.leaveRoom();
  };
}

/**
 * Once room has been created on server, set up the UI
 * @param {String} roomCode Room code of the room that was just created
 */
visuals.roomCreated = function(roomCode) {
  yt.addMessage(`created room ${roomCode}`, 'me', true);
  yt.setRoomCode(roomCode); // set room code
  yt.host = yt.participants.me.socketID; // set yourself as host
  player.videoController('pause');
}

/**
 * Once room has been joined on the server, set up the UI
 * @param {Object} roomInfo Room info of the room that was just created
 */
visuals.roomJoined = function(roomInfo) {
  yt.setRoomCode(roomInfo.code);
  // Add the room host separately for a separate message
  let roomHost = {};
  roomHost[roomInfo.host.socketID] = {
    nickname: roomInfo.host.nickname,
    avatar: roomInfo.host.avatar
  };
  yt.addParticipant(roomHost, true);
  yt.host = roomInfo.host.socketID; // Save the room host
  // Add the rest of the guests
  roomInfo.guests.forEach(guest => {
    let newParticipant = {};
    newParticipant[guest.socketID] = {
      nickname: guest.nickname,
      avatar: guest.avatar
    };
    yt.addParticipant(newParticipant);
  });
  // Add yourself once everyone else has been added
  yt.addMessage(`joined the room`, 'me', true);
  player.videoController('pause');
}

/**
 * Hide the sidebar and return the Crunchyroll page back to normal
 */
visuals.leaveRoom = function() {
  // Hide the yt sidebar
  yt.toggleSidebar();
  // Return the document CSS back to normal
  document.body.classList.remove('body-width');
}