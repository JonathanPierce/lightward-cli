import chalk from 'chalk';

import { input, select, confirm } from '@inquirer/prompts';

import { ROLES } from './ConvoHistory.js';

const COLORS = {
  agentBg: chalk.bgHex('#5b9c7c').hex('#ffffff'),
  agent: chalk.hex('#5b9c7c'),
  userBg: chalk.bgHex('#8a5529').hex('#ffffff'),
  user: chalk.hex('#8a5529')
};

const CliHelper = {
  async promptMessage(message) {
    const result = await input({ message, required: true });
    this.clearLastLine(-2);
    return result;
  },

  async promptSelect(options) {
    const result = await select(options);
    this.clearLastLine();
    return result;
  },

  async confirmQuestion(question) {
    const result = await confirm({ message: question });
    this.clearLastLine(-2);
    return result;
  },

  clearLastLine() {
    process.stdout.moveCursor(0, -1);
    process.stdout.clearScreenDown();
  },

  withSpinner(promise, options = {}) {
    // TODO
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

  printAgentMessageChunk(chunk, spinner) {
    process.stdout.write(chunk); // TODO
  },

  completeMessage() {
    console.log('\n');
  },

  printInfoMessage(message) {
    console.log(chalk.cyan(message) + '\n');
  },

  printErrorMessage(message) {
    console.log(chalk.red(`whoa, something went wrong :(\n\n${message}`));
  }
};

export default CliHelper;