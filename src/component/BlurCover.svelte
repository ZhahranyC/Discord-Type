<script>
  import { blur } from "svelte/transition";
  export let handleBlurCoverClick;
</script>

<button
  on:click={handleBlurCoverClick}
  class="absolute justify-center items-center bg-main-black w-full h-full bg-opacity-30 text-white text-[17px] tracking-wider hover:text-main-purple z-10 group transition-all box-content px-4 justify-self-center flex"
  in:blur={{ duration: 400 }}
  out:blur={{ duration: 100 }}
>
  <div class=" flex gap-2 items-center">
    <div class=" w-8 h-8 relative flex justify-center items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class=" w-6 aspect-square absolute group-hover:fill-main-purple group-hover:w-8"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          class=""
        />
      </svg>
    </div>
    <p class="unwantedEl">Click or press any key to focus</p>
  </div>
</button>
