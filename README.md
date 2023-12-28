# 👯 Emoji Stripper TS

## Overview
Emoji Stripper TS is a lightweight, efficient Typescript library designed for removing emojis and emoticons from text. It's perfect for cleaning up user input, processing text for analysis, or any other situation where you need plain text free from graphical characters.

## Features
- **Remove Emojis**: Efficiently strips all Unicode emojis from text.
- **Remove Emoticons**: Option to also remove common emoticon patterns.
- **Customizable**: Easily configurable to suit your specific needs.

## Installation
Install the package via npm:
```bash
npm install emoji-stripper-tes
```

Or using Yarn:
```bash
yarn add emoji-stripper-tes
```

## Usage
Import and use the `stripEmojis` function in your JavaScript project.

```javascript
import stripEmojis from 'emoji-stripper-tes';

const options = {
  removeEmojis: true,
  removeEmoticons: true
};

const cleanedText = stripEmojis('Your text with emojis 😊 and emoticons :)', options);
console.log(cleanedText); // 'Your text with emojis and emoticons '
```

### Options
`stripEmojis` function accepts the following options:

```javascript
type StripOptions = {
  removeEmojis: boolean;      // Set true to remove emojis
  removeEmoticons: boolean;   // Set true to remove emoticons
};
```

## How It Works
Emoji Stripper TES uses regular expressions to identify and remove emoji and emoticon characters from the provided text string. By default, it removes all Unicode emojis and a predefined set of common emoticons.

## Contributing
Contributions to Emoji Stripper TES are welcome! Please read our contributing guidelines for more information.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
