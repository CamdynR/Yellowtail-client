// popup.js

// When messenger.js loads (a content script) it will try to ping popup.js to see
// if it loaded because it was trying to join a room. It will check this variable.
let tryingToJoin = false;
let onCrunchyroll = false;

// Initializing them here instead of popup-visuals so that I only need one 
// DOMContentLoaded listener and since a lot of events still need to be bound to elements
let body, btnWrapper, contentWrapper, createBtn, joinBtn, leaveBtn, main,
modal, roomCode, roomCodeForm;

document.addEventListener('DOMContentLoaded', () => {
  body = document.body;
  btnWrapper = document.getElementById('btnWrapper');
  contentWrapper = document.getElementById('contentWrapper');
  createBtn = document.getElementById('createBtn');
  joinBtn = document.getElementById('joinBtn');
  leaveBtn = document.getElementById('leaveBtn');
  main = document.querySelector('main');
  modal = document.getElementById('modal');
  roomCode = document.getElementById('roomCode');
  roomCodeForm = document.getElementById('roomCodeForm');

  // Check to see if the user is on a crunchyroll video
  checkOnCrunchyroll();

  // When the modal back button is clicked, remove the modal and reset the UI
  modal.querySelector('button').addEventListener('click', () => {
    visuals.modalHandler(false);
    visuals.uiHandler('', onCrunchyroll);
  });

  // Make sure the roomCode input is always capitalized, adjust createBtn based
  // on whether the current room code is valid
  roomCode.addEventListener('keyup', () => {
    roomCode.value = roomCode.value.toUpperCase();
    if (parseRoomCode()) {
      createBtn.removeAttribute('disabled');
      createBtn.setAttribute('title', 'Join Room');
    } else {
      createBtn.setAttribute('disabled', true);
      createBtn.setAttribute('title', 'Please enter a valid Room Code');
    }
  });

  // Toggle the join button to join and cancel
  joinBtn.addEventListener('click', () => {
    let buttonClicked = joinBtn.innerText != 'Cancel' ? 'join': 'cancel';
    visuals.uiHandler(buttonClicked, onCrunchyroll);
  });

  // Handles the create button (which also acts as the join button if entering a room code)
  createBtn.addEventListener('click', () => {
    // If the button is acting as the join button
    if (joinBtn.classList.contains('joinActive')) {
      visuals.modalHandler(true, `Loading...<br />Do not close this popup`, false);
      goToRoomURL();
    // Otherwise it's acting as the create button
    } else {
      getCurrentTabURL().then(URL => {
        msgContentScript({ message: 'create room', url: URL });
      });
    }
    visuals.uiHandler('create', onCrunchyroll);
  });

  // Sends signal to exit the current room, reverts UI back to normal
  leaveBtn.addEventListener('click', () => {
    msgContentScript({ message: 'leave room' });
    visuals.uiHandler('leave', onCrunchyroll);
  });

  // If the form is submitted (such as with Enter) then attempt to go to the room
  roomCodeForm.addEventListener('submit', e => {
    e.preventDefault();
    visuals.modalHandler(true, `Loading...<br />Do not close this popup`, false);
    goToRoomURL();
    visuals.uiHandler('create', onCrunchyroll);
  });
});

/**
 * Checks to see if the user is on a crunchyroll video (and adjusts UI accordingly)
 * Then checks to see if the sidebar is currently open
 */
function checkOnCrunchyroll() {
  // If a video is open, check to see if there is an open sidebar
  msgContentScript({ message: 'is active?' }, response => {
    // If there's a response at all, the user is on a crunchyroll video
    if (!browser.runtime.lastError) {
      visuals.setOnCrunchyrollVideo();
      onCrunchyroll = true;
      // If the sidebar is active, then show the 'leave room' button
      if (response && response.status && response.status == 'active') {
        visuals.uiHandler('create', onCrunchyroll);
      }
    } else {
      onCrunchyroll = false;
    }
  });
}

/**
 * Determine whether or not the given input is valid
 * @return {Boolean} Whether the keycode is a valid format
 */
function parseRoomCode() {
  const letterSet = 'BCDFGHJKLMNPQRSTVWXYZ';
  const currCode = roomCode.value;
  if (currCode.length == 5) {
    for (let i = 0; i < 5; i++) {
      if (!letterSet.includes(currCode.charAt(i))) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Grabs the current tab URL to send to the server
 * @returns {String} The current tab's URL
 */
async function getCurrentTabURL() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await browser.tabs.query(queryOptions);
  return tab?.url;
}

/**
 * Fetches the URL for the inputted room, then routes the current tab there.
 * This starts the room joining process.
 */
function goToRoomURL() {
  // Check to make sure the create button is visible to prevent premature lookups
  if (!createBtn.getAttribute('disabled')) {
    fetch(`https://yellowtail.app/socket/url/${roomCode.value}`)
    .then(response => {
      if (response.status == 200) {
        return response.text();
      } else {
        visuals.modalHandler(true, `<strong>Error:</strong> Room does not exist`, true);
      }
    })
    .then(url => {
      browser.tabs.update(null, { url: url });
      tryingToJoin = true;
    });
  }
}

/************** Message Passing / Handling Below **************/

// Receives messages from the popup
browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    parseMessage(request, sender, sendResponse);
  }
);

/**
 * The message handler for incoming messages
 * @param {Object} request Object pertaining to message request
 * @param {Object} sender Object pertaining to the sender of the message
 * @param {Function} sendResponse Function used to send message response
 */
function parseMessage(request, sender, sendResponse) {
  if (sender.tab) {
    // Message from a content script
    if (request.message == 'Ready to join' && tryingToJoin) {
      // If the content script is loaded and the user is trying to join a room,
      // message the content script to set up the sidebar for joining a room
      msgContentScript({ message: 'join room', roomCode: roomCode.value });
      visuals.modalHandler(false);
    }
  }
}

/**
 * Sends a message to the content scripts
 * @param {Object} message The message to send
 * @param {Function} parseResponse Optional callback function to receive the response message
 */
function msgContentScript(message, parseResponse) {
  browser.tabs.query({active: true, currentWindow: true}, tabs => {
    browser.tabs.sendMessage(tabs[0].id, message, response => {
      if (browser.runtime.lastError) {
        console.log('Yellowtail: could not contact content script or service worker');
        if (typeof parseResponse == 'function') {
          parseResponse(null);
        }
      } else {
        if (typeof parseResponse == 'function') {
          parseResponse(response);
        }
      }
    });
  });
}