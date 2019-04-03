/// <reference types="chrome" />

(function() {
  let contentsToSign = [];
  let responseCallbacks = [];
  let currentRequestedContentIndex;

  chrome.browserAction.setBadgeText({text: "0"});

  chrome.runtime.onMessage.addListener((msg, sender, response) => {
    switch (msg.type) {
      case 'pendingRequests':
        if (contentsToSign.length > 0) {
          response({
            success: true,
          });
        } else {
          response({
            success: false
          });
        }
        break;
      case 'getContentToSign':
        if (contentsToSign.length > 0) {
          if(currentRequestedContentIndex) {
            response({
              success: true,
              contentToSign: contentsToSign[currentRequestedContentIndex]
            });
          } else {
            currentRequestedContentIndex = contentsToSign.length - 1;
            response({
              success: true,
              contentToSign: contentsToSign[contentsToSign.length - 1]
            });
          }
        } else {
          response({
            success: false
          });
        }
        break;
      case 'cancelSigning':
        if(responseCallbacks.length > 0) {
          const responseCallback = responseCallbacks[currentRequestedContentIndex];
          responseCallback({
            success: true,
            message: 'Signing canceled'
          });

          chrome.browserAction.getBadgeText({}, function(result) {
            const number = parseInt(result) - 1;
            chrome.browserAction.setBadgeText({text: number.toString()});
          });

          contentsToSign.splice(currentRequestedContentIndex, 1);
          responseCallbacks.splice(currentRequestedContentIndex, 1);
          currentRequestedContentIndex = undefined;
        }
        break;
      case 'sendSignedDataBack':
        if(responseCallbacks.length > 0) {
          const responseCallback = responseCallbacks[currentRequestedContentIndex];
          responseCallback({
            success: true,
            message: msg.data
          });

          chrome.browserAction.getBadgeText({}, function(result) {
            const number = parseInt(result) - 1;
            chrome.browserAction.setBadgeText({text: number.toString()});
          });

          contentsToSign.splice(currentRequestedContentIndex, 1);
          responseCallbacks.splice(currentRequestedContentIndex, 1);
          currentRequestedContentIndex = undefined;
        }
        break;
      default:
        response('unknown request');
        break;
    }
  });

  chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (request.content) {
        contentsToSign.push({
          content: request.content,
          from: sender.url
        });
        responseCallbacks.push(sendResponse);

        chrome.browserAction.getBadgeText({}, function(result) {
          const number = parseInt(result) + 1;
          chrome.browserAction.setBadgeText({text: number.toString()});
        });

        chrome.notifications.create({
          type: "basic",
          title: "Notification message",
          message: "You received data to sign",
          iconUrl: "assets/web-signer-logo.png"
        });
      } else {
        sendResponse({
          success: false,
          error: 'Invalid request'
        });
      }
  });
}());
