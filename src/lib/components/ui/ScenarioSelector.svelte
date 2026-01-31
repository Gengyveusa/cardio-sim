<script lang="ts">
  import { currentScenario, loadScenario, showScenarioEditor } from '$lib/stores/simulation';
  import { scenarios } from '$lib/scenarios';
  import type { ScenarioDefinition } from '$lib/engine/types';

  let selectedScenarioId = $currentScenario?.id ?? 'dcm-cascade';

  function handleScenarioChange() {
    const scenario = scenarios.find(s => s.id === selectedScenarioId);
    if (scenario) {
      loadScenario(scenario);
    }
  }

  function openEditor() {
    showScenarioEditor.set(true);
  }

  $: currentDesc = $currentScenario?.description ?? '';
</script>

<div class="scenario-selector">
  <div class="selector-header">
    <h3 class="title">Scenario</h3>
    <button class="editor-btn" on:click={openEditor} title="Open Scenario Editor">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </button>
  </div>

  <div class="scenario-dropdown">
    <select bind:value={selectedScenarioId} on:change={handleScenarioChange}>
      {#each scenarios as scenario}
        <option value={scenario.id}>
          [{scenario.phenotype}] {scenario.name}
        </option>
      {/each}
    </select>
  </div>

  <p class="scenario-description">{currentDesc}</p>

  <div class="scenario-stats">
    <div class="stat">
      <span class="stat-label">Phenotype</span>
      <span class="stat-value" class:dcm={$currentScenario?.phenotype === 'DCM'} class:hcm={$currentScenario?.phenotype === 'HCM'}>
        {$currentScenario?.phenotype}
      </span>
    </div>
    <div class="stat">
      <span class="stat-label">Phases</span>
      <span class="stat-value">{$currentScenario?.phases.length ?? 0}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Duration</span>
      <span class="stat-value">{$currentScenario?.duration ?? 0} min</span>
    </div>
  </div>
</div>

<style>
  .scenario-selector {
    background: #0d0d1a;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #2a2a4a;
  }

  .selector-header {
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

  .editor-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #3a3a5a;
    background: #2a2a4a;
    color: #888;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .editor-btn:hover {
    background: #3a3a5a;
    color: #fff;
    border-color: #4a4a6a;
  }

  .scenario-dropdown {
    margin-bottom: 12px;
  }

  select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #3a3a5a;
    background: #16162a;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  select:focus {
    outline: none;
    border-color: #4a66a0;
  }

  select option {
    background: #16162a;
    color: #fff;
  }

  .scenario-description {
    margin: 0 0 16px 0;
    font-size: 13px;
    color: #888;
    line-height: 1.5;
  }

  .scenario-stats {
    display: flex;
    gap: 16px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 10px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 600;
    color: #ccc;
  }

  .stat-value.dcm {
    color: #ef4444;
  }

  .stat-value.hcm {
    color: #a855f7;
  }
</style>
