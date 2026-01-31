<script lang="ts">
  import Sparkline from '../gauges/Sparkline.svelte';
  import type { VitalHistory } from '$lib/engine/types';

  export let label: string;
  export let value: number;
  export let unit: string = '';
  export let history: VitalHistory[] = [];
  export let accessor: (v: VitalHistory) => number;
  export let warningLow: number | null = null;
  export let warningHigh: number | null = null;
  export let criticalLow: number | null = null;
  export let criticalHigh: number | null = null;
  export let decimals: number = 0;
  export let showSparkline: boolean = true;

  $: status = getStatus(value);

  function getStatus(val: number): 'normal' | 'warning' | 'critical' {
    if (criticalLow !== null && val < criticalLow) return 'critical';
    if (criticalHigh !== null && val > criticalHigh) return 'critical';
    if (warningLow !== null && val < warningLow) return 'warning';
    if (warningHigh !== null && val > warningHigh) return 'warning';
    return 'normal';
  }

  $: statusColor = status === 'critical' ? '#ef4444' : status === 'warning' ? '#fbbf24' : '#4ade80';
</script>

<div class="vital-tile" class:warning={status === 'warning'} class:critical={status === 'critical'}>
  <div class="tile-header">
    <span class="label">{label}</span>
    <span class="unit">{unit}</span>
  </div>

  <div class="tile-content">
    <span class="value" style="color: {statusColor}">
      {value.toFixed(decimals)}
    </span>

    {#if showSparkline && history.length > 1}
      <div class="sparkline-wrapper">
        <Sparkline
          data={history}
          {accessor}
          width={100}
          height={30}
          color={statusColor}
          {warningLow}
          {warningHigh}
        />
      </div>
    {/if}
  </div>

  {#if status !== 'normal'}
    <div class="status-indicator" class:warning={status === 'warning'} class:critical={status === 'critical'}>
      {status === 'critical' ? '!!!' : '!'}
    </div>
  {/if}
</div>

<style>
  .vital-tile {
    background: #16162a;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 12px;
    position: relative;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    min-width: 140px;
  }

  .vital-tile.warning {
    border-color: rgba(251, 191, 36, 0.5);
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.2);
  }

  .vital-tile.critical {
    border-color: rgba(239, 68, 68, 0.7);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    animation: criticalPulse 1s ease-in-out infinite;
  }

  @keyframes criticalPulse {
    0%, 100% {
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    }
    50% {
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.5);
    }
  }

  .tile-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }

  .label {
    color: #888;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .unit {
    color: #555;
    font-size: 10px;
  }

  .tile-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .value {
    font-size: 28px;
    font-weight: 700;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    line-height: 1;
  }

  .sparkline-wrapper {
    margin-top: 4px;
  }

  .status-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    color: #000;
  }

  .status-indicator.warning {
    background: #fbbf24;
  }

  .status-indicator.critical {
    background: #ef4444;
    animation: blink 0.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
