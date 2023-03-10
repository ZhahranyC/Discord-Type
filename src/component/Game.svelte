<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { tweened } from "svelte/motion";
  import { fly } from "svelte/transition";
  import { englishWordsRaw } from "../store/store";
  import BlurCover from "./BlurCover.svelte";
  import DynamicCursor from "./DynamicCursor.svelte";
  import RemainingTime from "./RemainingTime.svelte";
  import RestartGameButton from "./RestartGameButton.svelte";
  import SoundEffect from "./SoundEffect.svelte";

  const wordsLimit = 200;
  let words = $englishWordsRaw
    .sort(() => 0.5 - Math.random())
    .slice(wordsLimit);

  // waiting for input, on progress, user loses focus, waiting after bl ur, game over
  let gameState = "waiting for input";
  let typedLetter = "";
  let wordIndex = 0;
  let letterIndex = 0;
  const seconds = 30;
  let remainingSeconds = seconds + 1;
  let timeInterval;
  let wpm = tweened(0, { delay: 300, duration: 1000 });
  let accuracy = tweened(0, { delay: 1300, duration: 1000 });
  let wordInitialLength = [];
  let lastSkippedLetterIndex = new Array(wordsLimit).fill(0);
  let correctLetterList = new Array(wordsLimit).fill(0);
  $: correctLetter = correctLetterList.reduce((x, y) => x + y, 0);

  let currentEl;
  let inputEl;

  let caretLeft = 0;
  $: caretLeftwBorder = caretLeft - 1;
  let caretTop = 0;
  let caretFixedValue;

  let isUnwantedEl = false;
  let isSoundEnable = true;

  const source = "type-writer-hard.wav";

  onMount(() => {
    // Get each word initial length
    words.forEach((word) => wordInitialLength.push(word.length));

    // Get the fixed value of second line top offset
    let i = 0;
    let loop = true;
    while (loop) {
      if (currentEl.children[i].offsetTop > 0) {
        caretFixedValue = currentEl.children[i].offsetTop;
        loop = false;
      }
      i += 1;
    }

    // set input to focus
    focusToInput();

    // Set the initial value of caret
    caretLeft = currentEl.children[0].children[0].offsetLeft;
    caretTop = currentEl.children[0].offsetTop;
  });

  const handleFocus = () => {};

  const handleKeydown = (e) => {
    const currentWordEl = currentEl.children[wordIndex];
    const nextWordEl = currentEl.children[wordIndex + 1];
    const previousWordEl = currentEl.children[wordIndex - 1];
    const letterToErase = currentWordEl.children[letterIndex - 1];

    if (gameState != "game over") {
      // start the timer
      if (gameState != "on progress") {
        startTimer();
      }

      // adding sound effect
      createTypingSound();

      if (e.code === "Space") {
        // prevent space key to act like space & typed space
        e.preventDefault();

        // if the word incorrect give red underline
        if (
          !(correctLetterList[wordIndex] === wordInitialLength[wordIndex]) ||
          words[wordIndex].length > wordInitialLength[wordIndex]
        ) {
          currentWordEl.classList.replace(
            "border-transparent",
            "border-red-500"
          );
        }

        //   pressing space will skip to next word
        lastSkippedLetterIndex[wordIndex] = letterIndex;
        wordIndex += 1;
        letterIndex = 0;

        // Centering current typed paragraph line
        let currentElY = currentEl.getBoundingClientRect().y;
        let nextWordElY = nextWordEl.getBoundingClientRect().y;
        if (nextWordElY > currentElY) {
          nextWordEl.scrollIntoView({ block: "center" });
        }

        // Move the caret
        const currentLetterEl = nextWordEl.children[letterIndex];
        caretTop =
          nextWordEl.offsetTop > 0
            ? caretFixedValue
            : currentEl.children[0].offsetTop;
        caretLeft = currentLetterEl.offsetLeft;
      }

      if (e.code === "Backspace") {
        e.preventDefault();

        // If not on the first letter or not
        if (letterIndex != 0) {
          // Erase last letter from word if its not the initial letter in word
          if (letterIndex - 1 >= wordInitialLength[wordIndex]) {
            words[wordIndex] = words[wordIndex].slice(0, -1);
          }

          // decrease correct letter if the deleted letter is correct
          if (letterToErase.classList.contains("text-white")) {
            correctLetterList[wordIndex] -= 1;
          }

          // delete all text color
          letterToErase.classList.remove("text-white", "text-red-500");

          // move the caret
          const previousLetterEl = currentWordEl.children[letterIndex - 1];
          caretTop =
            currentWordEl.offsetTop > 0
              ? caretFixedValue
              : currentEl.children[0].offsetTop;
          caretLeft = previousLetterEl.offsetLeft;

          letterIndex -= 1;
        } else if (letterIndex === 0 && wordIndex != 0) {
          wordIndex -= 1;

          // Erase red-underline
          const wordElToErase = currentEl.children[wordIndex];
          if (wordElToErase.classList.contains("border-red-500")) {
            wordElToErase.classList.replace(
              "border-red-500",
              "border-transparent"
            );
          }

          // change index to last skipped letter on previous word
          letterIndex = lastSkippedLetterIndex[wordIndex];

          // Centering current typed paragraph line
          let currentElY = currentEl.getBoundingClientRect().y;
          let currentWordElY = currentWordEl.getBoundingClientRect().y;
          let previousWordElY = previousWordEl.getBoundingClientRect().y;
          if (previousWordElY === currentElY && currentWordElY > currentElY) {
            previousWordEl.scrollIntoView({ block: "center" });
          }

          // moving caret
          const previousLetterEl = letterIndex
            ? previousWordEl.children[letterIndex - 1]
            : previousWordEl.children[letterIndex];
          caretTop =
            previousWordEl.offsetTop > 0
              ? caretFixedValue
              : currentEl.children[0].offsetTop;
          caretLeft = letterIndex
            ? previousLetterEl.offsetLeft + previousLetterEl.offsetWidth
            : previousLetterEl.offsetLeft;
        }
      }

      // Change the game state to "on progress", user is playing
      changeGameState("on progress");
    }
  };

  const handleInput = () => {
    // get the current letter element
    const currentWordEl = currentEl.children[wordIndex];
    const currentLetterEl = currentWordEl.children[letterIndex];

    if (gameState != "game over") {
      // check is user still typing after the word without pressing space
      if (letterIndex < wordInitialLength[wordIndex]) {
        // compare typed letter with current letter on paragraph
        const isLetterCorrect = typedLetter === words[wordIndex][letterIndex];
        if (isLetterCorrect) {
          // adding sytle
          currentLetterEl.classList.add("text-white");
          currentLetterEl.classList.remove("text-main-gray");

          // increase the correct letter
          correctLetterList[wordIndex] += 1;
        }
        if (!isLetterCorrect) {
          currentLetterEl.classList.add("text-red-500");
          currentLetterEl.classList.remove("text-main-gray");
        }

        // Move the caret
        if (letterIndex + 1 === wordInitialLength[wordIndex]) {
          caretLeft = currentLetterEl.offsetLeft + currentLetterEl.offsetWidth;
        }
        if (letterIndex + 1 < wordInitialLength[wordIndex]) {
          let nextLetterEl = currentWordEl.children[letterIndex + 1];
          caretLeft = nextLetterEl.offsetLeft;
        }
        caretTop =
          currentWordEl.offsetTop > 0
            ? caretFixedValue
            : currentEl.children[0].offsetTop;
      }

      // user still typing in the end of word
      if (letterIndex >= wordInitialLength[wordIndex]) {
        words[wordIndex] = `${words[wordIndex]}${typedLetter}`;
      }

      // update index to the next letter
      letterIndex += 1;

      // reset typed letter to blank
      typedLetter = "";

      let currentElY = currentEl.getBoundingClientRect().y;
      let currentWordElY = currentWordEl.getBoundingClientRect().y;
      if (currentWordElY > currentElY) {
        currentWordEl.scrollIntoView({ block: "center" });
      }
    }
  };

  // need second handler because the currentEl binding dont update on first handler
  const secondHandleInput = () => {
    if (letterIndex - 1 >= wordInitialLength[wordIndex]) {
      const currentWordEl = currentEl.children[wordIndex];
      const extraLetterEl = currentWordEl.children[letterIndex - 1];
      extraLetterEl.classList.remove("text-main-gray");
      extraLetterEl.classList.add("text-red-900", "text-opacity-80");

      caretTop =
        currentWordEl.offsetTop > 0
          ? caretFixedValue
          : currentEl.children[0].offsetTop;
      caretLeft = extraLetterEl.offsetLeft + extraLetterEl.offsetWidth;
    }
  };

  const handleInputBlur = () => {
    if (gameState != "game over") {
      if (!isUnwantedEl) {
        changeGameState("user loses focus");
      }
      if (timeInterval) {
        stopTimer();
      }
    }
  };

  const handleWindowKeyup = () => {
    // cek supaya event tidak bekerja selain pada saat lose focus
    if (gameState === "user loses focus") {
      // cek apakah masih di awal
      if (remainingSeconds === seconds + 1) {
        changeGameState("waiting for input");
        focusToInput();
      } else {
        changeGameState("waiting after blur");
        focusToInput();
      }
    }
  };

  const handleBlurCoverClick = () => {
    if (remainingSeconds === seconds + 1) {
      changeGameState("waiting for input");
      focusToInput();
    } else {
      changeGameState("waiting after blur");
      focusToInput();
    }
  };

  const resetGame = () => {
    eraseWordsDecoration();
    wordIndex = 0;
    letterIndex = 0;
    remainingSeconds = seconds + 1;
    $wpm = 0;
    $accuracy = 0;
    lastSkippedLetterIndex = new Array(wordsLimit).fill(0);
    correctLetterList = new Array(wordsLimit).fill(0);
    generateRandomWords(wordsLimit);
    wordInitialLength = [];
    words.forEach((word) => wordInitialLength.push(word.length));
    caretLeft = currentEl.children[0].children[0].offsetLeft;
    caretTop = currentEl.children[0].offsetTop;
    focusToInput();
    currentEl.children[0].scrollIntoView({ block: "start" });
    changeGameState("waiting for input");
  };

  const eraseWordsDecoration = () => {
    for (let i = 0; i <= wordIndex; i++) {
      if (currentEl.children[i].classList.contains("border-red-500")) {
        currentEl.children[i].classList.replace(
          "border-red-500",
          "border-transparent"
        );
      }

      for (let j = 0; j < words[i].length; j++) {
        let currentLettertoErase = currentEl.children[i].children[j];
        if (
          currentLettertoErase.classList.contains("text-white") ||
          currentLettertoErase.classList.contains("text-red-500") ||
          currentLettertoErase.classList.contains("text-red-900")
        ) {
          currentEl.children[i].children[j].classList.remove(
            "text-white",
            "text-red-500",
            "text-red-900"
          );
          currentEl.children[i].children[j].classList.add("text-main-gray");
        }
      }
    }
  };

  const changeGameState = (newGameState) => {
    gameState = newGameState;
  };

  const generateRandomWords = (limit) => {
    words = $englishWordsRaw.sort(() => 0.5 - Math.random()).slice(wordsLimit);
  };

  const getResult = () => {
    let oneLetter = 5;
    let minutes = seconds / 60;
    let totalLetter = words
      .slice(0, wordIndex)
      .map((word) => word.length)
      .reduce((a, b) => a + b, words[wordIndex].slice(0, letterIndex).length);

    $wpm = correctLetter / oneLetter / minutes;
    $accuracy = (correctLetter / totalLetter) * 100;
  };

  const setRemainingSeconds = () => {
    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
    }

    if (remainingSeconds === 0) {
      stopTimer();
      getResult();
      changeGameState("game over");
    }
  };

  const stopTimer = () => {
    clearInterval(timeInterval);
  };

  const startTimer = () => {
    if (remainingSeconds === seconds + 1) {
      remainingSeconds -= 1;
    }
    timeInterval = setInterval(setRemainingSeconds, 1000);
  };

  const focusToInput = () => {
    inputEl.focus();
  };

  const changeIsUnwantedEl = (state) => {
    isUnwantedEl = state;
  };

  const toggleSoundEnable = () => {
    isSoundEnable = !isSoundEnable;
  };

  const createTypingSound = () => {
    if (isSoundEnable) {
      let audio = new Audio(source);
      audio.play();
    }
  };
