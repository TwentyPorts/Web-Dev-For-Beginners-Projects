document.getElementById("typed-value").disabled = true;
//localStorage.clear();
let highscore;
if(localStorage.getItem("highest") === null) {
  highscore = 0;
}
else {
  highscore = parseInt(localStorage.getItem("highest"));
}

// all of our quotes
const quotes = [
  "When you have eliminated the impossible, whatever remains must be the truth.",
  "There is nothing more deceptive than an obvious fact.",
  "I never make exceptions. An exception disproves the rule.",
  "What one man can invent another can discover.",
  "Nothing clears up a case so much as stating it to another person.",
  "Education never ends, Watson.",
  "If fighting is sure to result in victory, then you must fight!",
  "The only thing we have to fear is fear itself.",
];
// store the list of words and the index of the word the player is currently typing
let words = [];
let characters = 0;
let wordIndex = 0;
// the starting time
let startTime = Date.now();
// page elements
const quoteElement = document.getElementById("quote");
const messageElement = document.getElementById("message");
const typedValueElement = document.getElementById("typed-value");
const highScoreElement = document.getElementById("high-score");

document.getElementById("start").addEventListener("click", () => {
  // get a quote
  const quoteIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[quoteIndex];
  // Put the quote into an array of words
  words = quote.split(" ");
  // Count # of characters in quote
  characters = 0;
  words.forEach(word => characters+=word.length);
  // reset the word index for tracking
  wordIndex = 0;

  // UI updates
  // Create an array of span elements so we can set a class
  const spanWords = words.map(function (word) {
    return `<span>${word} </span>`;
  });
  // Convert into string and set as innerHTML on quote display
  quoteElement.innerHTML = spanWords.join("");
  // Highlight the first word
  quoteElement.childNodes[0].className = "highlight";
  // Clear any prior messages
  messageElement.innerText = "";
  highScoreElement.innerText = "";

  // Setup the textbox
  // Clear the textbox
  typedValueElement.value = "";
  // set focus
  typedValueElement.focus();
  // set the event handler

  // Start the timer
  setTimeout(() => {
    startTime = new Date().getTime();
    typedValueElement.addEventListener("input", inputChecker);
    document.getElementById("typed-value").disabled = false;
  }, 2000); //waits 2 seconds before letting user type
});

function inputChecker() {
  // Get the current word
  const currentWord = words[wordIndex];
  // get the current value
  const typedValue = typedValueElement.value;

  if ((typedValue === currentWord && wordIndex === words.length - 1)) {
    // end of sentence
    // Display success
    const elapsedTime = new Date().getTime() - startTime;
    const wpm = parseInt(((characters/5) / ((elapsedTime / 1000) / 60)).toFixed()); //rounds WPM to nearest integer
    const message = `CONGRATULATIONS! You finished in ${
      elapsedTime / 1000
    } seconds.
      That's ${wpm} words per minute!`;
    messageElement.innerText = message;
    typedValueElement.removeEventListener("input", inputChecker); //removes event listener
    document.getElementById("typed-value").disabled = true; //disables textbox

    let highScoreMessage="";
    if(highscore < wpm) {
      highScoreMessage = `You beat your previous high score of ${highscore} wpm! Your new high score is ${wpm} wpm.`;
      localStorage.setItem("highest", wpm);
      highscore = localStorage.getItem("highest");
    }
    else if(highscore === wpm) {
      highScoreMessage = `You tied with your previous high score of ${highscore} wpm!`;
    }
    else {
      highScoreMessage = `Your high score remains as ${highscore} wpm.`;
    }
    highScoreElement.innerText = highScoreMessage;
  } else if (typedValue.endsWith(" ") && typedValue.trim() === currentWord) {
    // end of word
    // clear the typedValueElement for the new word
    typedValueElement.value = "";
    // move to the next word
    wordIndex++;
    // reset the class name for all elements in quote
    for (const wordElement of quoteElement.childNodes) {
      wordElement.className = "";
    }
    // highlight the new word
    quoteElement.childNodes[wordIndex].className = "highlight";
  } else if (currentWord.startsWith(typedValue)) {
    // currently correct
    // highlight the next word
    typedValueElement.className = "";
  } else {
    // error state
    typedValueElement.className = "error";
  }
}
