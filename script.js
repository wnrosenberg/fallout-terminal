console.clear();

// Default word list.
const defaultWords = ['frost', 'ghost', 'froze', 'glaze', 'plaza', 'prose', 'floss', 'piece', 'mists', 'maize', 'mango', 'tango', 'trash', 'teach', 'lease', 'leach', 'tease', 'abode', 'blows', 'brats', 'blaze', 'broom', 'heist', 'halos', 'plots', 'tarot', 'rooms', 'terms', 'biome', 'vault'];

// Allowed Characters
const chars = ['[', '{', '(', '<', '*', '_', '/', '\\', '\'', '`', '.', '$', '=', '+', '@', '|', ';', ':', '^', '?', '#', '-', '!', '"', '>', ')', '}', ']', 'w', 'w']; // (w is replaced with a word)

// Actions on commands, adjust to change frequency of tries reset / dud removed.
const actions = ['d','d','d','d','d','d','t','t','t','d'];

// Minimum characters between words.
const minCharsBetween = 3;

// COMMAND OPENERS/CLOSERS
const cmdOpeners = ['<', '{', '[', '(']; // command opener chars
const cmdClosers = ['>', '}', ']', ')']; // command closer chars

const rndChar = (skipWords = 0) => {
  let i;
  if (skipWords) {
    i = Math.floor(Math.random() * (chars.length - 2));
  } else {
    i = Math.floor(Math.random() * chars.length);
  }
  return chars[i];
};


// --------------------------------------------------------------

/*
  Terminal Class (WIP)
  --------------
  Options: {
    difficulty: int representing required hacking skill (0-3)
    dictionary: array of words having equal length
  }
*/
class Terminal {
  constructor(options = {}) {
    // Terminal Data: Dataset used to build the terminal experience.
    this.data = {
      difficulty: 0, // Unused
      words: [...defaultWords], // all words, modified as words chosen for display
      chars: [...chars], // all chars
      openers: [...cmdOpeners], // chars which open cmds
      closers: [...cmdClosers], // chars which close cmds
      c: 2,
      r: 16,
      cpr: 12,
      t: 2 * 16 * 12,
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
      words: [], // "terminal words"
      cmds: [], // "terminal commands"
      spans: [], // characters onscreen [0..t]
    };

    // Set state of the terminal
    this.state = {
      correctWord: '',
      lockedOut: false,
      unlocked: false,
    };

    // After all inits are completed, build a new terminal message.
    this.generateMessage();
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
  getMessage() {
    return this.view.msg;
  }
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
      c = rndChar(!this.data.words.length);
      // console.log('msg.len='+msg.length+' c='+c+' lastc='+lastc+' skippingWords='+skippingWords+' charsBetween='+charsBetween);

      // if that char starts a word
      if (c === 'w') {

        // If we just previously output a word, set a flag and output non-word character.
        if (lastc === c) {
          skippingWords = true;
          c = rndChar(1);
          // console.log('just output a word so now set c='+c);
          msg += c;
          // this is the first char between.
          charsBetween++;

          // If we are currently skipping words, output a character.
        } else if (skippingWords) {
          c = rndChar(1);
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
              msg += rndChar(1);
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
      if (skippingWords && charsBetween > minCharsBetween) {
        // start allowing words again.
        // console.log('were skipping but charsBetween > '+minCharsBetween+' so no longer skipping words after this');
        skippingWords = false;
      }
    }
    
    // From the set of chosen words, choose the correct word.
    let terminalWords = this.getTerminalWords();
    this.setCorrectWord(terminalWords[ Math.floor(Math.random() * terminalWords.length) ]);
    
    // set locally
    this.view.msg = msg.toUpperCase();
    
    console.log('Terminal.generateMessage got message with words: ' +terminalWords+' and correct word: '+this.getCorrectWord());
  }
  
  // Set Terminal State
  setUnlocked(word = '') {
    this.state.unlocked = true;
    addFeedStatus('UNLOCKED!!', word);
  }
  setLockedOut = () => {
    this.state.lockedOut = true;
    addFeedStatus('INIT LOCKOUT');
  }
}

// --------------------------------------------------------------

// Create new Terminal
const T = new Terminal();

// Get data for methods not yet moved to the class.
const {
  cols,
  rows,
  charsPerRow,
  t
} = T.getDimensions();
// console.log(cols, rows, charsPerRow, t);

// graphical start to memory address
const addrStart = Math.floor(Math.random() * (65535 - t));



// --------------------------------------------------------------

// Allowed Words
let words = [...T.getAllWords()];
const terminalWords = [];
const addWordToTerminal = (word) => {
  terminalWords.push(word);
}
const getTerminalWords = () => terminalWords;

const getLikeness = (word) => {
  let likeness = 0;
  let correct = T.getCorrectWord();
  console.log('get likeness: word, correct', word, correct);
  for (let i = 0; i < word.length; i++) {
    if (word[i] === correct[i]) likeness++;
  }
  return likeness;
}

// Choose a random character, optionally skipping words.


// Set the correct word from the set of terminal words.
const chooseCorrectWord = () => {
  const words = getTerminalWords();
  setCorrectWord(words[Math.floor(Math.random() * words.length)]);
}

const terminalState = {
  lockedOut: false,
  unlocked: false,
};

// True if str is alphabetical (a-z)
const isAlpha = str => {
  var code, i, len;
  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 64 && code < 91) && !(code > 96 && code < 123)) {
      return false;
    }
  }
  return true;
};

