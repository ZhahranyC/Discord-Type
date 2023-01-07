<script>
  export let gameState;
  export let caretLeftwBorder;
  export let caretTop;
</script>

<div
  class="absolute leading-none w-[1px] h-[26px] border-l-[2px]  
  {gameState === 'waiting for input' || gameState === 'waiting after blur'
    ? 'animate-caret border-main-purple'
    : ''}
    {gameState === 'on progress' ? 'border-main-purple' : ''}
    {gameState != 'waiting for input' &&
  gameState != 'waiting after blur' &&
  gameState != 'on progress'
    ? 'hidden'
    : ''}"
  style={`left: ${caretLeftwBorder}px; top: ${caretTop}px`}
/>
