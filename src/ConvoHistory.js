import fs from 'fs-extra';

export const ROLES = {
  USER: 'user',
  AGENT: 'agent'
};

class ConvoHistory {
  static async build(path) {
    if (await fs.exists(path)) {
      const data = await fs.readFile(path);
      return new ConvoHistory(path, JSON.parse(data));
    }

    // does not exist yet, create a blank
    return new ConvoHistory(path, []);
  }

  constructor(path, history) {
    this.path = path;
    this.history = history;
  }

  async addUserMessage(message) {
    this.history.push({ role: ROLES.USER, message });
    await this.flushToStorage();
  }

  async addAgentMessage(message) {
    this.history.push({ role: ROLES.AGENT, message });
    await this.flushToStorage();
  }

  async augmentAgentMessage(message) {
    if (this.lastEntry && this.lastEntry.role === ROLES.AGENT) {
      this.lastEntry.message = message;
      await this.flushToStorage();
    } else {
      throw new Error('last message is not from the agent');
    }
  }

  async reset() {
    this.history = [];
    await this.flushToStorage();
  }

  getForAPI() {
    return this.history.map((entry) => ({
      role: entry.role,
      content: [
        { type: 'text', text: entry.message }
      ]
    }));
  }

  get lastEntry() {
    if (this.history.length) {
      return this.history[this.history.length - 1];
    }

    return null;
  }

  isEmpty() {
    return this.history.length === 0;
  }

  async flushToStorage() {
    await fs.ensureFile(this.path);
    await fs.writeFile(this.path, JSON.stringify(this.history));
  }
}

export default ConvoHistory;