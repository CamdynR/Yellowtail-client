// player.js - Used to interact with anything inside the crunchyroll video player iframe

// Player Object to keep code isolated in lieu of modules
const player = {};
let yt = {};

// Queues for play, pause, seeked, and sync actions from other participants
player.videoParticipants = {
  play: [],
  pause: [],
  seeked: [],
  sync: [],
  buffer: []
};

player.video = null; // The <video> element playing the crunchyroll anime video

// Insert the fonts and element when ready
document.addEventListener('DOMContentLoaded', () => {
  player.initializePlayer();
});

// Toggle fullscreen UI
document.addEventListener('fullscreenchange', () => {
  visuals.toggleFullScreen();
});

// Initialize the <yellow-tail> element and assign event listeners to
// the main <video> element
player.initializePlayer = function() {
  // Create the <yellow-tail> element to inject
  yt = new Yellowtail();
  document.querySelector('#vilosRoot').insertAdjacentElement('beforeend', yt.ytElem);

  // Attach event listeners to the <video> element
  this.video = document.querySelector('#player0');

  // Video Pause Handler
  this.video.addEventListener('pause', () => { 
    // If the pause came from me
    if (this.videoParticipants.pause.length == 0 && this.videoParticipants.buffer.length == 0) {
      // Grab the current video time to display it in the message
      let newTime = player.formatTime(player.getCurrentTime());
      yt.addMessage(`paused the video at ${newTime}`, 'me', true);
      // Send a message to the server that the video was paused
      if (messenger.socket) {
        messenger.msgSocketServer('video', { 
          state: 'pause', time: player.getCurrentTime(), roomCode: yt.roomCode 
        });
      }
    // If the pause came from another user
    } else if (this.videoParticipants.buffer.length == 0) {
      // Grab and format the time of the new pause
      let newTime = player.formatTime(this.videoParticipants.pause[0].time);
      // Format message using the new time
      let msg = `paused the video at ${newTime}`;
      // Grab socket ID of pauser to message the chat
      let socketID = this.videoParticipants.pause[0].socketID;
      yt.addMessage(msg, socketID, true);
      // Remove the pause from the array
      this.videoParticipants.pause.shift();
    // Another user is buffering
    } else {
      // Format message using the new time
      let msg = 'buffering...';
      // Grab socket ID of bufferer to message the chat
      let socketID = this.videoParticipants.buffer[0].socketID;
      yt.addMessage(msg, socketID, true);
      // Remove the buffer from the array
      this.videoParticipants.buffer.shift();
    }
  });

  // Video Play Handler
  this.video.addEventListener('play', () => { 
    // If the play came from me
    if (this.videoParticipants.play.length == 0) {
      // Grab the current video time to display it in the message
      let newTime = player.formatTime(player.getCurrentTime());
      yt.addMessage(`played the video at ${newTime}`, 'me', true);
      // Send a message to the server that the video was played
      if (messenger.socket) {
        messenger.msgSocketServer('video', { 
          state: 'play', time: player.getCurrentTime(), roomCode: yt.roomCode 
        });
      }
    // If the play came from another user
    } else {
      // Grab and format the time of the new play
      let newTime = player.formatTime(this.videoParticipants.play[0].time);
      // Format message using the new time
      let msg = `played the video at ${newTime}`;
      // Grab socket ID of player to message the chat
      let socketID = this.videoParticipants.play[0].socketID;
      yt.addMessage(msg, socketID, true);
      // Remove the play from the array
      this.videoParticipants.play.shift();
    }
  });

  // Video seek handler
  this.video.addEventListener('seeked', () => { 
    // If the seek came from me
    if (this.videoParticipants.seeked.length == 0 && this.videoParticipants.sync.length == 0) {
      // Grab the current video time to display it in the message
      let newTime = player.formatTime(player.getCurrentTime());
      yt.addMessage(`jumped to ${newTime}`, 'me', true);
      // Send a message to the server that the video was seeked
      if (messenger.socket) {
        messenger.msgSocketServer('video', { 
          state: 'seeked', time: player.getCurrentTime(), roomCode: yt.roomCode 
        });
      }
    // If the seek came from another user
    } else if (this.videoParticipants.sync.length == 0) {
      // Grab and format the time of the new seek
      let newTime = player.formatTime(this.videoParticipants.seeked[0].time);
      // Format message using the new time
      let msg = `jumped to ${newTime}`;
      // Grab socket ID of seeker to message the chat
      let socketID = this.videoParticipants.seeked[0].socketID;
      yt.addMessage(msg, socketID, true);
      // Remove the seek from the array
      this.videoParticipants.seeked.shift();
    // If the seek was actually a sync
    } else {
      // Grab and format the time of the new seek
      let newTime = player.formatTime(this.videoParticipants.sync[0].time);
      // Format message using the new time
      let msg = `synced to ${newTime}`;
      // Grab socket ID of seeker to message the chat
      let socketID = this.videoParticipants.sync[0].socketID;
      yt.addMessage(msg, socketID, true);
      // Remove the seek from the array
      this.videoParticipants.sync.shift();
    }
  });

  // Video buffering event handler
  let that = this;
  function videoBuffering() {
    console.log('video buffering');
    // If the buffer came from me
    if (that.videoParticipants.buffer.length == 0) {
      yt.addMessage(`buffering...`, 'me', true);
      // Send a message to the server that the video was seeked
      if (messenger.socket) {
        messenger.msgSocketServer('video', { 
          state: 'buffer', time: player.getCurrentTime(), roomCode: yt.roomCode 
        });
      }
    } else {
      console.log(that.videoParticipants.buffer);
    }
  }

  // this.video.addEventListener('stalled', () => { videoBuffering() });
  // this.video.addEventListener('suspend', () => { videoBuffering() });
  // this.video.addEventListener('waiting', () => { videoBuffering() });

  let syncBtn = document.querySelector('yellow-tail #sync-videos');
  syncBtn.addEventListener('click', () => {
    if (messenger.socket && yt.roomCode != '_____') {
      let syncTime = player.getCurrentTime();
      yt.addMessage(`synced to ${player.formatTime(syncTime)}`, 'me', true);
      messenger.msgSocketServer('video', { 
        state: 'sync', time: syncTime, roomCode: yt.roomCode 
      });
    }
  });
}

