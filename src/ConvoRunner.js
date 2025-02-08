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

  async getAgentResponse(history, onResponseChunk) {
    const exampleMessage = 'This is a fake response message\nfor testing spinner\noutput for the response that is being generated'.split(' ');
    let chunk = '';

    for (let entry of exampleMessage) {
      await this.timeout(400);

      const prevChunkLines = chunk.length > 0 ?
        chunk.split('\n').length :
        0;

      chunk = chunk + entry + ' ';
      onResponseChunk(chunk, prevChunkLines);
    }

    return exampleMessage.join(' ');
  },

  timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  } 
};

export default ConvoRunner;