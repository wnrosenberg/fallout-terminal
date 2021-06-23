import {
  isAlpha,
  rndItem
} from './helpers';

import * as Dom from './dom';

import * as Data from './data';

/******************************************************
 * FALLOUT TERMINAL EMULATOR - v1.0.0
 * 
 * @author Will Rosenberg / RWD Co.
 * 
 * Usage:
 *   const T = new Terminal(settingsObj);
 *    
 * settingsObj properties:
 *   dictionary: array of words of equal length
 *   difficulty: hacking skill required [0-3] (@TODO)
 * 
 * Getters:
 *   T.message  ->  returns the generated message
 * 
 *****************************************************/

class Terminal {
  constructor(options = {}) {
    // DOM elements used to build the experience.
    this.dom = {
      screen: null, // #screen
      spans: null, // #spans
      feed: null, // #feed
      allSpans: [], // #spans span
    };

    // Terminal Data: Dataset used to build the terminal experience.
    this.data = {
      difficulty: 0, // Unused
      initialWords: [...Data.words], // all words
      words: [], // word list modified while building message
      chars: [...Data.chars], // all chars
      openers: [...Data.cmdOpeners], // chars which open cmds
      closers: [...Data.cmdClosers], // chars which close cmds
      minCharsBetween: 3, // characters separating two words
      c: 2, // columns
      r: 16, // rows per column
      cpr: 12, // characters per row
      t: 2 * 16 * 12, // total characters
      actions: [...Data.actions], // all cmd actions
      debug: true, // whether to output helpful debugging info.
    };

    // Update data from passed options set.
    if (options.dictionary && options.dictionary.length) {
      this.data.words = options.dictionary;
    }
    if (options.difficulty >= 0 && options.difficulty <= 3) {
      this.data.difficulty = options.difficulty;
    }

    // Data unique to this instance of Terminal
    this.view = {
      msg: "", // "terminal message"
      correct: "", // the correct word in the message
      words: [], // "terminal words": words used onscreen
      cmds: [], // "terminal commands"
      spans: [], // characters onscreen [0..t]
    };

    // Set state of the terminal
    this.state = {
      lockedOut: false,
      unlocked: false,
    };

    // History for various items.
    this.last = {
      c: '', // last character while building message
      action: '', // lastAction
    }

    // Initialize some items for this build.
    this.initialize();
  }

  // Some tasks to perform when (re-)initializing the Terminal
  initialize() {
    // Assign (or create) the required DOM elements.
    if (!this.dom.screen) {
      let screen = document.getElementById('screen');
      if (!screen || !screen.children.length) {
        this.buildHtml();
      } else {
        this.getDomElements();
      }
    }

    // Generating a message uses up words, so replenish the list.
    this.data.words = [...this.data.initialWords];

    // Build a new terminal message.
    this.generateMessage();
  }

  // TODO: Build and append the required HTML elements.
  buildHtml() {

  }

  // Retrieve the required HTML DOM elements.
  getDomElements() {
    this.dom.screen = document.getElementById('screen');
    this.dom.spans = document.getElementById('spans');
    this.dom.feed = document.getElementById('feed');
  }

  // Get a random char, optionally skipping words.
  getRndChar(skipWords = 0) {
    let filter = skipWords ? [char=>char!=='w'] : [];
    return rndItem(this.data.chars, filter);
  }

  // Get a random action, skipping if lastAction = t
  getRndAction() {
    let filter = this.last.action === 't' ? [action=>action!=='t'] : [];
    return rndItem(this.data.actions, filter);
  }

  // Set the last action taken.
  setLastAction(action) {
    this.last.action = action;
  }

  // Terminal Words: The words onscreen.
  getTerminalWords() {
    return this.view.words;
  }
  addTerminalWord(word) {
    if (Array.isArray(word) && word.length === 1) word = word[0];
    this.view.words.push(word);
  }
  
  // The correct word.
  getCorrectWord() {
    return this.view.correct;
  }
  setCorrectWord(word) {
    this.view.correct = word;
  }

  // All Words
  getAllWords() {
    return this.data.words;
  }

  // Get message dimensions
  getDimensions() {
    return {
      rows: this.data.r,
      cols: this.data.c,
      charsPerRow: this.data.cpr,
      t: this.data.t,
    };
  }