// Get t characters of terminal code, including words.
const getTerminalMsg = () => {
  let skippingWords = false,
    charsBetween = 0,
    msg = '',
    word = '',
    c = '',
    lastc = '';

  // While the message is less than the desired length
  while (msg.length < t) {
    // get a random char, include words unless there's no words left to choose from
    c = rndChar(!words.length);
    // console.log('msg.len='+msg.length+' c='+c+' lastc='+lastc+' skippingWords='+skippingWords+' charsBetween='+charsBetween);

    // if that char starts a word
    if (c === 'w') {

      // If we just previously output a word, set a flag and output non-word character.
      if (lastc === c) {
        skippingWords = true;
        c = rndChar(1);
        // console.log('just output a word so now set c='+c);
        msg += c;
        // this is the first char between.
        charsBetween++;

        // If we are currently skipping words, output a character.
      } else if (skippingWords) {
        c = rndChar(1);
        // console.log('skipping words so now set c='+c);
        msg += c
        // this is the next char between.
        charsBetween++;

        // Last char was not a word and we are not skipping words.
      } else {
        // if there is enough space left to output a whole word, do it.
        if (msg.length + words[0].length < t) {
          // remove a word from the set and append.
          word = words.splice(Math.floor(Math.random() * words.length), 1);
          addWordToTerminal(word);
          // console.log('word chosen: '+ word);
          msg += word;
          // at this point there are no characters since the last word
          charsBetween = 0;
          // skip words after this until the threshold is met
          skippingWords = true;

          // Otherwise fill the remaining space with characters.
        } else {
          while (msg.length < t) {
            msg += rndChar(1);
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
    if (skippingWords && charsBetween > minCharsBetween) {
      // start allowing words again.
      // console.log('were skipping but charsBetween > '+minCharsBetween+' so no longer skipping words after this');
      skippingWords = false;
    }
  }
  msg = msg.toUpperCase();
  return msg;
};

// Chunk the message into charsPerRow
const chunkMsg = msg => {
  const re = new RegExp(`.{1,${charsPerRow}}`, "g");
  return msg.match(re);
};

/*
TODO:
  1) Arrow key cursor.
      - Treat cursor on words like hovering on a word (highlight whole word).
      - Treat cursor on cmdOpener like hovering on the opener (highlight cmd).
      - Add support for moving across columns by t/2 characters.
  2) Enter key as a click.
      - Allow the enter key to work like a click on the current cursorIndex.
  3) Feed of actions.
      - Click on word.
        >CURSOR
        >Entry denied
        >Likeness=3
      - Click on dud remover. --> word turns to ...... feedItem is also updated.
        >[.+/]
        >Dud Removed
      - Click on tries resetter.
        ><.+/>
        >Tries Reset
      - Click on a junk character.
        >*
        >Error
      - Feed has maximum height and can fit (data.rows - 2) rows. Rows automatically removed from top.
  4) Integrate Tries
      - Each click on an word that is not the chosen word uses a try.
      - Once tries are expended, enter locked out mode.
  5) Command functionality
      - Each command has a chance to reset tries or remove a dud.
      - Dud words are replaced with .... in both the spans and the feed (if that word was already tried)
  6) Locked out mode
      - No more tries, cannot try more words, cursor is fixed, mouseover has no action.
  7) Sound effects:
      - Cursor onto junk, onto command, onto each word.
      - Incorrect word click, correct work click.
      - Command click, junk click.
      - Initialize, loading display.
      - Lockout and unlocking.
*/

// ARROW KEY CURSOR
let cursorIndex = 0;
const getCursorIndex = () => cursorIndex;
const setCursorIndex = (newIndex) => {
  cursorIndex = newIndex;
}
let arrowKeyDown = (e) => {
  let charIndex = getCursorIndex();
  let newCursorIndex;
  switch (e.keyCode) {
    case '37':
    case 37: // left
      console.log('left arrow pressed');
      // cursor is at least one position from the left edge of this row.
      if (charIndex % charsPerRow > 0) {
        console.log('able to move cursor.');
        // cursor can move one space to the left.
        newCursorIndex = 1 * charIndex - 1;
      }
      break;
    case '39':
    case 39: // right
      console.log('right arrow pressed');
      // cursor is at least one postition from the right edge of this row.
      if (charIndex % charsPerRow < charsPerRow - 1) {
        console.log('able to move cursor.');
        // cursor can move one space to the right.
        newCursorIndex = 1 * charIndex + 1;
      }
      break;
    case '38':
    case 38: // up
      console.log('up arrow pressed');
      // cursor is at least one row below the top edge of all spans (top of col1)
      if (charIndex > charsPerRow - 1) {
        console.log('able to move cursor.');
        newCursorIndex = 1 * charIndex - charsPerRow;
      }
      break;
    case '40':
    case 40: // down
      console.log('down arrow pressed');
      // cursor is at least one row above the bottom edge of all spans (bottom of col2)
      if (charIndex < t - charsPerRow) {
        console.log('able to move cursor.');
        newCursorIndex = 1 * charIndex + charsPerRow;
      }
      break;
    default:
      break;
  }
  if (newCursorIndex !== charIndex) {
    spanMouseout(document.querySelector('span[data-index=\'' + charIndex + '\']'));
    spanMouseover(document.querySelector('span[data-index=\'' + newCursorIndex + '\']'));

    setCursorIndex(newCursorIndex);
  }
};
window.addEventListener('keydown', arrowKeyDown);

// CURSOR INTERACTIONS
const updateCursorText = (text) => {
  document.getElementById('cursor').innerHTML = text;
}
const markCursorIndex = (index) => {
  // Remove old cursored.
  let marked = document.querySelectorAll('.cursored');
  for (let i = 0; i < marked.length; i++) {
    marked[i].classList.remove('cursored');
  }
  // Update new cursored.
  let curSpan = document.querySelector('span[data-index=\'' + index + '\']');
  curSpan.classList.add('cursored');

  // @TODO: Handle char is part of word or starts command: highlight whole word/cmd

  // Update cursor text.
  updateCursorText(curSpan.innerHTML);
};
const updateCursorIndex = (index, mark = true) => {
  setCursorIndex(index);
  if (mark) markCursorIndex(getCursorIndex());
}


// SPAN EVENT HANDLERS
const spans = {
  cur: null,
  last: null
};
const spanSelect = (e) => spanMouseover(e);
const spanDeselect = (e) => spanMouseout(e);

const spanMouseover = (e) => {
  let elem = e ? (e.target ? e.target : e) : false; // target of event or passed in manually.
  if (!elem) return;
  updateCursorIndex(elem.getAttribute('data-index')); // update current cursor position

  let cursor = "";
  let word = elem.getAttribute('data-word');
  let cmdType = elem.getAttribute('data-cmd-start');
  let cmdActive = elem.getAttribute('data-cmd-active') == "1";

  if (word) {
    document.querySelectorAll('span[data-word=\'' + word + '\']').forEach((node) => {
      cursor += node.innerHTML;
      node.classList.add('hovered');
    });
  } else if (cmdActive) {
    // loop through the siblings and add hovered class until finding span[data-end=cmdIndex]
    let k = 0; // compare k against chars per row to help prevent infinite loop
    while (elem.getAttribute('data-cmd-end') !== cmdType && k < charsPerRow) {
      cursor += elem.innerHTML;
      elem.classList.add('hovered'); // add the hovered class
      elem = elem.nextElementSibling; // advance to the next sibling
      k++;
      // if the next sibling has cmd-end, the while loop wont iterate, so perform its function now.
      if (elem.getAttribute('data-cmd-end') === cmdType) {
        cursor += elem.innerHTML;
        elem.classList.add('hovered');
      }
    }

  } else {
    cursor = elem.innerHTML;
  }
  updateCursorText(cursor);
}; // hover (mouseover/mouseenter)
const spanMouseout = (e) => {
  let elem = e ? (e.target ? e.target : e) : false; // target of event or passed in manually.
  if (getCursorIndex() !== elem.getAttribute('data-index')) {
    // console.log('mouseout and the cursorIndex is not the same as the current span\'s index.');
  } else {
    // console.log('mouseout and the cursorIndex the same as the current span\'s index.');
  }
  let word = elem.getAttribute('data-word');
  let cmdType = elem.getAttribute('data-cmd-start');
  let cmdActive = elem.getAttribute('data-cmd-active') == "1";
  if (word) {
    document.querySelectorAll('span[data-word=\'' + word + '\']').forEach((node) => {
      node.classList.remove('hovered');
    });
  } else if (cmdActive) {
    // loop through the siblings and remove hovered class until finding span[data-end=cmdIndex]
    let k = 0; // compare k against chars per row to help prevent infinite loop
    while (elem.getAttribute('data-cmd-end') !== cmdType && k < charsPerRow) {
      elem.classList.remove('hovered'); // remove the hovered class
      elem = elem.nextElementSibling; // advance to the next sibling
      k++;
      // if the next sibling has cmd-end, the while loop wont iterate, so perform its function now.
      if (elem.getAttribute('data-cmd-end') === cmdType) {
        elem.classList.remove('hovered');
      }
    }
  }
}; // hover (mouseout/mouseleave)
const spanCharClick = (e) => {
  if (terminalState.lockedOut || terminalState.unlocked) {
    return;
  }
  let char = e.target.innerHTML;
  let charIndex = e.target.getAttribute('data-index');
  let word = e.target.getAttribute('data-word');
  let wordIndex = e.target.getAttribute('data-word-index');
  let commandIndex = e.target.getAttribute('data-cmd-index');
  let cmdActive = e.target.getAttribute('data-cmd-active') == "1";
  // if span is part of a word, trigger the word action
  if (wordIndex) {
    if (getLikeness(word) === word.length) {
      setTerminalUnlocked(word);
    } else {
      addFeedItem(word);
    }
  } else if (cmdActive) {
    let action = actions[ Math.floor(Math.random() * actions.length) ];
    if (action === 't' && lastAction !== action) {
      lastAction = 't';
      resetTries();
    } else {
      lastAction = 'd';
      removeDud();
    }
  } else {
    addFeedItem(char);
  }
};

let lastAction = "";

const removeDud = () => {
  console.log('remove dud');
}
const resetTries = () => {
  console.log('reset tries');
}

// OUTPUT CHUNKS AS SPANS
const createCharacterSpan = (chr, data) => {
  let el = document.createElement('span');
  el.innerHTML = chr;
  el.addEventListener('mouseover', spanMouseover);
  el.addEventListener('mouseout', spanMouseout);
  el.addEventListener('click', spanCharClick);
  if (Object.keys(data).length) {
    Object.keys(data).forEach(key => {
      el.setAttribute('data-' + key, data[key]);
    });
  }
  return el;
}
const outputChunks = (chunks) => {
  // COMMANDS
  let numCommands = 0; // index of commands in set.
  let parsedCommands = [];
  let cmdIndex = -1; // an index [0-3] corresponding to the below arrays.
  let cmdsOpen = [
    [],
    [],
    [],
    []
  ]; // whether any commands open

  // Mark open commands as closed, may specify a cmdIndex.
  const closeCmds = (index = -1) => {
    if (index > -1 && index < cmdsOpen.length) {
      cmdsOpen[index] = [];
    } else {
      cmdsOpen = [
        [],
        [],
        [],
        []
      ];
    }
  };

  // True if any commands are open, may specify a cmdIndex.
  const anyCmdsOpen = (index = -1) => {
    if (index > -1 && index < cmdsOpen.length) {
      return cmdsOpen[index].length > 0;
    }
    return cmdsOpen.map(arr => arr.length).reduce((a, c) => a + c) > 0;
  };

  // WORDS
  let numWords = 0; // index of words in set.
  let wordOpen = false; // whether a word is open.
  let curWord = ""; // the current word text.
  let parsedWords = [];

  // ITERATIONS
  let span; // current span in iteration
  let spanData = {}; // data-attributes to be assigned to the span.
  let c; // current character in loop
  let lastC = ''; // previous loop's character
  let cType = ''; // type of current char ('w' or 'c')
  let cIndex = -1; // index of character in set.

  // Loop through the chunks....
  chunks.forEach((chunk, i) => {
    // and loop through the chars in each chunk.
    for (let j = 0; j < chunk.length; j++) {
      // get the next character in the message, its index, and its type.
      c = chunk[j];
      cIndex = i * 12 + j;
      cType = isAlpha(c) ? 'w' : 'c';

      // init some things for this FOR iteration
      spanData = {
        index: cIndex,
        type: cType
      };

      // if this char starts a new chunk, close open commands from prev row
      if (j === 0 && anyCmdsOpen()) {
        closeCmds();
      }

      // :::::::::::::::::::::::::::
      // :: begin character logic ::
      // :::::::::::::::::::::::::::

      //
      // -> c is a non-word character
      if (cType === 'c') {
        //
        // --> if a word was open, it's now closed
        if (wordOpen) {
          wordOpen = false;
          parsedWords.push(curWord);
          curWord = "";
          numWords++;
        }

        //
        // --> if this character is a cmdOpener
        if (cmdOpeners.indexOf(c) > -1) {
          cmdIndex = cmdOpeners.indexOf(c); // cmd type index
          cmdsOpen[cmdIndex].push(cIndex); // add the character's index to cmdsOpen
          spanData['cmd-start'] = cmdIndex; // set the type of cmd this span opens
          spanData['cmd-active'] = "0"; // not active until a cmdCloser is detected in chunk

          //
          // --> if this character is a cmdCloser
        } else if (cmdClosers.indexOf(c) > -1) {
          cmdIndex = cmdClosers.indexOf(c); // cmd type index

          // if there are any open commands of this type, this closes them
          if (anyCmdsOpen(cmdIndex)) {
            spanData['cmd-end'] = cmdIndex; // set the type of cmd this span closes.
            cmdsOpen[cmdIndex].forEach(spanIndex => { // close open commands
              let spandex = document.querySelector('span[data-index=\'' + spanIndex + '\']');
              spandex.setAttribute('data-cmd-active', "1"); // set cmd to active
              spandex.setAttribute('data-cmd-index', numCommands); // give it an index
              // @TODO: parse out command_text
              // @TODO: parsedCommands.push(command_text)
              numCommands++; // bump it for the next closed cmd.
            });
            cmdsOpen[cmdIndex] = []; // reset cmdsOpen for this cmdIndex.
          }

          //
          // --> if not an opener or closer, this char is junk
        } else {
          // ...
        }

        //
        // -> c is a word character
      } else {
        closeCmds(); // words end cmds.
        wordOpen = true;
        curWord += c;
        spanData['word-index'] = numWords;
        spanData['word'] = T.getTerminalWords()[numWords];
      }

      // :::::::::::::::::::::::::::::
      // ::   end character logic   ::
      // :::::::::::::::::::::::::::::

      //
      // -> Build and append a span for this character.
      span = createCharacterSpan(c, spanData);

      // Each row prepended with an element to output its address
      if (j === 0) {
        let rowAddr = document.createElement('addr');
        rowAddr.setAttribute('data-addr', "0x" + (addrStart + i * charsPerRow).toString(16).toUpperCase());
        document.querySelectorAll('.spans')[Math.floor(cIndex / (t / 2))].append(rowAddr);
      }
      document.querySelectorAll('.spans')[Math.floor(cIndex / (t / 2))].append(span);

      //
      // -> store this c as lastC
      lastC = c;
    }
  });
};

// ADD NEW FEED ITEM
const addFeedItem = (text) => {
  let feedDiv = document.createElement('div');
  feedDiv.classList.add('feedItem');
  let feedChars = document.createElement('div');
  feedChars.innerHTML = text.toUpperCase();
  feedDiv.append(feedChars);
  if (isAlpha(text)) {
    let feedDenied = document.createElement('div');
    feedDenied.innerHTML = "Entry denied.";
    feedDiv.append(feedDenied);
    let feedLikeness = document.createElement('div');
    feedLikeness.innerHTML = "Likeness=" + getLikeness(text);
    feedDiv.append(feedLikeness);
  } else if (text.length > 1) {
    // it's a command!
  } else {
    // it's a single character.
    let feedError = document.createElement('div');
    feedError.innerHTML = "Error";
    feedDiv.append(feedError);
  }
  const feedContainer = document.getElementById('feed');
  if (feedContainer.children.length > 4) {
    document.querySelector('#feed .feedItem').remove();
  }
  feedContainer.append(feedDiv);
}

// ADD NEW FEED STATUS
const addFeedStatus = (status, pretext = "") => {
  let feedDiv = document.createElement('div');
  feedDiv.classList.add('feedItem');
  if (pretext) {
    let feedText = document.createElement('div');
    feedText.innerHTML = pretext.toUpperCase();
    feedDiv.append(feedText);
  }
  let feedStatus = document.createElement('div');
  feedStatus.innerHTML = status.toUpperCase();
  feedDiv.append(feedStatus);
  document.getElementById('feed').append(feedDiv);
}

// SET UNLOCKED STATE (added to class as setUnlocked)
const setTerminalUnlocked = (word = '') => {
  terminalState.unlocked = true;
  addFeedStatus('UNLOCKED!!', word);
}

// SET LOCKED OUT STATE (added to class as setLockedOut)
const setTerminalLockedOut = () => {
  terminalState.lockedOut = true;
  addFeedStatus('INIT LOCKOUT');
}

//
// -------------------------------------------------------
//


// Back to the main program logic flow...
//
// Get a new terminal message.
const terminalMsg = T.getMessage();

// Chunk it into rows.
let chunkies = chunkMsg(terminalMsg);

// This code outputs those to the browser.
outputChunks(chunkies);

// Set the first span to hovered.
markCursorIndex(0);
