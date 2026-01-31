<script lang="ts">
  import { vitals, currentScenario } from '$lib/stores/simulation';
  import type { Phenotype } from '$lib/engine/types';

  // Reactive values from store
  $: contractility = $vitals?.contractility ?? 0.5;
  $: hr = $vitals?.hr ?? 72;
  $: lvotGradient = $vitals?.lvotGradient ?? 0;
  $: ischemiaIndex = $vitals?.ischemiaIndex ?? 0;
  $: phenotype = $currentScenario?.phenotype ?? 'DCM';

  // Animation state
  let beatPhase = 0;
  let animationFrame: number;

  // Beat animation tied to HR
  $: beatDuration = 60 / hr; // seconds per beat

  function animate() {
    const now = performance.now() / 1000;
    beatPhase = (now % beatDuration) / beatDuration;
    animationFrame = requestAnimationFrame(animate);
  }

  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    animationFrame = requestAnimationFrame(animate);
  });

  onDestroy(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });

  // Calculate heart shape based on phenotype and state
  $: isDCM = phenotype === 'DCM';
  $: isHCM = phenotype === 'HCM';

  // Contraction animation - systole at phase 0-0.35, diastole at 0.35-1
  $: isSystole = beatPhase < 0.35;
  $: contractionAmount = isSystole
    ? Math.sin(beatPhase / 0.35 * Math.PI) * contractility
    : 0;

  // DCM: dilated chamber, thin walls
  // HCM: thick walls, small chamber, possible LVOT obstruction
  $: chamberScale = isDCM ? 1.3 : isHCM ? 0.75 : 1;
  $: wallThickness = isDCM ? 0.7 : isHCM ? 1.5 : 1;

  // LVOT obstruction visualization for HCM
  $: lvotObstruction = isHCM ? Math.min(1, lvotGradient / 100) : 0;

  // Ischemia coloring
  $: ischemiaOpacity = ischemiaIndex * 0.6;

  // Transform calculations
  $: heartScale = 1 - contractionAmount * 0.12;
  $: chamberSqueeze = 1 - contractionAmount * 0.25;
</script>

