<script lang="ts">
  import { vitals } from '$lib/stores/simulation';
  import { onMount, onDestroy } from 'svelte';

  // Reactive values
  $: rr = $vitals?.rr ?? 14;
  $: spo2 = $vitals?.spo2 ?? 98;
  $: pulmonaryEdema = $vitals?.pulmonaryEdema ?? 0;
  $: paco2 = $vitals?.paco2 ?? 40;

  // Breathing animation
  let breathPhase = 0;
  let animationFrame: number;

  $: breathDuration = 60 / rr; // seconds per breath

  function animate() {
    const now = performance.now() / 1000;
    breathPhase = (now % breathDuration) / breathDuration;
    animationFrame = requestAnimationFrame(animate);
  }

  onMount(() => {
    animationFrame = requestAnimationFrame(animate);
  });

  onDestroy(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });

  // Inspiration phase 0-0.4, expiration 0.4-1
  $: isInspiration = breathPhase < 0.4;
  $: expansionAmount = isInspiration
    ? Math.sin(breathPhase / 0.4 * Math.PI / 2)
    : Math.cos((breathPhase - 0.4) / 0.6 * Math.PI / 2);

  // Scale based on breathing
  $: lungScale = 1 + expansionAmount * 0.08;

  // Color based on oxygenation
  $: lungHue = spo2 > 94 ? 200 : spo2 > 88 ? 220 : 260; // Blue to purple
  $: lungSaturation = Math.max(20, 60 - (100 - spo2) * 2);
  $: lungColor = `hsl(${lungHue}, ${lungSaturation}%, 45%)`;

  // Edema overlay intensity
  $: edemaOpacity = pulmonaryEdema * 0.7;

  // CO2 indicator
  $: co2Level = (paco2 - 35) / 30; // 0 at 35, 1 at 65
</script>

