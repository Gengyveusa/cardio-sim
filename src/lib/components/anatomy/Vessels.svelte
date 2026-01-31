<script lang="ts">
  import { vitals, currentScenario } from '$lib/stores/simulation';

  // Reactive values
  $: preload = $vitals?.preload ?? 0.5;
  $: afterload = $vitals?.afterload ?? 0.5;
  $: coronaryPerfusion = $vitals?.coronaryPerfusion ?? 0.8;
  $: svr = $vitals?.svr ?? 1200;
  $: co = $vitals?.co ?? 5;
  $: lvotGradient = $vitals?.lvotGradient ?? 0;
  $: phenotype = $currentScenario?.phenotype ?? 'DCM';

  // Color calculations
  function getColor(value: number, thresholds: { low: number; high: number }): string {
    if (value < thresholds.low) return '#ef4444'; // Red - too low
    if (value > thresholds.high) return '#fbbf24'; // Yellow - too high
    return '#4ade80'; // Green - normal
  }

  $: preloadColor = getColor(preload, { low: 0.35, high: 0.7 });
  $: afterloadColor = getColor(afterload, { low: 0.3, high: 0.7 });
  $: coronaryColor = coronaryPerfusion < 0.5 ? '#ef4444' : coronaryPerfusion < 0.7 ? '#fbbf24' : '#4ade80';

  // Vessel animation
  $: flowSpeed = co / 5; // Normalize to normal CO
</script>

