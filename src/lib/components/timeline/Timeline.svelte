<script lang="ts">
  import { timeMinutes, isPlaying, playbackSpeed, loopMode, currentPhase, currentScenario } from '$lib/stores/simulation';
  import { play, pause, reset, seekTo, setPlaybackSpeed, setLoopMode, togglePlayPause } from '$lib/stores/simulation';

  $: phases = $currentScenario?.phases ?? [];
  $: startTime = phases[0]?.startTime ?? -10;
  $: endTime = phases[phases.length - 1]?.endTime ?? 35;
  $: duration = endTime - startTime;
  $: progress = (($timeMinutes - startTime) / duration) * 100;

  let isDragging = false;
  let timelineEl: HTMLDivElement;

  function handleTimelineClick(e: MouseEvent) {
    if (!timelineEl) return;

    const rect = timelineEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const newTime = startTime + ratio * duration;
    seekTo(newTime);
  }

  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    handleTimelineClick(e);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    handleTimelineClick(e);
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function formatTime(minutes: number): string {
    const sign = minutes >= 0 ? '+' : '';
    const mins = Math.floor(Math.abs(minutes));
    const secs = Math.floor((Math.abs(minutes) % 1) * 60);
    return `T${sign}${minutes >= 0 ? '' : '-'}${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const speeds = [0.5, 1, 2, 4];
</script>

<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMouseMove} />

<div class="timeline-container">
  <!-- Playback Controls -->
  <div class="playback-controls">
    <button class="control-btn" on:click={reset} title="Reset">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
      </svg>
    </button>

    <button class="control-btn play-btn" on:click={togglePlayPause} title={$isPlaying ? 'Pause' : 'Play'}>
      {#if $isPlaying}
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      {/if}
    </button>

    <!-- Speed Control -->
    <div class="speed-control">
      <span class="speed-label">Speed</span>
      <div class="speed-buttons">
        {#each speeds as speed}
          <button
            class="speed-btn"
            class:active={$playbackSpeed === speed}
            on:click={() => setPlaybackSpeed(speed)}
          >
            {speed}x
          </button>
        {/each}
      </div>
    </div>

    <!-- Loop Toggle -->
    <button
      class="control-btn loop-btn"
      class:active={$loopMode}
      on:click={() => setLoopMode(!$loopMode)}
      title="Loop Mode"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
    </button>
  </div>

  <!-- Current Time Display -->
  <div class="time-display">
    <span class="current-time">{formatTime($timeMinutes)}</span>
    {#if $currentPhase}
      <span class="phase-name">{$currentPhase.name}</span>
    {/if}
  </div>

  <!-- Timeline Track -->
  <div
    class="timeline-track"
    bind:this={timelineEl}
    on:mousedown={handleMouseDown}
    role="slider"
    aria-label="Simulation timeline"
    aria-valuemin={startTime}
    aria-valuemax={endTime}
    aria-valuenow={$timeMinutes}
    tabindex="0"
  >
    <!-- Phase Regions -->
    {#each phases as phase, i}
      {@const phaseStart = ((phase.startTime - startTime) / duration) * 100}
      {@const phaseWidth = ((phase.endTime - phase.startTime) / duration) * 100}
      <div
        class="phase-region"
        class:current={$currentPhase?.id === phase.id}
        style="left: {phaseStart}%; width: {phaseWidth}%;"
        title={phase.name}
      >
        <span class="phase-label">{phase.name}</span>
      </div>
    {/each}

    <!-- Progress Bar -->
    <div class="progress-bar" style="width: {progress}%;"></div>

    <!-- Playhead -->
    <div class="playhead" style="left: {progress}%;"></div>

    <!-- Tick Marks -->
    <div class="tick-marks">
      {#each Array(Math.ceil(duration / 5) + 1) as _, i}
        {@const tickTime = startTime + i * 5}
        {@const tickPos = ((tickTime - startTime) / duration) * 100}
        {#if tickTime <= endTime}
          <div class="tick" style="left: {tickPos}%;">
            <span class="tick-label">{tickTime >= 0 ? '+' : ''}{tickTime}</span>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Phase Jump List -->
  <div class="phase-list">
    {#each phases as phase}
      <button
        class="phase-jump-btn"
        class:active={$currentPhase?.id === phase.id}
        on:click={() => seekTo(phase.startTime)}
      >
        {phase.name}
      </button>
    {/each}
  </div>
</div>

<style>
  .timeline-container {
    background: #0d0d1a;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .playback-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #2a2a4a;
    color: #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: #3a3a5a;
    color: #fff;
  }

  .control-btn.active {
    background: #4a66a0;
    color: #fff;
  }

  .play-btn {
    width: 44px;
    height: 44px;
    background: #4ade80;
    color: #000;
  }

  .play-btn:hover {
    background: #22c55e;
    color: #000;
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .speed-label {
    color: #666;
    font-size: 11px;
    text-transform: uppercase;
  }

  .speed-buttons {
    display: flex;
    gap: 4px;
  }

  .speed-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: #2a2a4a;
    color: #888;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .speed-btn:hover {
    background: #3a3a5a;
    color: #fff;
  }

  .speed-btn.active {
    background: #4a66a0;
    color: #fff;
  }

  .time-display {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .current-time {
    font-size: 24px;
    font-weight: 700;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    color: #fff;
  }

  .phase-name {
    color: #4ade80;
    font-size: 14px;
    font-weight: 600;
  }

  .timeline-track {
    position: relative;
    height: 60px;
    background: #16162a;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;
  }

  .phase-region {
    position: absolute;
    top: 0;
    height: 40px;
    background: rgba(74, 102, 160, 0.2);
    border-right: 1px solid rgba(74, 102, 160, 0.4);
    display: flex;
    align-items: flex-end;
    padding: 4px;
    overflow: hidden;
  }

  .phase-region.current {
    background: rgba(74, 222, 128, 0.2);
    border-color: rgba(74, 222, 128, 0.4);
  }

  .phase-label {
    font-size: 9px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, rgba(74, 222, 128, 0.3), rgba(74, 222, 128, 0.1));
    pointer-events: none;
  }

  .playhead {
    position: absolute;
    top: 0;
    width: 3px;
    height: 100%;
    background: #4ade80;
    transform: translateX(-50%);
    pointer-events: none;
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  }

  .tick-marks {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
  }

  .tick {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
  }

  .tick::before {
    content: '';
    width: 1px;
    height: 6px;
    background: #444;
  }

  .tick-label {
    font-size: 9px;
    color: #555;
    margin-top: 2px;
  }

  .phase-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .phase-jump-btn {
    padding: 6px 12px;
    border: 1px solid #2a2a4a;
    border-radius: 16px;
    background: transparent;
    color: #888;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .phase-jump-btn:hover {
    border-color: #4a4a6a;
    color: #fff;
  }

  .phase-jump-btn.active {
    background: #4ade80;
    border-color: #4ade80;
    color: #000;
  }

  @media (max-width: 768px) {
    .playback-controls {
      flex-wrap: wrap;
    }

    .speed-control {
      margin-left: 0;
      width: 100%;
      margin-top: 8px;
    }

    .phase-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
