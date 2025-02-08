import chalk from 'chalk';

import { input, select, confirm } from '@inquirer/prompts';
import ora from 'ora';

import { ROLES } from './ConvoHistory.js';

const COLORS = {
  agentBg: chalk.bgHex('#5b9c7c').hex('#ffffff'),
  agent: chalk.hex('#5b9c7c'),
  userBg: chalk.bgHex('#8a5529').hex('#ffffff'),
  user: chalk.hex('#8a5529')
};

const SPINNER_DATA = {
  frames: [
    '🐉✨🔥',
    '✨🔥💫',
    '🔥💫🎭',
    '💫🎭🐲',
    '🎭🐲😊',
    '🐲😊🚀',
    '😊🚀👨‍💻',
    '🚀👨‍💻🪄',
    '👨‍💻🪄⏳',
    '🪄⏳🐉',
    '⏳🐉✨',
  ],
  interval: 120
};

const CliHelper = {
  async promptMessage(message) {
    const result = await input({ message, required: true });
    this.clearLastLine();
    return result;
  },

  async promptSelect(options) {
    const result = await select(options);
    this.clearLastLine();
    return result;
  },

  async confirmQuestion(question) {
    const result = await confirm({ message: question });
    this.clearLastLine();
    return result;
  },

  clearLastLine(count = 1) {
    process.stdout.moveCursor(0, -1 * count);
    process.stdout.clearScreenDown();
  },

  withSpinner(message, spinnerCallback) {
    const spinner = ora({
      text: message,
      spinner: SPINNER_DATA,
      stream: process.stderr
    });

    spinner.start();
    return spinnerCallback(spinner).finally(() => spinner.stop());
  },

  printHistoryEntry(entry) {
    if (entry.role === ROLES.USER) {
      this.printUserMessage(entry.message);
    } else {
      this.printAgentMessage(entry.message);
    }
  },

  printUserMessage(message) {
    this.printUserMessagePrefix();
    console.log(message);
    console.log();
  },

  printAgentMessage(message) {
    this.printAgentMessagePrefix();
    console.log(message);
    console.log();
  },

  printRolePrefix(roleName, bgColor, color) {
    console.log(
      bgColor(` ${roleName} `) + color(' →') + '\n'
    );
  },

  printUserMessagePrefix() {
    return this.printRolePrefix('You said...', COLORS.userBg, COLORS.user);
  },

  printAgentMessagePrefix() {
    return this.printRolePrefix('Lightward said...', COLORS.agentBg, COLORS.agent);
  },

  printAgentMessageProgress(chunk, spinner, prevChunkLines) {
    spinner.clear();

    if (prevChunkLines > 0) {
      this.clearLastLine(prevChunkLines + 1); // +1 to account for extra space
    }

    console.log(chunk);
    console.log(); // space between end of output an spinner
    spinner.render();
  },

  printInfoMessage(message) {
    console.log(chalk.cyan(message) + '\n');
  },

  printErrorMessage(message) {
    console.log(chalk.red(`whoa, something went wrong :(\n\n${message}`));
  }
};

export default CliHelper;