<div class="heart-container">
  <svg viewBox="0 0 200 220" class="heart-svg">
    <defs>
      <!-- Gradients -->
      <radialGradient id="heartGradient" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#e85d75" />
        <stop offset="100%" stop-color="#8b1538" />
      </radialGradient>

      <radialGradient id="chamberGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#4a0000" />
        <stop offset="100%" stop-color="#2a0000" />
      </radialGradient>

      <linearGradient id="ischemiaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6b4c9a" stop-opacity="{ischemiaOpacity}" />
        <stop offset="100%" stop-color="#4a2c7a" stop-opacity="{ischemiaOpacity}" />
      </linearGradient>

      <!-- Filters -->
      <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>

    <!-- Main heart group with beating animation -->
    <g transform="translate(100, 110)" style="transform-origin: center;">
      <g transform="scale({heartScale})" style="transform-origin: center;">

        <!-- Heart outline / myocardium -->
        <g filter="url(#heartShadow)">
          <!-- Right atrium -->
          <ellipse
            cx="35"
            cy="-55"
            rx="{22 * wallThickness}"
            ry="{20 * wallThickness}"
            fill="url(#heartGradient)"
            class="heart-chamber"
          />

          <!-- Left atrium -->
          <ellipse
            cx="-35"
            cy="-55"
            rx="{22 * wallThickness}"
            ry="{20 * wallThickness}"
            fill="url(#heartGradient)"
            class="heart-chamber"
          />

          <!-- Main heart body -->
          <path
            d="M 0 85
               C -70 60, -85 -20, -55 -50
               C -35 -75, 0 -65, 0 -45
               C 0 -65, 35 -75, 55 -50
               C 85 -20, 70 60, 0 85
               Z"
            fill="url(#heartGradient)"
            stroke="#6d0a24"
            stroke-width="{2 * wallThickness}"
            class="heart-body"
          />
        </g>

        <!-- Chamber visualization -->
        <g class="chambers">
          <!-- Right ventricle -->
          <ellipse
            cx="25"
            cy="15"
            rx="{18 * chamberScale * chamberSqueeze}"
            ry="{30 * chamberScale}"
            fill="url(#chamberGradient)"
            opacity="0.8"
          />

          <!-- Left ventricle -->
          <ellipse
            cx="-25"
            cy="15"
            rx="{18 * chamberScale * chamberSqueeze}"
            ry="{30 * chamberScale}"
            fill="url(#chamberGradient)"
            opacity="0.8"
          />

          <!-- Septum -->
          <rect
            x="-3"
            y="-20"
            width="{6 * wallThickness}"
            height="65"
            fill="#8b1538"
            rx="3"
          />
        </g>

        <!-- LVOT obstruction indicator for HCM -->
        {#if isHCM && lvotObstruction > 0.1}
          <g class="lvot-obstruction">
            <!-- SAM (Systolic Anterior Motion) wedge -->
            <path
              d="M -15 -25
                 L {-15 + lvotObstruction * 25} -15
                 L -15 -5
                 Z"
              fill="#ff6b6b"
              opacity="{0.3 + lvotObstruction * 0.5}"
              class="sam-indicator"
            >
              <animate
                attributeName="opacity"
                values="{0.3 + lvotObstruction * 0.5};{0.5 + lvotObstruction * 0.5};{0.3 + lvotObstruction * 0.5}"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </path>

            <!-- Obstruction label -->
            <text
              x="-5"
              y="-35"
              fill="#ff6b6b"
              font-size="8"
              text-anchor="middle"
              class="lvot-label"
            >
              LVOTO
            </text>
          </g>
        {/if}

        <!-- Ischemia overlay -->
        {#if ischemiaIndex > 0.1}
          <path
            d="M 0 85
               C -70 60, -85 -20, -55 -50
               C -35 -75, 0 -65, 0 -45
               C 0 -65, 35 -75, 55 -50
               C 85 -20, 70 60, 0 85
               Z"
            fill="url(#ischemiaGradient)"
            class="ischemia-overlay"
          />
        {/if}

        <!-- Great vessels -->
        <g class="vessels">
          <!-- Aorta -->
          <path
            d="M -20 -70 Q -25 -90, -15 -100 Q 0 -105, 15 -100"
            fill="none"
            stroke="#c94c5d"
            stroke-width="10"
            stroke-linecap="round"
          />

          <!-- Pulmonary artery -->
          <path
            d="M 20 -70 Q 30 -85, 45 -90"
            fill="none"
            stroke="#5a7ab8"
            stroke-width="8"
            stroke-linecap="round"
          />

          <!-- Vena cava superior -->
          <path
            d="M 45 -55 L 55 -90"
            fill="none"
            stroke="#4a5a8a"
            stroke-width="8"
            stroke-linecap="round"
          />

          <!-- Vena cava inferior -->
          <path
            d="M 45 30 L 55 65"
            fill="none"
            stroke="#4a5a8a"
            stroke-width="8"
            stroke-linecap="round"
          />
        </g>

        <!-- Heart beat pulse effect -->
        <circle
          cx="0"
          cy="10"
          r="{45 + (isSystole ? 5 : 0)}"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="2"
          opacity="{isSystole ? 0.3 : 0}"
        />
      </g>
    </g>

    <!-- Labels -->
    <text x="100" y="210" fill="#888" font-size="10" text-anchor="middle" class="phenotype-label">
      {phenotype === 'DCM' ? 'Dilated Cardiomyopathy' : 'Hypertrophic Cardiomyopathy'}
    </text>
  </svg>
</div>

<style>
  .heart-container {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 200 / 220;
  }

  .heart-svg {
    width: 100%;
    height: 100%;
  }

  .heart-body {
    transition: fill 0.3s ease;
  }

  .ischemia-overlay {
    pointer-events: none;
    animation: ischemiaPulse 2s ease-in-out infinite;
  }

  @keyframes ischemiaPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  .lvot-label {
    font-weight: bold;
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .phenotype-label {
    font-family: system-ui, sans-serif;
  }
</style>
