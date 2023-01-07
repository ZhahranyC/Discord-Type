<script>
  import { fly } from "svelte/transition";
  export let gameState;
  export let remainingSeconds;
</script>

<div
  class="h-[32px] absolute -top-11"
  transition:fly={{
    x: 50,
  }}
>
  <p
    class="font-light text-[32px] leading-none 
{gameState === 'on progress' ? 'text-main-purple' : ''}
{gameState === 'waiting after blur' ? 'text-main-gray' : ''}
"
  >
    {remainingSeconds}
  </p>
</div>
