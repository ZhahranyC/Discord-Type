<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { blur } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import { englishWordsRaw } from "./store/store";

  let words = $englishWordsRaw.sort(() => 0.5 - Math.random()).slice(200);
  let gameState = "waiting for input";
  let typedLetter = "";
  let wordIndex = 0;
  let letterIndex = 0;
  const settedSeconds = 11;
  let remainingSeconds = settedSeconds;
  let timeInterval;
  let wpm = tweened(0, { delay: 300, duration: 1000 });
  let accuracy = tweened(0, { delay: 1300, duration: 1000 });
  let wordInitialLength = [];
  let lastSkippedLetterIndex = words.map((word) => 0);
  let correctLetterList = words.map((word) => 0);
  $: correctLetter = correctLetterList.reduce((x, y) => x + y, 0);

  let isUnwantedEl = false;

  const border = 2;
  let caretEl;
  let caretLeft = 0;
  $: caretLeftwBorder = caretLeft - (border - 1);
  let caretTop = 0;
  let caretFixedValue;

  let currentEl;
  let inputEl;
  let blurCoverEl;
  let remainingSecondsEl;

  const getResult = () => {
    let oneLetter = 5;
    let minutes = (settedSeconds - 1) / 60;
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
      clearInterval(timeInterval);
      changeGameState("game over");
      inputEl.blur();
      getResult();
    }
  };

  onMount(() => {
    // get caret fixed top position
    let i = 0;
    let loop = true;
    while (loop) {
      if (currentEl.children[i].offsetTop > 0) {
        caretFixedValue = currentEl.children[i].offsetTop;
        loop = false;
      }
      i += 1;
    }

    words.forEach((word) => wordInitialLength.push(word.length));

    // set caret position
    caretLeft = currentEl.children[0].children[0].offsetLeft;
    caretTop = currentEl.children[0].offsetTop;

    inputEl.focus();
  });

  const handleBlur = () => {
    if (!isUnwantedEl && gameState != "game over") {
      // configure elements classes
      caretEl.classList.remove("animate-caret");
      caretEl.classList.add("hidden");
      blurCoverEl.classList.remove("hidden");
      if (remainingSeconds != settedSeconds) {
        remainingSecondsEl.classList.add("hidden");
      }
      currentEl.classList.add("filter", "blur-sm");

      clearInterval(timeInterval);
      // toggle isUserNotFocus
      changeGameState("waiting for input");
    }
  };

  const userFocusAgain = () => {
    if (gameState != "game over") {
      // configure elements classes

      if (caretEl) {
        if (gameState === "waiting for input")
          caretEl.classList.add("animate-caret");
        caretEl.classList.remove("hidden");
        blurCoverEl.classList.add("hidden");
      }
      if (remainingSeconds != settedSeconds) {
        remainingSecondsEl.classList.remove("hidden");
      }
      currentEl.classList.remove("filter", "blur-sm");

      inputEl.focus();
    }
  };

  const resetGame = (isNewGame) => {
    changeGameState("waiting for input");
    for (let i = 0; i <= wordIndex; i++) {
      if (currentEl.children[i].classList.contains("border-red-500")) {
        currentEl.children[i].classList.replace(
          "border-red-500",
          "border-transparent"
        );
      }
      for (let j = 0; j < words[i].length; j++) {
        currentEl.children[i].children[j].classList.remove(
          "text-white",
          "text-red-500",
          "text-red-900"
        );
        currentEl.children[i].children[j].classList.add("text-main-gray");
      }
    }

    words = generateRandomWords(200);
    wordInitialLength = [];
    typedLetter = "";
    wordIndex = 0;
    letterIndex = 0;
    remainingSeconds = settedSeconds;
    $wpm = 0;
    $accuracy = 0;
    lastSkippedLetterIndex = words.map((word) => 0);
    correctLetterList = words.map((word) => 0);
    words.forEach((word) => wordInitialLength.push(word.length));

    isUnwantedEl = isNewGame === "yes" ? false : true;

    caretLeft = currentEl.children[0].children[0].offsetLeft;
    caretTop = currentEl.children[0].offsetTop;

    clearInterval(timeInterval);

    userFocusAgain();
    inputEl.focus();
  };

  const handleKeydown = (e) => {
    const currentWordEl = currentEl.children[wordIndex];
    const nextWordEl = currentEl.children[wordIndex + 1];
    const previousWordEl = currentEl.children[wordIndex - 1];
    const letterToErase = currentWordEl.children[letterIndex - 1];

    // remove blinking cursor
    caretEl.classList.remove("animate-caret");

    if (e.code === "Space") {
      // prevent space key to act like space & typed space
      e.preventDefault();

      // if the word incorrect give red underline
      if (
        !(correctLetterList[wordIndex] === wordInitialLength[wordIndex]) ||
        words[wordIndex].length > wordInitialLength[wordIndex]
      ) {
        currentWordEl.classList.replace("border-transparent", "border-red-500");
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
        nextWordEl.offsetTop > 0 ? 44 : currentEl.children[0].offsetTop;
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
          currentWordEl.offsetTop > 0 ? 44 : currentEl.children[0].offsetTop;
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
        const previousLetterEl = previousWordEl.children[letterIndex - 1];
        caretTop =
          previousWordEl.offsetTop > 0 ? 44 : currentEl.children[0].offsetTop;
        caretLeft = previousLetterEl
          ? previousLetterEl.offsetLeft + previousLetterEl.offsetWidth
          : currentEl.children[0].children[0];
      }
    }

    // Change the game state to "on progress", user is playing

    // setRemainingSeconds()
  };

  const handleInput = () => {
    // get the current letter element
    const currentWordEl = currentEl.children[wordIndex];
    const currentLetterEl = currentWordEl.children[letterIndex];

    // remove blinking cursor
    caretEl.classList.remove("animate-caret");

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
        currentWordEl.offsetTop > 0 ? 44 : currentEl.children[0].offsetTop;
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

    if (remainingSeconds === settedSeconds) {
      remainingSeconds -= 1;
    }

    if (gameState === "waiting for input") {
      timeInterval = setInterval(setRemainingSeconds, 1000);
    }

    changeGameState("on progress");
  };

  const secondHandleInput = () => {
    if (letterIndex - 1 >= wordInitialLength[wordIndex]) {
      const currentWordEl = currentEl.children[wordIndex];
      const extraLetterEl = currentWordEl.children[letterIndex - 1];
      extraLetterEl.classList.remove("text-main-gray");
      extraLetterEl.classList.add("text-red-900", "text-opacity-80");

      caretTop =
        currentWordEl.offsetTop > 0 ? 44 : currentEl.children[0].offsetTop;
      caretLeft = extraLetterEl.offsetLeft + extraLetterEl.offsetWidth;
    }
  };

  const changeGameState = (newGameState) => {
    gameState = newGameState;
  };

  const generateRandomWords = (limit) => {
    return $englishWordsRaw.sort(() => 0.5 - Math.random()).slice(0, limit);
  };

  const toggleIsUnwantedEl = () => {
    isUnwantedEl = !isUnwantedEl;
  };

  $: console.log(gameState);