  // Generate Message with chars and words
  get message() { return this.getMessage(); }
  getMessage() { return this.view.msg; }
  generateMessage() {
    let skippingWords = false,
        charsBetween = 0,
        msg = '',
        word = '',
        c = '',
        lastc = '';

    // While the message is less than the desired length
    while (msg.length < this.data.t) {
      // get a random char, include words unless there's no words left to choose from
      c = this.getRndChar(!this.data.words.length);
      // console.log('msg.len='+msg.length+' c='+c+' lastc='+lastc+' skippingWords='+skippingWords+' charsBetween='+charsBetween);

      // if that char starts a word
      if (c === 'w') {

        // If we just previously output a word, set a flag and output non-word character.
        if (lastc === c) {
          skippingWords = true;
          c = this.getRndChar(1);
          // console.log('just output a word so now set c='+c);
          msg += c;
          // this is the first char between.
          charsBetween++;

          // If we are currently skipping words, output a character.
        } else if (skippingWords) {
          c = this.getRndChar(1);
          // console.log('skipping words so now set c='+c);
          msg += c
          // this is the next char between.
          charsBetween++;

          // Last char was not a word and we are not skipping words.
        } else {
          // if there is enough space left to output a whole word, do it.
          if (msg.length + this.data.words[0].length < this.data.t) {
            // remove a word from the set and append.
            word = this.data.words.splice(Math.floor(Math.random() * this.data.words.length), 1);
            this.addTerminalWord(word);
            // console.log('word chosen: '+ word);
            msg += word;
            // at this point there are no characters since the last word
            charsBetween = 0;
            // skip words after this until the threshold is met
            skippingWords = true;

            // Otherwise fill the remaining space with characters.
          } else {
            while (msg.length < this.data.t) {
              msg += this.getRndChar(1);
            }
          }
        }

        // if this char doesnt start a word
      } else {
        // this is the next char between
        if (skippingWords) charsBetween++;
        msg += c;
      }

      // Store the char we just added.
      lastc = c;

      // If we were skipping words, and there are now enough characters following the last word...
      if (skippingWords && charsBetween > this.data.minCharsBetween) {
        // start allowing words again.
        // console.log('were skipping but charsBetween > '+minCharsBetween+' so no longer skipping words after this');
        skippingWords = false;
      }
    }
    
    // From the set of chosen words, choose the correct word.
    let terminalWords = this.getTerminalWords();
    this.setCorrectWord(rndItem(terminalWords));
    
    // Set the message locally
    this.view.msg = msg.toUpperCase();
    
    if (this.data.debug)
      console.log('Terminal.generateMessage :: Message created with words: [' +
        terminalWords.toString().replaceAll(',',', ') +
        '] and ['+this.getCorrectWord()+'] chosen as the correct word.');
  }
  
  // Set Terminal State
  setUnlocked(word = '') {
    this.state.unlocked = true;
    this.appendFeedStatus('UNLOCKED!!', word);
  }
  setLockedOut() {
    this.state.lockedOut = true;
    this.appendFeedStatus('INIT LOCKOUT');
  }

  // WIP: Handle outputting to the screen (assume required DOM elements exist)
  outputMessage() {
    // If the parents already contain children, remove them.
    if (!this.dom.allSpans.length) {
      document.querySelectorAll('#spans .spans').forEach((dotSpans, index)=>{
        while (dotSpans.firstChild) {
          dotSpans.removeChild(dotSpans.firstChild)
        }
      });
      this.dom.allSpans = [];
    }

    // Continue with operation...
  }

  // Get likeness for a word.
  getLikeness = (word) => {
    let likeness = 0;
    let correct = this.getCorrectWord();
    if (word.length !== correct.length) {
      if (this.data.debug) console.error('Terminal.getLikenss :: Unable to verify likeness. Words have unequal length.');
      return 0;
    }
    for (let i = 0; i < word.length; i++) {
      if (word[i] === correct[i]) likeness++;
    }
    if (this.data.debug)
      console.log('Terminal.getLikenss :: User chose ['+word+'] and correct word is ['+correct+'] with a likeness of '+likeness+'.');
    return likeness;
  }

  // WORKING WITH THE FEED

  // Append a feed status to #feed. Return the number of divs added.
  appendFeedStatus(status, pretext = "") {
    let innerDivs = [];
    if (pretext) innerDivs.push(Dom.div(null, pretext.toUpperCase()));
    innerDivs.push(Dom.div(null, status.toUpperCase()));
    this.dom.feed.append(Dom.div('feedItem', innerDivs));
    return innerDivs.length;
  }

  // Append a feed item to #feed. Returns the number of divs added.
}

export default Terminal;