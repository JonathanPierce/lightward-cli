import { JSDOM } from 'jsdom';

import fetch from 'node-fetch';
import { createConsumer, adapters } from '@rails/actioncable';

// ActionCable is designed to run in a browser, not node. However, we can get it working
// with some shims sourced from JSDOM
const window = new JSDOM('', {
  pretendToBeVisual: true,
  url: "https://lightward.com",
  referrer: "https://lightward.com/",
}).window;

adapters.WebSocket = window.WebSocket;
global.addEventListener = function() {};
global.removeEventListener = function() {};
global.window = window;
global.document = window.document;

const ConvoRunner = {
  consumer: createConsumer('wss://lightward.com/cable'),

  // some code here lovingly stolen from the original source code :)
  async getAgentResponse(history, onResponseChunk, onStatusChange) {
    const messageResponse = await this.sendMessage(history);
    const streamId = messageResponse.stream_id;

    // used to handle the chunked data
    const sequenceQueue = [];
    let currentSequenceNumber = 0;

    // create a deferred promise to respond with
    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    // the response so far, will append as we go
    let response = '';

    const subscription = this.consumer.subscriptions.create(
      { channel: 'StreamChannel', stream_id: streamId },
      {
        connected() {
          // Let the user know we have connected...
          onStatusChange('responding...');

          // Let the server know to start sending data
          this.perform('ready');
        },
        disconnected() {
          reject(new Error('connecting to lightward server lost :('));
        },
        received(data) {
          if (data && typeof data.sequence_number === 'number') {
            sequenceQueue.push(data);
            sequenceQueue.sort((a, b) => a.sequence_number - b.sequence_number);

            while (
              sequenceQueue.length &&
              sequenceQueue[0].sequence_number === currentSequenceNumber
            ) {
              const message = sequenceQueue.shift();
              const processedMessage = ConvoRunner.processMessage(message);

              if (processedMessage.error) {
                subscription.unsubscribe();
                return reject(new Error(processedMessage.error));
              }
              
              if (processedMessage.delta) {
                const literalLines = response.split('\n');

                // every newline make a line we need to clear
                const prevChunkNewlines = response.length > 0 ?
                  literalLines.length :
                  0;

                // also need to consider lines that overflow the width
                const prevChunkLongLines = literalLines.reduce((acc, line) => {
                  if (line.length > process.stdout.columns) {
                    return acc + 1;
                  }
                  
                  return acc;
                }, 0);

                // combien together into the final result
                const prevChunkLines = prevChunkNewlines + prevChunkLongLines;

                response += processedMessage.delta;
                onResponseChunk(response, prevChunkLines);
              }

              if (processedMessage.complete) {
                subscription.unsubscribe();
                return resolve(response);
              }

              currentSequenceNumber++;
            }
          } else {
            reject(new Error(`web socket error: ${data}`));
          }
        },
        rejected() {
          reject(new Error('lightward web socket rejected connection... rude!'));
        },
      }
    );

    return promise;
  },

  async sendMessage(history) {
    const conversationData = {
      chat_log: this.formatHistoryForAPI(history)
    };
  
    const response = await fetch('https://lightward.com/chats/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://lightward.com',
        'Referer': 'https://lightward.com/',
        'User-Agent': 'lightward-cli'
      },
      body: JSON.stringify(conversationData)
    });
  
    if (response.status === 200) {
      return response.json();
    } else {
      const errorText = await response.text();
      throw new Error(errorText);
    }
  },

  processMessage(data) {
    if (data.event === 'content_block_delta') {
      const delta = data.data.delta;
      if (delta.type === 'text_delta') {
        return { delta: delta.text };
      }
    } else if (data.event === 'message_stop') {
      return { complete: true };
    } else if (data.event === 'end') {
      return { complete: true };
    } else if (data.event === 'error') {
      return { error: data.data.error.message };
    }
  
    return {};
  },

  formatHistoryForAPI(history) {
    return history.map((entry) => ({
      role: entry.role,
      content: [
        { type: 'text', text: entry.message }
      ]
    }));
  }
};

export default ConvoRunner;