</script>

<svelte:window on:keyup={handleWindowKeyup} />

<div
  class=" max-w-[1186px] min-w-[480px] h-full min-h-[276px] mx-auto grid grid-rows-dis-monkey relative"
>
  <!-- Result Popup -->
  {#if gameState === "game over"}
    <div
      class="absolute z-20 w-full h-full bg-main-black bg-opacity-100 px-[40px] items-center grid"
      transition:fly={{
        y: -200,
        duration: 500,
      }}
    >
      <div
        class="w-full h-fit bg-sub-gray-dark grid grid-rows-dis-monkey gap-[36px] py-[26px] px-[32px] rounded-lg"
      >
        <!-- Title -->
        <div class="flex gap-[18px] items-end">
          <img src="/C-Letter-Purple.svg" alt="#" class="h-full" />
          <h3 class="text-[32px] font-bold text-white leading-[1.125]">
            DiscordType
          </h3>
        </div>

        <div class="grid gap-[36px]">
          <!-- Result -->
          <div class="grid gap-[30px] text-white text-[32px] font-extralight">
            <div class="grid gap-[20x]">
              <h3>wpm</h3>
              <p class="text-[75px] leading-none font-light text-main-purple">
                {Math.trunc($wpm)}
              </p>
            </div>
            <div>
              <h3>accuracy</h3>
              <p class="text-[75px] leading-none font-light text-main-purple">
                {Math.trunc($accuracy)}%
              </p>
            </div>
          </div>

          <button
            on:click={resetGame}
            class="flex text-main-gray text-[24px] gap-2 items-center hover:text-main-purple transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
            <p>play again</p>
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Title DiscordType -->
  <div class="flex gap-[20px] items-end">
    <img src="/C-Letter-Purple.svg" alt="#" class="h-full" />
    <h3 class="text-[32px] font-bold text-white leading-[1.125]">
      DiscordType
    </h3>
  </div>

  <!-- Paragraph Container -->
  <div class="flex items-center">
    <div class="h-[116px] relative grid">
      <!-- User Input -->
      <div class="absolute w-full h-full">
        <input
          type="text"
          bind:this={inputEl}
          bind:value={typedLetter}
          on:focus={handleFocus}
          on:blur={handleInputBlur}
          on:keydown={handleKeydown}
          on:input={handleInput}
          on:input={secondHandleInput}
          class="px-2 w-full h-full opacity-0"
        />
      </div>

      <!-- Remainint Time -->
      {#if gameState === "on progress" || gameState === "waiting after blur"}
        <RemainingTime {gameState} {remainingSeconds} />
      {/if}

      <!-- Sound effect Button -->
      <SoundEffect {isSoundEnable} {toggleSoundEnable} />

      <!-- user on-blur cover -->
      {#if gameState === "user loses focus"}
        <BlurCover {handleBlurCoverClick} />
      {/if}

      <!-- Caret -->
      <DynamicCursor {gameState} {caretLeftwBorder} {caretTop} />

      <!-- Paragraph -->
      <div
        on:mouseenter={() => {
          changeIsUnwantedEl(true);
        }}
        on:mouseleave={() => {
          changeIsUnwantedEl(false);
        }}
        class="unwantedEl text-[26px] text-main-gray flex flex-wrap gap-y-4 gap-x-2 h-full  overflow-hidden
          {gameState === 'user loses focus' ? 'filter blur-sm' : ''}"
        bind:this={currentEl}
      >
        {#each words as word, j}
          <div class="unwantedEl border-b-2 border-transparent flex items-end">
            {#each word as letter, i}
              <span class="unwantedEl leading-none px-[0.25px]">{letter}</span>
            {/each}
          </div>
        {/each}
      </div>

      <!-- restart game button -->
      <RestartGameButton {changeIsUnwantedEl} {resetGame} />
    </div>
  </div>
</div>
