<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Components
  import Heart from '$lib/components/anatomy/Heart.svelte';
  import Lungs from '$lib/components/anatomy/Lungs.svelte';
  import Vessels from '$lib/components/anatomy/Vessels.svelte';
  import VitalsGrid from '$lib/components/vitals/VitalsGrid.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import InterventionOverlay from '$lib/components/interventions/InterventionOverlay.svelte';
  import ExplainPanel from '$lib/components/ui/ExplainPanel.svelte';
  import ScenarioSelector from '$lib/components/ui/ScenarioSelector.svelte';
  import ScenarioEditor from '$lib/components/ui/ScenarioEditor.svelte';
  import Disclaimer from '$lib/components/ui/Disclaimer.svelte';

  // Stores
  import {
    initializeEngine,
    destroyEngine,
    simulationState,
    currentScenario
  } from '$lib/stores/simulation';

  let disclaimerAccepted = false;
  let initialized = false;

  onMount(() => {
    if (browser) {
      // Check for URL parameters (shareable link)
      const params = new URLSearchParams(window.location.search);
      const scenarioId = params.get('scenario');
      const seed = params.get('seed');

      // Initialize with URL params if present
      initializeEngine(undefined, seed ? parseInt(seed) : undefined);
      initialized = true;
    }
  });

  onDestroy(() => {
    if (browser) {
      destroyEngine();
    }
  });

  function handleDisclaimerAccept() {
    disclaimerAccepted = true;
  }

  $: phenotype = $currentScenario?.phenotype ?? 'DCM';
</script>

<Disclaimer onAccept={handleDisclaimerAccept} />

{#if disclaimerAccepted && initialized}
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">
          <span class="heart-icon">❤️</span>
          Cardiac Cascade Simulator
        </h1>
        <span class="version-badge">Educational v1.0</span>
      </div>
      <div class="header-right">
        <span class="phenotype-indicator" class:dcm={phenotype === 'DCM'} class:hcm={phenotype === 'HCM'}>
          {phenotype === 'DCM' ? 'Dilated Cardiomyopathy' : 'Hypertrophic Cardiomyopathy'}
        </span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Left Sidebar: Scenario & Anatomy -->
      <aside class="sidebar-left">
        <ScenarioSelector />

        <div class="anatomy-panel">
          <h3 class="panel-title">Anatomy Visualization</h3>
          <div class="anatomy-grid">
            <div class="anatomy-item">
              <Heart />
            </div>
            <div class="anatomy-item">
              <Lungs />
            </div>
            <div class="anatomy-item anatomy-full">
              <Vessels />
            </div>
          </div>
        </div>
      </aside>

      <!-- Center: Vitals & Timeline -->
      <section class="main-center">
        <div class="vitals-container">
          <VitalsGrid />
        </div>

        <div class="timeline-container">
          <Timeline />
        </div>
      </section>

      <!-- Right Sidebar: Interventions & Explanation -->
      <aside class="sidebar-right">
        <InterventionOverlay />
        <ExplainPanel />
      </aside>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p class="disclaimer-text">
        ⚠️ Educational simulation only. Not for clinical decision support. No patient-specific recommendations.
      </p>
    </footer>

    <!-- Scenario Editor Modal -->
    <ScenarioEditor />
  </div>
{:else if !disclaimerAccepted}
  <!-- Disclaimer is showing -->
{:else}
  <div class="loading-screen">
    <div class="loading-spinner"></div>
    <p>Initializing simulation engine...</p>
  </div>
{/if}

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0a0a14;
  }

  /* Header */
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: #0d0d1a;
    border-bottom: 1px solid #2a2a4a;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .app-title {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
  }

  .heart-icon {
    font-size: 24px;
    animation: heartbeat 1s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .version-badge {
    padding: 4px 10px;
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 12px;
    font-size: 11px;
    color: #4ade80;
    font-weight: 500;
  }

  .phenotype-indicator {
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 600;
  }

  .phenotype-indicator.dcm {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .phenotype-indicator.hcm {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.3);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 320px 1fr 380px;
    gap: 16px;
    padding: 16px;
    overflow: hidden;
  }

  /* Sidebars */
  .sidebar-left, .sidebar-right {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    max-height: calc(100vh - 140px);
  }

  .anatomy-panel {
    background: #0d0d1a;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #2a2a4a;
  }

  .panel-title {
    margin: 0 0 12px 0;
    font-size: 12px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .anatomy-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .anatomy-item {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /* Center Section */
  .main-center {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    max-height: calc(100vh - 140px);
  }

  .vitals-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .timeline-container {
    flex-shrink: 0;
  }

  /* Footer */
  .app-footer {
    padding: 8px 24px;
    background: #0d0d1a;
    border-top: 1px solid #2a2a4a;
    text-align: center;
  }

  .disclaimer-text {
    margin: 0;
    font-size: 11px;
    color: #666;
  }

  /* Loading Screen */
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid #2a2a4a;
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-screen p {
    color: #888;
    font-size: 14px;
  }

  /* Responsive Layout */
  @media (max-width: 1280px) {
    .main-content {
      grid-template-columns: 280px 1fr 340px;
    }
  }

  @media (max-width: 1024px) {
    .main-content {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto;
    }

    .sidebar-left, .sidebar-right {
      flex-direction: row;
      flex-wrap: wrap;
      max-height: none;
      overflow: visible;
    }

    .sidebar-left > :global(*),
    .sidebar-right > :global(*) {
      flex: 1;
      min-width: 280px;
    }

    .anatomy-panel {
      flex: 2;
    }

    .main-center {
      max-height: none;
      overflow: visible;
    }
  }

  @media (max-width: 640px) {
    .app-header {
      flex-direction: column;
      gap: 12px;
      padding: 12px 16px;
    }

    .header-left {
      flex-direction: column;
      text-align: center;
    }

    .main-content {
      padding: 12px;
    }

    .sidebar-left > :global(*),
    .sidebar-right > :global(*) {
      min-width: 100%;
    }
  }
</style>
