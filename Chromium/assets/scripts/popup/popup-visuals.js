// popup-visuals.js

const visuals = {};

/**
 * Opens / Closes the modal and displays the given message.
 * Defined up here so that functions outside DOMContentLoaded can reach it.
 * @param {Boolean} open Whether or not the modal is opening or closing
 * @param {String} msg (optional) the message to display in the modal
 * @param {Boolean} backBtn (optional) If open, whether or not to display the backBtn
 */
visuals.modalHandler = function(open, msg, backBtn) {
  const modal = document.getElementById('modal');
  if (!open) {
    modal.classList.add('hidden');
    modal.querySelector('button').classList.add('hidden');
    modal.querySelector('p').innerHTML = '';
  } else {
    modal.classList.remove('hidden');
    modal.querySelector('p').innerHTML = msg;
    if (backBtn) {
      modal.querySelector('button').classList.remove('hidden');
    }
  }
}

/**
 * Shows / Hides the appropriate buttons / inputs based on which button was clicked
 * @param {String} buttonClicked Which button was clicked
 * @param {Boolean} onCrunchyroll If currently on crunchyroll
 */
visuals.uiHandler = function(buttonClicked, onCrunchyroll) {
  switch (buttonClicked) {
    case 'join':
      visuals.setJoin();
      break;
    case 'create':
      visuals.setCreate();
      break;
    default:
      visuals.uiReset(onCrunchyroll);
  }
}

visuals.setOnCrunchyrollVideo = function() {
  createBtn.removeAttribute('disabled');
  createBtn.removeAttribute('title');
}

/**
 * Sets the popup UI for when the Join button is clicked for the first time
 */
visuals.setJoin = function() {
  // Set joinBtn
  joinBtn.innerText = 'Cancel';
  joinBtn.classList.add('joinActive');
  // Set createBtn and roomCodeForm
  createBtn.innerText = 'Join';
  createBtn.setAttribute('title', '');
  createBtn.setAttribute('disabled', true);
  createBtn.setAttribute('title', 'Please enter a valid Room Code');
  roomCodeForm.classList.remove('hidden');
  roomCodeForm.querySelector('#roomCode').value = '';
  // Set the remaining elements
  main.classList.add('roomCodeShowing');
  body.classList.add('roomCodeShowing');
  contentWrapper.classList.add('roomCodeShowing');
}

/**
 * Sets the popup UI for when the Create button is clicked
 */
visuals.setCreate = function() {
  // Show Leave Button
  leaveBtn.classList.remove('hidden');
  // Hide other buttons / forms
  joinBtn.classList.add('hidden');
  createBtn.classList.add('hidden');
  btnWrapper.classList.add('leaveRoom');
  roomCodeForm.classList.add('hidden');
  // Set the remaining elements
  main.classList.remove('roomCodeShowing');
  body.classList.remove('roomCodeShowing');
  contentWrapper.classList.remove('roomCodeShowing');
}

/**
 * Sets all elements' classes / CSS back to default
 */
visuals.uiReset = function(onCrunchyroll) {
  // Reset joinBtn
  joinBtn.innerText = 'Join Room';
  joinBtn.classList.remove('hidden');
  joinBtn.classList.remove('joinActive');
  // Reset createBtn
  createBtn.innerText = 'Create Room';
  createBtn.classList.remove('hidden');
  // Reset leaveBtn & btnWrapper
  leaveBtn.classList.add('hidden');
  btnWrapper.classList.remove('leaveRoom');
  // Reset the remaining elements
  roomCodeForm.classList.add('hidden');
  main.classList.remove('roomCodeShowing');
  body.classList.remove('roomCodeShowing');
  contentWrapper.classList.remove('roomCodeShowing');
  if (onCrunchyroll) {
    // Clear out the room code input
    createBtn.removeAttribute('disabled');
    createBtn.removeAttribute('title');
  } else {
    createBtn.setAttribute('disabled', true);
    createBtn.setAttribute('title', 'To create a room, please open a video on the crunchyroll website');
  }
  roomCode.value = '';
}