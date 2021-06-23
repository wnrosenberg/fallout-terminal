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
 *   dictionary : array of words of equal length
 *   difficulty : hacking skill required [0-3] (@TODO)
 *   root       : DOM element to use for rendering
 *   prefix     : if root, elements named #{prefix}_element instead of #element
 * 
 * Getters:
 *   T.message -> returns the generated message
 *   T.status  -> one of [unlocked,lockedOut,idle]
 * 
 *****************************************************/

class Terminal {
  constructor(options = {}) {
    // DOM elements used to build the experience.
    this.dom = {
      root: null, // root element to replace with Terminal
      prefix: '', // prefix for these items (unused)
      screen: null, // #screen - wraps #spans and #history
      spans: null, // #spans - wrapper around .spans columns
      dotSpans: null, // .spans - column wrapper
      history: null, // #history - column wrapper
      feed: null, // #feed - feed items
      cursor: null, // #cursor - current position
      allSpans: [], // the set (#spans span)
    };

    // Terminal Data: Dataset used to build the terminal experience.
    this.data = {
      difficulty: 0, // (unused)
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
      maxTries: 4, // 5 if Science Bobblehead is active
      debug: true, // whether to output helpful debugging info.
    };

    // Update data from passed options set.
    if (options.dictionary && options.dictionary.length) {
      this.data.words = options.dictionary;
    }
    if (options.difficulty >= 0 && options.difficulty <= 3) {
      this.data.difficulty = options.difficulty;
    }
    if (options.root && options.root instanceof Element) {
      this.dom.root = options.root; // render into this Element.
      if (options.prefix) this.dom.prefix = `${options.prefix}`;
    }

    // Data unique to this instance of Terminal
    this.view = {
      msg: "", // "terminal message"
      correct: "", // the correct word in the message
      words: [], // "terminal words": words used onscreen
      cmds: [], // "terminal commands"
      spans: [], // characters onscreen [0..t]
      tries: 0, // init to this.data.maxTries
    };

    // Set state of the terminal
    this.state = {
      lockedOut: false,
      unlocked: false,
    };

    // History for various items.
    this.last = {
      cursorIndex: 0,
      action: '', // lastAction
    }

    // Initialize some items for this build.
    this.initialize();
  }

  // Some tasks to perform when (re-)initializing the Terminal
  initialize() {
    // Assign (or create) the required DOM elements.
    if (this.dom.root) {
      this.buildHtml();
    } else {
      this.getDomElements();
    }

    // Clear message and the spans.
    this.view.msg = "";
    this.clearDom();

    // Reset Tries
    this.resetTries(1);

    // Generating a message uses up words, so replenish the list.
    this.data.words = [...this.data.initialWords];

    // Build a new terminal message.
    this.generateMessage();
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
  
  // Get/Set Terminal State
  get status() {
    if (this.state.unlocked) return 'unlocked';
    if (this.state.lockedOut) return 'lockedOut';
    return 'idle';
  }
  setUnlocked(word = '') {
    this.state.unlocked = true;
    this.appendFeedStatus('UNLOCKED!!', word);
  }
  setLockedOut() {
    this.state.lockedOut = true;
    this.appendFeedStatus('INIT LOCKOUT');
  }

  // WIP: Handle outputting to the screen
  // Assume required DOM elements exist in this.dom
  // Assume existing spans have been cleared first.
  outputMessage() {
    // First chunk this.view.msg into chunks.
    const re = new RegExp(`.{1,${charsPerRow}}`, "g");
    const chunks = msg.match(re);

    // Then perform outputChunks.

    // Use the following format to create each span:
    //   let span = Dom.span(char, dataAttrs, {
    //     enter: this.spanMouseover,
    //     leave: this.spanMouseout,
    //     click: this.spanCharClick,
    //   });
  }

  // Get likeness for a word.
  // TODO: Figure out why this is called twice on word click.
  getLikeness = (word) => {
    let likeness = 0;
    let correct = this.getCorrectWord();
    if (word.length !== correct.length) {
      if (this.data.debug) console.error('Terminal.getLikeness :: Unable to verify likeness. Words have unequal length.');
      return 0;
    }
    for (let i = 0; i < word.length; i++) {
      if (word[i] === correct[i]) likeness++;
    }
    if (this.data.debug)
      console.log('Terminal.getLikeness :: User chose ['+word+'] and correct word is ['+correct+'] with a likeness of '+likeness+'.');
    return likeness;
  }



  /*** WORKING WITH THE FEED ***/

  // Append a feed status to #feed. Return the number of divs added.
  appendFeedStatus(status, pretext = "") {
    let innerDivs = [];
    if (pretext) innerDivs.push(Dom.div(null, pretext.toUpperCase()));
    innerDivs.push(Dom.div(null, status.toUpperCase()));
    this.dom.feed.append(Dom.div('feedItem', innerDivs));
    return innerDivs.length;
  }

  // Append a feed item to #feed. Returns the number of divs added.
  appendFeedItem(text) {
    let innerDivs = [];
    innerDivs.push(Dom.div(null, text.toUpperCase()));
    if (isAlpha(text)) {
      innerDivs.push(Dom.div(null, "Entry denied."));
      innerDivs.push(Dom.div(null, "Likeness=" + this.getLikeness(text)));
    } else if (text.length > 1) {
      // it's a command!
    } else {
      innerDivs.push(Dom.div(null, "Error"));
    }
    this.dom.feed.append(Dom.div('feedItem', innerDivs));
    return innerDivs.length;
  }

  // TODO Update the display of #feed after appending items to it.
  // The feed can only hold (this.data.r - 2) rows of data.
  // Prevent overflow by removing the top x lines when y lines are added.
  updateFeed() {
    if (this.data.debug) console.log('Terminal.updateFeed :: Must implement this function.');
  }



  /*** COMMAND ACTIONS ***/

  // Removes a dud if possible, returns boolean success.
  removeDud() {
    console.log('remove dud');
  }

  // Resets tries if possible, returns boolean success.
  resetTries(init=false) {
    console.log('reset tries');
    if (init) {
      // called during initialization
    }
    this.view.tries = this.data.maxTries;
    // TODO: Reset the tries in the DOM.
  }



  /*** DOM METHODS ***/

  // Build the required DOM elements and append to options.root.
  buildHtml() {
    const dotSpans = Dom.div('spans', null);
    const spans = Dom.div(null,[dotSpans,dotSpans],{id:'spans'});
    const feed = Dom.div(null,null,{id:'feed'});
    const cursor = Dom.div(null,null,{id:'cursor'});
    const history = Dom.div(null,[feed,cursor],{id:'history'});
    const screen = Dom.div(null,[spans,history],{id:'screen'});
    Dom.truncate(this.dom.root);
    this.dom.root.append(screen);
    this.getDomElements();
  }

  // Retrieve the required HTML DOM elements.
  getDomElements() {
    this.dom.screen = document.getElementById('screen');
    this.dom.spans = document.getElementById('spans');
    this.dom.dotSpans = document.querySelectorAll('#span .spans');
    this.dom.history = document.getElementById('history');
    this.dom.feed = document.getElementById('feed');
    this.dom.cursor = document.getElementById('cursor');
  }

  // Empty each .spans and the #feed.
  clearDom() {
    this.dom.dotSpans.forEach(col => Dom.truncate(col));
    Dom.truncate(this.dom.feed);
  }

  // Update the text of #cursor
  setCursorText(text) {
    this.dom.cursor.innerHTML = text;
  }
}

export default Terminal;