<div class="vessels-container">
  <svg viewBox="0 0 300 180" class="vessels-svg">
    <defs>
      <!-- Animated flow pattern -->
      <pattern id="flowPattern" width="20" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="3" fill="rgba(255,255,255,0.3)">
          <animate
            attributeName="cx"
            values="0;20"
            dur="{2 / flowSpeed}s"
            repeatCount="indefinite"
          />
        </circle>
      </pattern>

      <!-- Vessel gradients -->
      <linearGradient id="arteryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c94c5d" />
        <stop offset="100%" stop-color="#8b1538" />
      </linearGradient>

      <linearGradient id="veinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4a5a8a" />
        <stop offset="100%" stop-color="#2a3a5a" />
      </linearGradient>

      <linearGradient id="coronaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="{coronaryColor}" />
        <stop offset="100%" stop-color="{coronaryColor}" stop-opacity="0.5" />
      </linearGradient>
    </defs>

    <!-- Title -->
    <text x="150" y="15" text-anchor="middle" fill="#888" font-size="12" font-weight="bold">
      Hemodynamic Status
    </text>

    <!-- Preload Meter -->
    <g class="preload-meter" transform="translate(25, 35)">
      <text fill="#888" font-size="10" font-weight="bold">PRELOAD</text>

      <!-- Meter background -->
      <rect x="0" y="8" width="80" height="20" fill="#1a1a2e" rx="4" />

      <!-- Meter fill -->
      <rect
        x="2"
        y="10"
        width="{76 * preload}"
        height="16"
        fill="{preloadColor}"
        rx="3"
        class="meter-fill"
      />

      <!-- Tick marks -->
      {#each [0.25, 0.5, 0.75] as tick}
        <line
          x1="{2 + 76 * tick}"
          y1="8"
          x2="{2 + 76 * tick}"
          y2="28"
          stroke="#444"
          stroke-width="1"
        />
      {/each}

      <!-- Value label -->
      <text x="40" y="35" text-anchor="middle" fill="#ccc" font-size="9">
        {(preload * 100).toFixed(0)}%
      </text>

      <!-- Vein icon -->
      <g transform="translate(0, 45)">
        <path
          d="M 5 0 L 75 0"
          stroke="url(#veinGradient)"
          stroke-width="10"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M 5 0 L 75 0"
          stroke="url(#flowPattern)"
          stroke-width="8"
          stroke-linecap="round"
          fill="none"
        />
        <text x="85" y="4" fill="#666" font-size="8">Venous return</text>
      </g>
    </g>

    <!-- Afterload Meter -->
    <g class="afterload-meter" transform="translate(195, 35)">
      <text fill="#888" font-size="10" font-weight="bold">AFTERLOAD</text>

      <!-- Meter background -->
      <rect x="0" y="8" width="80" height="20" fill="#1a1a2e" rx="4" />

      <!-- Meter fill -->
      <rect
        x="2"
        y="10"
        width="{76 * afterload}"
        height="16"
        fill="{afterloadColor}"
        rx="3"
        class="meter-fill"
      />

      <!-- Tick marks -->
      {#each [0.25, 0.5, 0.75] as tick}
        <line
          x1="{2 + 76 * tick}"
          y1="8"
          x2="{2 + 76 * tick}"
          y2="28"
          stroke="#444"
          stroke-width="1"
        />
      {/each}

      <!-- Value label -->
      <text x="40" y="35" text-anchor="middle" fill="#ccc" font-size="9">
        {(afterload * 100).toFixed(0)}%
      </text>

      <!-- Artery icon -->
      <g transform="translate(0, 45)">
        <path
          d="M 5 0 L 75 0"
          stroke="url(#arteryGradient)"
          stroke-width="10"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M 5 0 L 75 0"
          stroke="url(#flowPattern)"
          stroke-width="8"
          stroke-linecap="round"
          fill="none"
        />
        <text x="85" y="4" fill="#666" font-size="8">SVR: {svr.toFixed(0)}</text>
      </g>
    </g>

    <!-- Coronary Perfusion Indicator -->
    <g class="coronary-perfusion" transform="translate(110, 100)">
      <text x="40" y="0" text-anchor="middle" fill="#888" font-size="10" font-weight="bold">
        CORONARY PERFUSION
      </text>

      <!-- Coronary artery visualization -->
      <g transform="translate(0, 10)">
        <!-- Main coronary trunk -->
        <path
          d="M 40 5 Q 30 15, 20 25 Q 10 35, 5 50"
          stroke="url(#coronaryGradient)"
          stroke-width="6"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M 40 5 Q 50 15, 60 25 Q 70 35, 75 50"
          stroke="url(#coronaryGradient)"
          stroke-width="6"
          stroke-linecap="round"
          fill="none"
        />

        <!-- Branches -->
        <path
          d="M 25 20 Q 15 25, 10 35"
          stroke="{coronaryColor}"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M 55 20 Q 65 25, 70 35"
          stroke="{coronaryColor}"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
          opacity="0.7"
        />

        <!-- Flow animation -->
        {#if coronaryPerfusion > 0.3}
          <circle r="3" fill="rgba(255,100,100,0.8)">
            <animateMotion
              path="M 40 5 Q 30 15, 20 25 Q 10 35, 5 50"
              dur="{3 / coronaryPerfusion}s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="rgba(255,100,100,0.8)">
            <animateMotion
              path="M 40 5 Q 50 15, 60 25 Q 70 35, 75 50"
              dur="{3 / coronaryPerfusion}s"
              repeatCount="indefinite"
            />
          </circle>
        {/if}
      </g>

      <!-- Perfusion index -->
      <text x="40" y="75" text-anchor="middle" fill="{coronaryColor}" font-size="14" font-weight="bold">
        {(coronaryPerfusion * 100).toFixed(0)}%
      </text>

      <!-- Warning if low -->
      {#if coronaryPerfusion < 0.5}
        <text
          x="40"
          y="90"
          text-anchor="middle"
          fill="#ef4444"
          font-size="9"
          class="warning-text"
        >
          ISCHEMIA RISK
        </text>
      {/if}
    </g>

    <!-- Cardiac Output Indicator -->
    <g class="cardiac-output" transform="translate(25, 115)">
      <text fill="#888" font-size="10" font-weight="bold">CARDIAC OUTPUT</text>

      <!-- CO bar -->
      <rect x="0" y="8" width="70" height="14" fill="#1a1a2e" rx="3" />
      <rect
        x="2"
        y="10"
        width="{Math.min(66, 66 * (co / 7))}"
        height="10"
        fill="{co < 3 ? '#ef4444' : co < 4 ? '#fbbf24' : '#4ade80'}"
        rx="2"
      />

      <text x="75" y="20" fill="#ccc" font-size="12" font-weight="bold">
        {co.toFixed(1)} L/min
      </text>
    </g>

    <!-- LVOT Gradient (for HCM) -->
    {#if phenotype === 'HCM'}
      <g class="lvot-gradient" transform="translate(205, 115)">
        <text fill="#888" font-size="10" font-weight="bold">LVOT GRADIENT</text>

        <rect x="0" y="8" width="70" height="14" fill="#1a1a2e" rx="3" />
        <rect
          x="2"
          y="10"
          width="{Math.min(66, 66 * (lvotGradient / 100))}"
          height="10"
          fill="{lvotGradient < 30 ? '#4ade80' : lvotGradient < 60 ? '#fbbf24' : '#ef4444'}"
          rx="2"
        />

        <text
          x="75"
          y="20"
          fill="{lvotGradient > 50 ? '#ef4444' : '#ccc'}"
          font-size="12"
          font-weight="bold"
        >
          {lvotGradient.toFixed(0)} mmHg
        </text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .vessels-container {
    width: 100%;
    max-width: 320px;
    aspect-ratio: 300 / 180;
  }

  .vessels-svg {
    width: 100%;
    height: 100%;
  }

  .meter-fill {
    transition: width 0.3s ease, fill 0.3s ease;
  }

  .warning-text {
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  text {
    font-family: system-ui, sans-serif;
  }
</style>
