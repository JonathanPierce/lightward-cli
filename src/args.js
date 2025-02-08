import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const args = yargs(hideBin(process.argv))
  .options({
    'reset-fast': {
      type: 'boolean',
      default: false,
      description: 'resets the convo, choosing the fast reader option'
    },
    'reset-slow': {
      type: 'boolean',
      default: false,
      description: 'resets the convo, choosing the slow reader option'
    },
    'conversation-file': {
      type: 'string',
      default: './history.json',
      description: 'path to the conversation history file, will default to ./history.json.json'
    },
    'message': {
      type: 'string',
      description: 'message to immediately send'
    },
    'augment-agent-message': {
      type: 'string',
      description: 'replaces the last lightward response message with this message'
    },
    'quick': {
      type: 'boolean',
      default: false,
      description: 'when true, will exit as soon as the agent responds'
    },
    'show-history': {
      type: 'boolean',
      default: false,
      description: 'when true, will print the full conversation history when launching'
    }
  })
  .help()
  .parse();

export default args;