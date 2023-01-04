<script>
  // @ts-nocheck

  import { onMount } from "svelte";

  // @ts-ignore
  let words =
    "To the two friends the treehouse was much more than a treehouse It was a sanctuary away from the other kids where they could be themselves without being teased or bullied It was their secret fortress hidden high in the branches of a huge oak that only they knew existed At least that is what they thought".split(
      " "
    );

  const wordInitialLength = [];
  words.forEach((word) => wordInitialLength.push(word.length));

  let gameState = "waiting for input";
  let typedLetter = "";

  let wordIndex = 0;
  let letterIndex = 0;
  let lastSkippedLetterIndex = words.map((word) => 0);
  let currentEl;
  let correctLetterList = words.map((word) => 0);
  $: correctLetter = correctLetterList.reduce((x, y) => x + y, 0);

  const border = 2;
  let caretLeft = 0;
  $: caretLeftwBorder = caretLeft - (border - 1);
  let caretTop = 0;
  let caretFixedValue;

  onMount(() => {
    let i = 0;
    let loop = true;
    while (loop) {
      if (currentEl.children[i].offsetTop > 0) {
        caretFixedValue = currentEl.children[i].offsetTop;
        loop = false;
      }
      i += 1;
    }
    caretLeft = currentEl.children[0].children[0].offsetLeft;
    caretTop = currentEl.children[0].offsetTop;
  });

  const handleFocus = () => {
    let currentWordEl = currentEl.children[wordIndex];
    caretTop = currentWordEl.offsetTop;
    caretLeft = currentWordEl.children[letterIndex].offsetLeft;
  };

  const handleKeydown = (e) => {
    const currentWordEl = currentEl.children[wordIndex];
    const nextWordEl = currentEl.children[wordIndex + 1];
    const previousWordEl = currentEl.children[wordIndex - 1];
    const letterToErase = currentWordEl.children[letterIndex - 1];

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
        caretLeft = previousLetterEl.offsetLeft + previousLetterEl.offsetWidth;
      }
    }

    // Change the game state to "on progress", user is playing
    changeGameState("on progress");
  };

  const handleInput = () => {
    // get the current letter element
    const currentWordEl = currentEl.children[wordIndex];
    const currentLetterEl = currentWordEl.children[letterIndex];

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
</script>

<main class="w-full h-screen bg-main-black px-8 pt-[45px] pb-[180px] relative">
  <div
    class=" max-w-[1186px] min-w-[480px] h-full min-h-[276px] mx-auto grid grid-rows-dis-monkey"
  >
    <div class="flex gap-[10px] items-end">
      <img src="/purple-fire.svg" alt="#" class="h-full" />
      <h3 class="text-[32px] font-bold text-white leading-[1.125]">
        DiscordType
      </h3>
    </div>

    <div class="absolute top-[300px]">
      <input
        type="text"
        bind:value={typedLetter}
        on:focus={handleFocus}
        on:keydown={handleKeydown}
        on:input={handleInput}
        on:input={secondHandleInput}
        class="px-2"
      />
      <h3 class="text-white">
        <p>{letterIndex}</p>
        <p>{wordIndex}</p>
        <p>{correctLetter}</p>
        <p>{caretLeft}</p>
        <p>{caretTop}</p>
        <p>{caretFixedValue}</p>
      </h3>
    </div>

    <div class="flex items-center">
      <div class="h-[116px] relative">
        <div
          class={`absolute leading-none text-transparent w-[1px] h-[26px] border-l-[${border}px] border-main-purple`}
          style={`left: ${caretLeftwBorder}px; top: ${caretTop}px`}
        />
        <div
          class=" text-[26px] text-main-gray flex flex-wrap gap-y-4 gap-x-2 h-full  overflow-hidden"
          bind:this={currentEl}
        >
          {#each words as word, j}
            <div class="border-b-2 border-transparent flex items-end">
              {#each word as letter, i}
                <span class="leading-none px-[0.25px]">{letter}</span>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</main>