/**
 * Gets the URL for the current Crunchyroll video and stores it as the room's URL.
 * This is later referenced for episode changes
 */
player.initializeURL = function() {
  messenger.msgPopupScriptAndSW({ message: 'Get URL' }, URL => {
    this.roomURL = URL;
  });
}

/**
 * Converts a large amount of seconds to a nicely formatted MM:SS time string
 * e.g. (Number) 185 seconds --> (String) 3:05
 * @param {Number} totalSeconds The number of total seconds to convert
 * @return {String} Formatted time string in MM:SS (or H:MM:SS or HH:MM:SS if applicable)
 */
player.formatTime = function(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) { return '0:00' }
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Math.floor(totalSeconds - (minutes * 60));
  seconds = seconds.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false
  });
  if (minutes < 60) {
    return `${minutes}:${seconds}`;
  } else {
    let hours = Math.floor(minutes / 60);
    minutes = Math.floor(minutes - (hours * 60));
    return `${hours}:${minutes}:${seconds}`;
  }
}

/**
 * Controls the video element
 * @param {String} action play, pause, or seek video
 * @param {Number} time (Optional) To the skip to
 */
player.videoController = function(action, time) {
  if (this.video) {
    switch (action) {
      case 'pause':
        this.video.pause();
        break;
      case 'play':
        this.video.play();
        break;
      case 'seeked or sync':
        if (time) {
          this.video.currentTime = time;
          this.video.pause();
        } else {
          this.video.currentTime = 0;
          this.video.pause();
        }
        break;
    }
  } else {
    console.log('Video player has not been assigned yet');
  }
}

/**
 * Returns whether or not the video player is currently paused
 * @return {Boolean} whether or not the video player is paused (true for is paused)
 */
player.videoIsPaused = function() {
  if (this.video) {
    return this.video.paused;
  } else {
    console.log('Video player has not been assigned yet');
  }
}

/**
 * Returns the current time in seconds of the video element
 * @return {Number} the currentTime property of the video element
 */
player.getCurrentTime = function() {
  if (this.video) {
    return this.video.currentTime;
  } else {
    console.log('Video player has not been assigned yet');
  }
}