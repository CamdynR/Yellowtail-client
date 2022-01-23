// yellowtail class
class Yellowtail {
  constructor() {
    this.ytElem = document.createElement('yellow-tail');
    this.ytElem.innerHTML = `
      <yt-sidebar class="hidden">
        <yt-error class="hidden">
          <yt-err-msg>
            <p></p>
            <button>Exit</button>
          </yt-err-msg>
        </yt-error>
        <yt-header>
          <div id="title-container">
            <yt-title>yellowtail</yt-title>
            <yt-room>Room Code: <yt-code>_____</yt-code></yt-room>
          </div>
          <yt-avatar>
            <img src="">
          </yt-avatar>
          <yt-profile class="hidden">
            <img src="">
            <yt-name>
              <label for="nickname">Nickname</label>
              <input type="text" name="nickname" id="nickname" placeholder="nickname" />
              <button disabled>Save Changes</button>
            </yt-name>
            <button id="room-members">Room Members</button>
          </yt-profile>
          <yt-room-members class="hidden">
            <p class="members-title">Room Members</p>
            <p class="members-capacity">Capacity: <span id="room-capacity"></span></p>
            <yt-member-list></yt-member-list>
            <button id="members-back-btn">Back</button>
          </yt-room-members>
          <yt-avatar-swap class="hidden">
            <img src="${browser.runtime.getURL('components/assets/icons/fish-orange.svg')}" alt="orange fish icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/shrimp-orange.svg')}" alt="orange shrimp icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/squid-orange.svg')}" alt="orange squid icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/dolphin-orange.svg')}" alt="orange dolphin icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/fish-blue.svg')}" alt="blue fish icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/shrimp-blue.svg')}" alt="blue shrimp icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/squid-blue.svg')}" alt="blue squid icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/dolphin-blue.svg')}" alt="blue dolphin icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/fish-green.svg')}" alt="green fish icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/shrimp-green.svg')}" alt="green shrimp icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/squid-green.svg')}" alt="green squid icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/dolphin-green.svg')}" alt="green dolphin icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/fish-yellow.svg')}" alt="yellow fish icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/shrimp-yellow.svg')}" alt="yellow shrimp icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/squid-yellow.svg')}" alt="yellow squid icon" />
            <img src="${browser.runtime.getURL('components/assets/icons/dolphin-yellow.svg')}" alt="yellow dolphin icon" />
          </yt-avatar-swap>
          <yt-avatar-credits class="hidden">
            <p><b>Fish</b> created by <a href="https://thenounproject.com/Ashley5ash/" title="Profile Page" target="_blank">Ashley Fiveash</a> from the Noun Project</p>
            <p><b>Shrimp</b> created by <a href="https://thenounproject.com/rutmer/" title="Profile Page" target="_blank">Rutmer Zijlstra</a> from the Noun Project</p>
            <p><b>Squid</b> created by <a href="https://thenounproject.com/BGBOXXX/" title="Profile Page" target="_blank">BGBOXXX</a> from the Noun Project</p>
            <p><b>Dolphin</b> created by <a href="https://thenounproject.com/Vectorstall/" title="Profile Page" target="_blank">Vectorstall</a> from the Noun Project</p>
          </yt-avatar-credits>
        </yt-header>
        <yt-chat>
          <yt-log></yt-log>
          <textarea type="text" placeholder="Type a message..." spellcheck="false" autocomplete="off" wrap="off"></textarea>
        </yt-chat>
        <button id="sync-videos">Sync Videos</button>
      </yt-sidebar>
    `;

    // Set variable defaults
    this.roomCode = '_____';
    this.avatars = [
      'fish-yellow', 'fish-blue', 'fish-green', 'fish-orange',
      'shrimp-yellow', 'shrimp-blue', 'shrimp-green', 'shrimp-orange',
      'squid-yellow', 'squid-blue', 'squid-green', 'squid-orange',
      'dolphin-yellow', 'dolphin-blue', 'dolphin-green', 'dolphin-orange',
    ];
    // Participants object holds everyone in the room
    this.participants = {
      me: {
        nickname: 'Host',
        avatar: this.avatars[Math.floor(Math.random() * this.avatars.length)]
      }
    };

    // The socketID of the current host
    this.host = null;

    // Set the user Avatar icon randomly by default
    let avatarImg = this.ytElem.querySelector('yt-avatar > img');
    let profileImg = this.ytElem.querySelector('yt-profile > img');
    let altArr = this.participants.me.avatar.split('-');
    let alt = `${altArr[1]} ${altArr[0]} avatar`;
    avatarImg.src = browser.runtime.getURL(`components/assets/icons/${this.participants.me.avatar}.svg`);
    avatarImg.alt = alt;
    profileImg.src = browser.runtime.getURL(`components/assets/icons/${this.participants.me.avatar}.svg`);
    profileImg.alt = alt

    let that = this;
    browser.storage.sync.get(['yt-nickname', 'yt-avatar'], function(user) {
      if (user['yt-nickname']) { 
        that.participants.me.nickname = user['yt-nickname'];
        that.ytElem.querySelector('yt-name > input').placeholder = user['yt-nickname'];
      }
      if (user['yt-avatar']) { 
        that.participants.me.avatar = user['yt-avatar'];
        let altArr = that.participants.me.avatar.split('-');
        let alt = `${altArr[1]} ${altArr[0]} avatar`;
        avatarImg.src = browser.runtime.getURL(`components/assets/icons/${user['yt-avatar']}.svg`);
        avatarImg.alt = alt;
        profileImg.src = browser.runtime.getURL(`components/assets/icons/${user['yt-avatar']}.svg`);
        profileImg.alt = alt;
      } else {
        // If there isn't an initial avatar save this first one for continuinity in server rooms
        browser.storage.sync.set({'yt-avatar': that.participants.me.avatar}, function() {
          console.log('Avatar saved');
        });
      }
    });

    // Prevent any keystrokes from bubbling up and pausing / controlling video player
    this.ytElem.addEventListener('keydown', e => { e.stopPropagation() });
    this.ytElem.addEventListener('keyup', e => { e.stopPropagation() });

    // Show / Hide the profile edit when the avatar in the top right is clicked
    let avatar = this.ytElem.querySelector('yt-avatar');
    avatar.addEventListener('click', () => {
      if (!this.ytElem.querySelector('yt-chat').classList.contains('hidden')) {
        this.ytElem.querySelector('yt-chat').classList.add('hidden');
        this.ytElem.querySelector('yt-profile').classList.remove('hidden');
        this.ytElem.querySelector('yt-avatar-swap').classList.add('hidden');
        this.ytElem.querySelector('yt-avatar-credits').classList.add('hidden');
        this.ytElem.querySelector('#sync-videos').classList.add('hidden');
      } else {
        this.ytElem.querySelector('yt-chat').classList.remove('hidden');
        this.ytElem.querySelector('#sync-videos').classList.remove('hidden');
        this.ytElem.querySelector('yt-profile').classList.add('hidden');
        this.ytElem.querySelector('yt-avatar-swap').classList.add('hidden');
        this.ytElem.querySelector('yt-avatar-credits').classList.add('hidden');
        this.ytElem.querySelector('yt-room-members').classList.add('hidden');
        this.ytElem.querySelector('yt-name > input').value = '';
        this.ytElem.querySelector('yt-name > button').setAttribute('disabled', true);
      }
    });

    // Update the new nickname in the object's variables and in the UI
    function _updateNickname() {
      if (saveBtn.disabled) { return; }
      that.updateParticipants({
        me: {
          nickname: that.ytElem.querySelector('yt-name > input').value,
          avatar: that.participants.me.avatar
        }
      });
      that.ytElem.querySelector('yt-profile').classList.add('hidden');
      that.ytElem.querySelector('yt-avatar-swap').classList.add('hidden');
      that.ytElem.querySelector('yt-avatar-credits').classList.add('hidden');
      that.ytElem.querySelector('#sync-videos').classList.remove('hidden');
      that.ytElem.querySelector('yt-chat').classList.remove('hidden');
    }
 
    // Event listener for save button to save the nickname
    let saveBtn = this.ytElem.querySelector('yt-name > button');
    saveBtn.addEventListener('click', () => {
      _updateNickname();
    });

    // Event listener for the Enter button to save the nickname
    let nicknameInput = this.ytElem.querySelector('yt-name > input');
    nicknameInput.addEventListener('keydown', e => {
      if (e.key == 'Enter') {
        _updateNickname();
      }
    });
    // Event listener for nickname box to remove disabled attribute from the save btn
    nicknameInput.addEventListener('keyup', () => {
      if (nicknameInput.value.length > 0) {
        saveBtn.removeAttribute('disabled');
      } else {
        saveBtn.setAttribute('disabled', true);
      }
    });

    // Add event listeners for each of the avatar swap icons
    let avatarSwaps = this.ytElem.querySelectorAll('yt-avatar-swap > img');
    Array.from(avatarSwaps).forEach(avatar => {
      avatar.addEventListener('click', () => {
        this.updateParticipants({
          me: {
            nickname: this.participants.me.nickname,
            avatar: `${avatar.alt.split(' ')[1]}-${avatar.alt.split(' ')[0]}`
          }
        });
        this.ytElem.querySelector('yt-profile').classList.add('hidden');
        this.ytElem.querySelector('yt-avatar-swap').classList.add('hidden');
        this.ytElem.querySelector('yt-avatar-credits').classList.add('hidden');
        this.ytElem.querySelector('#sync-videos').classList.remove('hidden');
        this.ytElem.querySelector('yt-chat').classList.remove('hidden');
      });
    });

    // Show / Hide the avatar selection menu when the large avatar is clicked
    profileImg.addEventListener('click', () => {
      this.ytElem.querySelector('yt-profile').classList.toggle('hidden');
      this.ytElem.querySelector('yt-avatar-swap').classList.toggle('hidden');
      this.ytElem.querySelector('yt-avatar-credits').classList.toggle('hidden');
    });

    // Add message to screen when enter is hit
    let textarea = this.ytElem.querySelector('textarea');
    textarea.addEventListener('keydown', e => {
      if (e.key == 'Enter') {
        e.preventDefault();
        this.addMessage(textarea.value, 'me', false);
        textarea.value = '';
      }
    });

    // Show the current room members when room-members button is clicked
    let roomSettings = this.ytElem.querySelector('#room-members');
    roomSettings.addEventListener('click', () => {
      let ytProfile = this.ytElem.querySelector('yt-profile');
      let ytRoomMembers = this.ytElem.querySelector('yt-room-members');
      
      ytProfile.classList.add('hidden');
      ytRoomMembers.classList.remove('hidden');

      this.updateMemberList();
    });

    // Go back to profile menu when room-members back button is clicked
    let membersBack = this.ytElem.querySelector('#members-back-btn');
    membersBack.addEventListener('click', () => {
      let ytProfile = this.ytElem.querySelector('yt-profile');
      let ytRoomMembers = this.ytElem.querySelector('yt-room-members');
      ytProfile.classList.remove('hidden');
      ytRoomMembers.classList.add('hidden');
    });
  }
  
