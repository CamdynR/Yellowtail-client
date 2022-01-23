// background.js - Service Worker
const browser = chrome;
let changedEpisode = false;
let roomActive = false;
let currRoomCode;

// Detects tab URL changes
browser.tabs.onUpdated.addListener(function
  (tabId, changeInfo, tab) {
    // read changeInfo data and do something with it (like read the url)
    if (changeInfo.url && roomActive) {
      msgContentScript({
        message: 'new URL',
        url: changeInfo.url
      });
    }
  }
);

// Listens for messages from Content Script
browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (sender.tab && request.message) {
      switch (request.message) {
        case 'Sidebar Open':
          roomActive = true;
          break;
        case 'Sidebar Closed':
          currRoomCode = null;
          roomActive = false;
          break;
        case 'Get URL':
          sendResponse(sender.tab.url);
          break;
        case 'Change URL':
          changedEpisode = true;
          goToURL(request.url);
          break;
        case 'Set Room Code':
          currRoomCode = request.roomCode;
          console.log(`Set Room Code: ${request.roomCode}`);
          break;
        case 'Ready to join':
          if (changedEpisode) {
            changedEpisode = false;
            console.log(currRoomCode);
            msgContentScript({
              message: 'join room',
              roomCode: currRoomCode
            });
          }
      }
    }
  }
);

/**
 * Sends a message to extension popup and content script
 * @param {Object} message The message to send
 * @param {Function} parseResponse Optional callback function to receive the response message
 */
async function msgContentScript(message, parseResponse) {
  browser.tabs.query({active: true, currentWindow: true}, function(tabs){
    browser.tabs.sendMessage(tabs[0].id, message, response => {
      if (browser.runtime.lastError) {
        console.log('Yellowtail: could not contact content script');
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

/**
 * Changes the current active tab to the new specified URL
 * @param {String} url The new URL to route to
 */
function goToURL(url) {
  browser.tabs.update(null, { url: url });
}

// Logs whenever there is a history state change
browser.webNavigation.onHistoryStateUpdated.addListener(e => {
  console.log('History State Changed');
  console.log(e);
})