</script>

<svelte:window on:keyup={userFocusAgain} />

<main
  class="w-full min-w-[544px] h-screen bg-main-black px-8 pt-[45px] pb-[180px] relative font-lexend-deca"
>
  <div
    class="max-w-[1186px] h-full min-h-[276px] mx-auto grid grid-rows-dis-monkey relative"
  >
    <!-- result popup -->
    {#if gameState === "game over"}
      <div
        class="absolute z-20 w-full h-full bg-main-black bg-opacity-100 grid px-[40px] items-center"
      >
        <div
          class="w-full h-fit bg-sub-gray-dark grid grid-rows-dis-monkey gap-[36px] py-[26px] px-[32px] rounded-lg"
        >
          <!-- Title -->
          <div class="flex gap-[18px] items-end">
            <img src="/purple-fire.svg" alt="#" class="h-full" />
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
              on:mouseenter={toggleIsUnwantedEl}
              on:mouseleave={toggleIsUnwantedEl}
              on:click={() => resetGame("yes")}
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

    <!-- Title -->
    <div class="flex gap-[18px] items-end">
      <img src="/purple-fire.svg" alt="#" class="h-full" />
      <h3 class="text-[32px] font-bold text-white leading-[1.125]">
        DiscordType
      </h3>
    </div>

    <div class="flex items-center">
      <div class="h-[116px] relative">
        <!-- letter input -->
        <div class="absolute w-full h-full">
          <input
            type="text"
            bind:value={typedLetter}
            bind:this={inputEl}
            on:blur={handleBlur}
            on:keydown={handleKeydown}
            on:input={handleInput}
            on:input={secondHandleInput}
            class="px-2 w-full h-full opacity-0"
          />
        </div>

        <!-- user on-blur cover -->
        <button
          on:click={userFocusAgain}
          class="unwantedEl absolute flex justify-center items-center bg-main-black w-full h-full bg-opacity-0 text-white text-[17px] tracking-wider hover:text-main-purple z-10 group transition-all hidden"
          transition:blur={{ duration: 200 }}
          bind:this={blurCoverEl}
        >
          <div class="unwantedEl flex gap-2 items-center">
            <div
              class="unwantedEl w-8 h-8 relative flex justify-center items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="unwantedEl w-6 aspect-square absolute group-hover:fill-main-purple group-hover:w-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  class="unwantedEl"
                />
              </svg>
            </div>
            <p class="unwantedEl">Click or press any key to focus</p>
          </div>
        </button>

        <!-- Caret -->
        {#if gameState != "game over"}
          <div
            bind:this={caretEl}
            class={`absolute leading-none text-transparent w-[1px] h-[26px] border-main-purple ease-linear duration-[50ms] transition-all animate-caret`}
            style={`left: ${caretLeftwBorder}px; top: ${caretTop}px; border-left-width: ${border}px`}
          />
          <div />
        {/if}

        <!-- Remaining Time -->
        {#if remainingSeconds != settedSeconds}
          <div class="h-[32px] absolute -top-11">
            <p
              bind:this={remainingSecondsEl}
              class="text-main-purple font-light text-[32px] leading-none"
            >
              {remainingSeconds}
            </p>
          </div>
        {/if}

        <!-- Paragraph -->
        <div
          class="unwantedEl text-[26px] text-main-gray flex flex-wrap gap-y-4 gap-x-2 h-full overflow-hidden select-none"
          bind:this={currentEl}
        >
          {#each words as word, j}
            <div
              class="unwantedEl border-b-2 border-transparent flex items-end"
            >
              {#each word as letter, i}
                <span class="unwantedEl leading-none px-[0.25px]">{letter}</span
                >
              {/each}
            </div>
          {/each}
        </div>

        <!-- restart game button -->
        <div class="mt-10 grid justify-center text-white  ">
          <button
            on:mouseenter={toggleIsUnwantedEl}
            on:mouseleave={toggleIsUnwantedEl}
            on:click={() => resetGame("No")}
            class="unwantedEl hover:text-main-purple transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="unwantedEl w-6 h-6"
            >
              <path
                fill-rule="evenodd"
                d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
                clip-rule="evenodd"
                class="unwantedEl"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</main>