  /**
   * Toggles the entire yellow-tail sidebar
   */
  toggleSidebar() {
    let sidebar, ytError;
    sidebar = this.ytElem.querySelector('yt-sidebar');
    ytError = this.ytElem.querySelector('yt-error');

    if (!sidebar.classList.contains('hidden')) {  
      if (this.participants.me.nickname == 'Guest') {
        this.participants.me.nickname = 'Host';
      }
      this.clearAllMessages();
      this.setRoomCode('_____');
      if (!ytError.classList.contains('hidden')) {
        this.toggleErrorMessage('', false);
      }
      // Set variable defaults
      this.participants = {
        me: {
          nickname: this.participants.me.nickname,
          avatar: this.participants.me.avatar
        }
      };
      this.host = null;
    }
    sidebar.classList.toggle('hidden');
  }

  /**
   * Adds the message to the message chat
   * @param {string} message The textual content of the message
   * @param {string} UID The unique identifier of who sent the message
   * @param {boolean} notification Whether the message is a notification (true) or a textual one
   */
  addMessage(message, UID, notification) {
    if (this.ytElem.querySelector('yt-sidebar').classList.contains('hidden')) { return; }

    let participant, yellowMessage;
    participant = this.participants[UID];
    
    if (!participant) {
      return;
    }

    // Escape characters that could be hazardous
    function _sanitizeInput(input) {
      input = input.replace(/</g, '&lt;');
      input = input.replace(/>/g, '&gt;');
      input = input.replace(/\//g, '&#47;');
      input = input.replace(/`/g, '&#96;');
      input = input.replace(/'/g, '&#39;');
      input = input.replace(/"/g, '&#34;');
      return input;
    }

    message = _sanitizeInput(message);

    yellowMessage = document.createElement('yt-message');
    yellowMessage.setAttribute('uid', UID);
    let altArr = participant.avatar.split('-');
    let alt = `${altArr[1]} ${altArr[0]}`;
    yellowMessage.innerHTML = `
      <img src="${browser.runtime.getURL(`components/assets/icons/${participant.avatar}.svg`)}" alt="${participant.nickname} ${alt} avatar" />
      <div class="text-wrapper">
        <p class="user-nickname">${participant.nickname}</p>
        <p class="user-message">${message}</p>
      </div>
    `;

    if (notification) {
      yellowMessage.querySelector('p.user-message').classList.add('notification');
    }

    if (UID == 'me' && !notification) {
      // Function located in messenger.js
      messenger.msgSocketServer('message', {
        message: message,
        room: this.roomCode
      });
    }

    let yellowLog = this.ytElem.querySelector('yt-log');
    yellowLog.insertAdjacentElement('afterbegin', yellowMessage);
  }

  /**
   * Deletes all of the messages in the chat log
   */
  clearAllMessages() {
    this.ytElem.querySelector('yt-log').innerHTML = '';
  }

  /**
   * Popup over entire sidebar with error message
   * @param {String} message The content of the error message to display
   * @param {Boolean} display Whether or not the error message is displaying
   */
  toggleErrorMessage(message, display) {
    let ytError, ytErrMsg;
    ytError = this.ytElem.querySelector('yt-error');
    ytErrMsg = this.ytElem.querySelector('yt-err-msg > p');
    if (display) {
      ytError.classList.remove('hidden');
      ytErrMsg.innerText = message;
    } else {
      ytError.classList.add('hidden');
      ytErrMsg.innerText = '';
    }
  }

  /**
   * Returns whether or not an error message is currently being displayed
   * @return {Boolean} True if an error message is on display
   */
  errorMessageOpen() {
    return !this.ytElem.querySelector('yt-error').classList.contains('hidden');
  }

  /**
   * Adds participant to the room
   * @param {Object} participant - An object containing three keys: ID, nickname, avatar
   * @param {Boolean} host - Optional, if the participant being added is the host
   */
  addParticipant(participant, host) {
    let UID = Object.keys(participant)[0];

    // Give the guest a name if the one they sent is empty
    if (participant[UID].nickname.length == 0) {
      participant[UID].nickname = 'Guest';
    }
    // Give the guest an avatar if the one they sent doesn't exist
    if (!this.avatars.includes(participant[UID].avatar)) {
      participant[UID].avatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
    }

    // Add participant to participants object
    this.participants[UID] = participant[UID];

    // Add message to join the room
    if (host) {
      this.addMessage(`created room ${this.roomCode}`, UID, true);
    } else {
      this.addMessage('has joined the room', UID, true);
    }
  }

  /**
   * Removes a participant from the room
   * @param {Object} participant - An object containing three keys: ID, nickname, avatar
   * @param {Boolean} wasKicked - True if user was kicked, false if user left autonomously
   * @param {Boolean} newVideo - Optional, true if user is leaving to rejoin for new video
   */
  removeParticipant(participant, wasKicked, newVideo) {
    let UID = Object.keys(participant)[0];

    if (!wasKicked && !newVideo) {
      // Message the channel that the user has left
      this.addMessage('has left the room', UID, true);
    } else if (!newVideo) {
      // Message the channel that the user was kicked
      this.addMessage('was kicked by host', UID, true);
    }

    // Remove participant from the participants object
    delete this.participants[UID];

    // Update the member list with the removed person
    this.updateMemberList();
  }
  
  /**
   * Updates the chat log with new names and user icons. If the user changes their
   * own avatar / nickname, that is reflected in the profile menu as well.
   * @param {Object} updatedParticipant The new participant object containing the
   *        UID as the key, and another object with avatar and nickname as keys
   * @returns early if nothing actually changed
   */
  updateParticipants(updatedParticipant) {
    let UID, nickname, avatar, newNickname, newAvatar, nicknameInput, saveBtn;

    // Escape characters that could be hazardous
    function _sanitizeInput(input) {
      input = input.replace(/</g, '&lt;');
      input = input.replace(/>/g, '&gt;');
      input = input.replace(/\//g, '&#47;');
      input = input.replace(/`/g, '&#96;');
      input = input.replace(/'/g, '&#39;');
      input = input.replace(/"/g, '&#34;');
      return input;
    }
    
    UID = Object.keys(updatedParticipant)[0];
    nickname = _sanitizeInput(updatedParticipant[UID].nickname);
    avatar = _sanitizeInput(updatedParticipant[UID].avatar);
    newNickname = this.participants[UID].nickname != nickname;
    newAvatar = this.participants[UID].avatar != avatar;

    // Update the participant in the participants Object
    if (this.avatars.includes(avatar)) {
      this.participants[UID].avatar = avatar;
    }
    if (nickname.length > 0) {
      this.participants[UID].nickname = nickname;
    }

    if (UID == 'me') {
      // Function located in messenger.js
      messenger.msgSocketServer('update', {
        participant: this.participants.me,
        roomCode: this.roomCode,
      });

      // Grab the nickname input to clear it out
      nicknameInput = this.ytElem.querySelector('yt-name > input');
      saveBtn = this.ytElem.querySelector('yt-name > button');
      // If nothing changed, return
      if (!newNickname && !newAvatar) { 
        nicknameInput.value = '';
        saveBtn.setAttribute('disabled', true);
        return; 
      }
      // Update Nickname
      if (nickname != 'Host' && nickname != 'Guest' && nickname.length > 0) {
        nicknameInput.placeholder = nickname;
      }
      nicknameInput.value = '';
      saveBtn.setAttribute('disabled', true);
      // Update User Icon
      let avatarImg = this.ytElem.querySelector('yt-avatar > img');
      let profileImg = this.ytElem.querySelector('yt-profile > img');
      let altArr = avatar.split('-');
      let alt = `${nickname} ${altArr[1]} ${altArr[0]} avatar`;
      avatarImg.src = browser.runtime.getURL(`components/assets/icons/${avatar}.svg`);
      avatarImg.alt = alt;
      profileImg.src = browser.runtime.getURL(`components/assets/icons/${avatar}.svg`);
      profileImg.alt = alt;
    }

    // Update the chat log
    let messages = Array.from(this.ytElem.querySelectorAll(`yt-message[uid="${UID}"]`));
    messages.forEach(message => {
      let img = message.querySelector('img');
      let altArr = avatar.split('-');
      let alt = `${nickname} ${altArr[1]} ${altArr[0]} avatar`;
      img.src = browser.runtime.getURL(`components/assets/icons/${avatar}.svg`);
      img.alt = alt;
      message.querySelector('.user-nickname').innerHTML = nickname;
    });

    // Send message to chat
    if (newNickname) {
      this.addMessage(`updated their user nickname`, UID, true);
      // Save it using the Chrome extension storage API.
      if (UID == 'me') {
        browser.storage.sync.set({'yt-nickname': nickname}, function() {
          console.log('Nickname saved');
        });
      }
    } else {
      this.addMessage(`updated their user icon`, UID, true);
      // Save it using the Chrome extension storage API.
      if (UID == 'me') {
        browser.storage.sync.set({'yt-avatar': avatar}, function() {
          console.log('Avatar saved');
        });
      }
    }
  }

  /**
   * In the member list menu this constructs and adds all of the current members in the room
   */
  updateMemberList() {
    let roomCapacity = this.ytElem.querySelector('#room-capacity');
    let memberList = this.ytElem.querySelector('yt-member-list');
    let participants = Object.keys(this.participants);

    roomCapacity.innerText = `${Object.keys(this.participants).length}/4`;

    memberList.innerHTML = '';
    participants.forEach(socketID => {
      let member = this.participants[socketID];
      let ytMember = document.createElement('yt-member');
      let animalName = `${member.avatar.split('-')[1]} ${member.avatar.split('-')[0]}`;
      let title;

      if (socketID != 'me') {
        title = this.host == socketID ? 'Host' : 'Guest';
      } else {
        title = this.host == this.participants.me.socketID ? 'Host' : 'Guest';
      }

      let hidden = 'hidden';
      if (this.host == this.participants.me.socketID && title == 'Guest') {
        hidden = '';
      }

      ytMember.innerHTML = `
        <img src="${browser.runtime.getURL(`components/assets/icons/${member.avatar}.svg`)}" alt="${member.nickname} ${animalName} avatar" />
        <div class="text-wrapper">
          <p class="member-nickname">${member.nickname}</p>
          <p class="member-title">${title}</p>
        </div>
        <button class="kick-btn ${hidden}">Kick</button>
      `;

      ytMember.querySelector('.kick-btn').addEventListener('click', () => {
        messenger.msgSocketServer('kick participant', {
          socketID: socketID, roomCode: this.roomCode
        });
      });

      if (title == 'Host') {
        memberList.insertAdjacentElement('afterbegin', ytMember);
      } else {
        memberList.appendChild(ytMember);
      }
    });
  }

  /**
   * Sets the room code in the <yt-code> element
   * @param {String} code The new room code you'd like to set
   */
  setRoomCode(code) {
    this.roomCode = code;
    this.ytElem.querySelector('yt-code').innerText = code;
  }

  /**
   * Returns true if sidebar is open, false otherwise
   * @returns {Boolean} Whether or not the sidebar is open
   */
  isActive() {
    let sidebar = this.ytElem.querySelector('yt-sidebar');
    return !sidebar.classList.contains('hidden');
  }
}