<div class="lungs-container">
  <svg viewBox="0 0 260 200" class="lungs-svg">
    <defs>
      <!-- Lung gradient -->
      <radialGradient id="lungGradient" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stop-color="{lungColor}" />
        <stop offset="100%" stop-color="hsl({lungHue}, {lungSaturation}%, 25%)" />
      </radialGradient>

      <!-- Edema pattern -->
      <pattern id="edemaPattern" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2" fill="rgba(255,182,193,0.6)" />
      </pattern>

      <filter id="lungGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Trachea and bronchi -->
    <g class="airways">
      <path
        d="M 130 10 L 130 45"
        stroke="#a8c0d0"
        stroke-width="12"
        stroke-linecap="round"
        fill="none"
      />
      <path
        d="M 130 45 L 85 75"
        stroke="#a8c0d0"
        stroke-width="8"
        stroke-linecap="round"
        fill="none"
      />
      <path
        d="M 130 45 L 175 75"
        stroke="#a8c0d0"
        stroke-width="8"
        stroke-linecap="round"
        fill="none"
      />
    </g>

    <!-- Left lung -->
    <g class="left-lung" transform="translate(65, 100)" style="transform-origin: center;">
      <g transform="scale({lungScale})" style="transform-origin: center;">
        <path
          d="M 0 -45
             C -45 -50, -55 -20, -55 20
             C -55 55, -40 75, -10 80
             C 5 82, 15 75, 20 60
             L 25 10
             C 28 -20, 20 -45, 0 -45
             Z"
          fill="url(#lungGradient)"
          stroke="hsl({lungHue}, {lungSaturation}%, 30%)"
          stroke-width="2"
        />

        <!-- Lobes -->
        <path
          d="M -50 20 Q -20 25, 20 15"
          stroke="hsl({lungHue}, {lungSaturation}%, 35%)"
          stroke-width="2"
          fill="none"
          opacity="0.6"
        />

        <!-- Cardiac notch -->
        <path
          d="M 15 30 Q 25 50, 10 70"
          stroke="hsl({lungHue}, {lungSaturation}%, 30%)"
          stroke-width="3"
          fill="none"
        />

        <!-- Edema overlay -->
        {#if pulmonaryEdema > 0.1}
          <path
            d="M 0 -45
               C -45 -50, -55 -20, -55 20
               C -55 55, -40 75, -10 80
               C 5 82, 15 75, 20 60
               L 25 10
               C 28 -20, 20 -45, 0 -45
               Z"
            fill="url(#edemaPattern)"
            opacity="{edemaOpacity}"
            class="edema-overlay"
          />
        {/if}
      </g>
    </g>

    <!-- Right lung (larger, 3 lobes) -->
    <g class="right-lung" transform="translate(195, 100)" style="transform-origin: center;">
      <g transform="scale({lungScale})" style="transform-origin: center;">
        <path
          d="M 0 -45
             C 45 -50, 55 -20, 55 20
             C 55 55, 40 75, 10 80
             C -5 82, -20 70, -25 50
             L -25 10
             C -28 -20, -20 -45, 0 -45
             Z"
          fill="url(#lungGradient)"
          stroke="hsl({lungHue}, {lungSaturation}%, 30%)"
          stroke-width="2"
        />

        <!-- Lobes (3 for right lung) -->
        <path
          d="M 50 -10 Q 15 -5, -20 -15"
          stroke="hsl({lungHue}, {lungSaturation}%, 35%)"
          stroke-width="2"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M 50 30 Q 20 35, -20 25"
          stroke="hsl({lungHue}, {lungSaturation}%, 35%)"
          stroke-width="2"
          fill="none"
          opacity="0.6"
        />

        <!-- Edema overlay -->
        {#if pulmonaryEdema > 0.1}
          <path
            d="M 0 -45
               C 45 -50, 55 -20, 55 20
               C 55 55, 40 75, 10 80
               C -5 82, -20 70, -25 50
               L -25 10
               C -28 -20, -20 -45, 0 -45
               Z"
            fill="url(#edemaPattern)"
            opacity="{edemaOpacity}"
            class="edema-overlay"
          />
        {/if}
      </g>
    </g>

    <!-- Breath indicator -->
    <g class="breath-indicator" transform="translate(130, 170)">
      <text
        x="0"
        y="0"
        text-anchor="middle"
        fill="#888"
        font-size="11"
      >
        RR: {rr.toFixed(0)} /min
      </text>

      <!-- Breathing animation bars -->
      <g transform="translate(-30, 10)">
        {#each [0, 1, 2] as i}
          <rect
            x="{i * 20}"
            y="{8 - expansionAmount * 8}"
            width="15"
            height="{4 + expansionAmount * 8}"
            fill="hsl({lungHue}, {lungSaturation}%, 50%)"
            rx="2"
            opacity="{0.4 + i * 0.2}"
          />
        {/each}
      </g>
    </g>

    <!-- Status indicators -->
    <g class="status-indicators">
      <!-- SpO2 indicator -->
      <g transform="translate(20, 25)">
        <text fill="#888" font-size="10">SpO₂</text>
        <text
          y="15"
          fill="{spo2 >= 94 ? '#4ade80' : spo2 >= 88 ? '#fbbf24' : '#ef4444'}"
          font-size="14"
          font-weight="bold"
        >
          {spo2.toFixed(0)}%
        </text>
      </g>

      <!-- PaCO2 indicator -->
      <g transform="translate(220, 25)">
        <text fill="#888" font-size="10" text-anchor="end">PaCO₂</text>
        <text
          y="15"
          fill="{paco2 <= 45 ? '#4ade80' : paco2 <= 55 ? '#fbbf24' : '#ef4444'}"
          font-size="14"
          font-weight="bold"
          text-anchor="end"
        >
          {paco2.toFixed(0)}
        </text>
      </g>
    </g>

    <!-- Pulmonary edema warning -->
    {#if pulmonaryEdema > 0.3}
      <g class="edema-warning" transform="translate(130, 45)">
        <rect
          x="-50"
          y="-12"
          width="100"
          height="24"
          fill="rgba(239, 68, 68, 0.2)"
          rx="4"
        />
        <text
          text-anchor="middle"
          fill="#ef4444"
          font-size="11"
          font-weight="bold"
          class="warning-text"
        >
          PULMONARY EDEMA
        </text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .lungs-container {
    width: 100%;
    max-width: 280px;
    aspect-ratio: 260 / 200;
  }

  .lungs-svg {
    width: 100%;
    height: 100%;
  }

  .edema-overlay {
    animation: edemaFlow 3s ease-in-out infinite;
  }

  @keyframes edemaFlow {
    0%, 100% {
      opacity: var(--edema-opacity, 0.5);
    }
    50% {
      opacity: calc(var(--edema-opacity, 0.5) * 1.3);
    }
  }

  .warning-text {
    animation: warningBlink 1s ease-in-out infinite;
  }

  @keyframes warningBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  text {
    font-family: system-ui, sans-serif;
  }
</style>
