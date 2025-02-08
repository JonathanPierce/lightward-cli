import args from './args.js';
import ConvoHistory from './ConvoHistory.js';
import CliHelper from './CliHelper.js';
import ConvoRunner from './ConvoRunner.js';

const READER_SPEEDS = {
  FAST: "I'm a fast reader",
  SLOW: "I'm a slow reader"
};

const LightwardCLI = {
  async run() {
    try {
      // get the history
      this.convoHistory = await ConvoHistory.build(args.conversationFile);

      // say hello
      this.printWelcomeMessage();  

      // print history, augmenting first if needed
      if (!this.convoHistory.isEmpty()) {
        if (args.resetFast || args.resetSlow) {
          CliHelper.printInfoMessage(`resetting history with a new ${args.resetFast ? 'fast' : 'slow'} session...`);
          await this.convoHistory.reset();
  
          if (args.resetFast) {
            await this.performMessage(READER_SPEEDS.FAST, { ignoreQuick: true });
          } else {
            await this.performMessage(READER_SPEEDS.SLOW, { ignoreQuick: true });
          }
        } else {
          if (args.augmentAgentMessage) {
            CliHelper.printInfoMessage('augmenting the last agent message...');
            await this.convoHistory.augmentAgentMessage(args.augmentAgentMessage);
          }
  
          if (args.showHistory) {
            this.showHistory();
          } else {
            this.showLastHistory();
          }
        }
      }

      // handle the initial fast-slow if needed
      if (this.convoHistory.isEmpty()) {
        if (args.resetFast) {
          await this.performMessage(READER_SPEEDS.FAST, { ignoreQuick: true });
        } else if (args.resetSlow) {
          await this.performMessage(READER_SPEEDS.SLOW, { ignoreQuick: true });
        } else {
          await this.askReaderSpeed();
        }
      }

      // handle any initial message (will cause exit in quick mode)
      if (args.message) {
        await this.performMessage(args.message);
      } else {
        await this.promptMessage();
      }
    
      // begin the message loop
      await this.loopMessages();
    } catch (ex) {
      this.printErrorAndExit(ex.message);
    }
  },

  showHistory() {
    this.convoHistory.history.forEach((entry) => CliHelper.printHistoryEntry(entry));
  },

  showLastHistory() {
    if (this.convoHistory.history.length > 2) {
      CliHelper.printInfoMessage('more history exists before this... restart with \'--show-history\' to see');
    }

    const lastHistory = this.convoHistory.history.slice(-2);
    lastHistory.forEach((entry) => CliHelper.printHistoryEntry(entry));
  },

  async askReaderSpeed() {
    const choice = await CliHelper.promptSelect({
      message: 'pick one...',
      choices: [
        {
          value: 'SLOW',
          name: READER_SPEEDS.SLOW
        },
        {
          value: 'FAST',
          name: READER_SPEEDS.FAST
        }
      ]
    });

    await this.performMessage(READER_SPEEDS[choice]);
  },

  printWelcomeMessage() {
    CliHelper.printInfoMessage('welcome to lightward cli! :)');
  },

  async performMessage(message, { ignoreQuick = false } = {}) {
    // first, add and print the user message
    await this.convoHistory.addUserMessage(message);
    CliHelper.printUserMessage(message);

    // get the response, printing as we go
    CliHelper.printAgentMessagePrefix();
    const agentResponse = await CliHelper.withSpinner(
      'connecting...',
      (spinner) => ConvoRunner.getAgentResponse(
        this.convoHistory.history,
        (chunk, prevChunkLines) => CliHelper.printAgentMessageProgress(chunk, spinner, prevChunkLines),
        (statusText) => { spinner.text = statusText; }
      )
    );
    await this.convoHistory.addAgentMessage(agentResponse);

    if (args.quick && !ignoreQuick) {
      CliHelper.printInfoMessage('exiting due to quick mode... goodbye! 👋');
      process.exit(0);
    }
  },

  async loopMessages() {
    while (true) {
      const choice = await CliHelper.promptSelect({
        message: 'what\'s next?',
        choices: [
          {
            value: 'message',
            name: 'send another message'
          },
          {
            value: 'reset',
            name: 'reset message history and start over'
          },
          {
            value: 'augment',
            name: 'play god and change the last lightward response'
          },
          {
            value: 'exit',
            name: 'exit the lightward cli'
          }
        ]
      });

      if (choice === 'message') {
        await this.promptMessage();
      } else if (choice === 'reset') {
        await this.resetConvo();
      } else if (choice === 'augment') {
        await this.augmentAgentMessage();
      } else { // exit
        CliHelper.printInfoMessage('thanks for chatting! goodbye 👋');
        process.exit(0);
      }
    }
  },

  async promptMessage() {
    CliHelper.printUserMessagePrefix();
    const message = await CliHelper.promptMessage('enter your message');
    CliHelper.clearLastLine(2); // clear the old prefix, it will reprint
    await this.performMessage(message);
  },

  async resetConvo() {
    const confirmed = await CliHelper.confirmQuestion('are you sure? this cannot be undone...');

    if (confirmed) {
      CliHelper.printInfoMessage('resetting your message history...');
      await this.convoHistory.reset();
      await this.askReaderSpeed();
    } else {
      CliHelper.printInfoMessage('phew... that was a close one :)');
    }
  },

  async augmentAgentMessage() {
    const message = await CliHelper.promptMessage('how would you have preferred lightward responsed?');
    await this.convoHistory.augmentAgentMessage(message);

    CliHelper.printInfoMessage('playing god and changing the last lightward response...');
    CliHelper.printAgentMessage(message);
  },

  printErrorAndExit(message) {
    CliHelper.printErrorMessage(message);
    process.exit(1);
  }
};

export default LightwardCLI;