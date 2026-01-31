<script lang="ts">
  import { activeInterventions, timeMinutes, currentPhase } from '$lib/stores/simulation';
  import { logUserAction } from '$lib/stores/simulation';
  import type { InterventionRule } from '$lib/engine/types';

  let expandedId: string | null = null;

  function toggleExpand(id: string) {
    if (expandedId === id) {
      expandedId = null;
      logUserAction('intervention_collapsed', { interventionId: id });
    } else {
      expandedId = id;
      logUserAction('intervention_opened', { interventionId: id });
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#888';
    }
  }

  function getSeverityBg(severity: string): string {
    switch (severity) {
      case 'green': return 'rgba(34, 197, 94, 0.1)';
      case 'yellow': return 'rgba(234, 179, 8, 0.1)';
      case 'red': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(136, 136, 136, 0.1)';
    }
  }

  function getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'green': return 'PREVENTIVE';
      case 'yellow': return 'WARNING';
      case 'red': return 'EMERGENCY';
      default: return 'INFO';
    }
  }

  // Sort interventions by severity (red first, then yellow, then green)
  $: sortedInterventions = [...$activeInterventions].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  $: hasRedAlert = sortedInterventions.some(i => i.severity === 'red');
</script>

<div class="interventions-container" class:has-alert={hasRedAlert}>
  <div class="interventions-header">
    <h3 class="title">Interventions</h3>
    <span class="count">{$activeInterventions.length} active</span>
  </div>

  {#if sortedInterventions.length === 0}
    <div class="no-interventions">
      <span class="check-icon">✓</span>
      <p>No active intervention recommendations at this time.</p>
    </div>
  {:else}
    <div class="interventions-list">
      {#each sortedInterventions as intervention (intervention.id)}
        <div
          class="intervention-card"
          class:expanded={expandedId === intervention.id}
          style="--severity-color: {getSeverityColor(intervention.severity)}; --severity-bg: {getSeverityBg(intervention.severity)};"
        >
          <button
            class="intervention-header"
            on:click={() => toggleExpand(intervention.id)}
          >
            <div class="severity-badge" data-severity={intervention.severity}>
              {getSeverityLabel(intervention.severity)}
            </div>
            <div class="intervention-info">
              <span class="intervention-name">{intervention.name}</span>
              <span class="intervention-brief">{intervention.message}</span>
            </div>
            <span class="expand-icon">
              {expandedId === intervention.id ? '−' : '+'}
            </span>
          </button>

          {#if expandedId === intervention.id}
            <div class="intervention-details">
              <p class="description">{intervention.description}</p>

              <div class="actions-section">
                <h4>Recommended Actions:</h4>
                <ul class="actions-list">
                  {#each intervention.actions as action}
                    <li>{action}</li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .interventions-container {
    background: #0d0d1a;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #2a2a4a;
    transition: border-color 0.3s ease;
  }

  .interventions-container.has-alert {
    border-color: rgba(239, 68, 68, 0.5);
    animation: alertPulse 2s ease-in-out infinite;
  }

  @keyframes alertPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
    50% {
      box-shadow: 0 0 20px 5px rgba(239, 68, 68, 0.2);
    }
  }

  .interventions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #ccc;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .count {
    font-size: 12px;
    color: #666;
  }

  .no-interventions {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    color: #4ade80;
    text-align: center;
  }

  .check-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .no-interventions p {
    margin: 0;
    color: #666;
    font-size: 13px;
  }

  .interventions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .intervention-card {
    background: var(--severity-bg);
    border: 1px solid var(--severity-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .intervention-card.expanded {
    border-width: 2px;
  }

  .intervention-header {
    width: 100%;
    padding: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
  }

  .severity-badge {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    white-space: nowrap;
    color: #000;
  }

  .severity-badge[data-severity="green"] {
    background: #22c55e;
  }

  .severity-badge[data-severity="yellow"] {
    background: #eab308;
  }

  .severity-badge[data-severity="red"] {
    background: #ef4444;
    animation: urgentPulse 1s ease-in-out infinite;
  }

  @keyframes urgentPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .intervention-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .intervention-name {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  .intervention-brief {
    font-size: 12px;
    color: #aaa;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .expand-icon {
    font-size: 20px;
    color: #666;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .intervention-details {
    padding: 0 12px 12px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 4px;
  }

  .description {
    margin: 12px 0;
    font-size: 13px;
    color: #bbb;
    line-height: 1.5;
  }

  .actions-section h4 {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .actions-list {
    margin: 0;
    padding: 0 0 0 20px;
  }

  .actions-list li {
    font-size: 13px;
    color: var(--severity-color);
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .actions-list li:last-child {
    margin-bottom: 0;
  }
</style>
