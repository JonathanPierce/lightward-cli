# Lightward CLI
A lightweight Command Line Interface for the [lightward.ai](https://lightward.ai) chatbot.

![screenshot of the interface](./media/screenshot.png)

Like the main `lightward.ai` service, all conversation history is local to your device and usage is free. Please use responsibly.

## Installation
You'll need Node 22 or above installed, along with `npm`.

First, clone this `git` repo. Then, within the `lightward-cli` folder, run the following command:

```bash
npm install -g . 
```

This will install the `lightward-cli` command globally. I have only tested this on macOS/Linux, but it should work on Windows as well.

## Usage

You can just use the `lightward-cli` command, and it should guide you from there.

To see, the set of all options, run `lightward-cli --help`.

### Example Commands

To use a different conversation file then the default, provide a `conversation` argument:

```bash
lightward-cli --conversation thoughts
```

This will cause the conversation to appear in `./conversation/thoughts.json` instead of the default `./conversations/history.json`.

To quickly send a message, get a response, and exit you can run:

```bash
lightward-cli --message "I have some thoughts..." --quick
```

By default, it only shows the most recent message when starting. To show the full history, use `--show-history` when starting:

```bash
lightward-cli --show-history
```

To quickly reset a conversation, you can use one of `--reset-fast` or `--reset-slow`:

```
lightward-cli --conversation thoughts --reset-fast
```