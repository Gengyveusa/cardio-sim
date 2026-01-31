<script lang="ts">
  import { onMount } from 'svelte';

  export let onAccept: () => void;

  let accepted = false;

  onMount(() => {
    // Check if already accepted in this session
    const previouslyAccepted = sessionStorage.getItem('cardio-sim-disclaimer-accepted');
    if (previouslyAccepted === 'true') {
      accepted = true;
      onAccept();
    }
  });

  function handleAccept() {
    sessionStorage.setItem('cardio-sim-disclaimer-accepted', 'true');
    accepted = true;
    onAccept();
  }
</script>

{#if !accepted}
  <div class="disclaimer-overlay">
    <div class="disclaimer-modal">
      <div class="disclaimer-header">
        <div class="warning-icon">⚠️</div>
        <h1>Educational Disclaimer</h1>
      </div>

      <div class="disclaimer-content">
        <div class="disclaimer-section important">
          <h2>This is NOT Clinical Decision Support</h2>
          <p>
            The Interactive Cardiac Cascade Simulator is an <strong>educational tool only</strong>.
            It is designed to illustrate physiological concepts and the contrasting hemodynamics
            of different cardiac pathologies.
          </p>
        </div>

        <div class="disclaimer-section">
          <h2>What This Simulator Does</h2>
          <ul>
            <li>Demonstrates the pathophysiology of DCM and HCM</li>
            <li>Illustrates how the same intervention can have opposite effects in different conditions</li>
            <li>Provides a framework for understanding complex cardiac cascades</li>
            <li>Supports educational discussions and training scenarios</li>
          </ul>
        </div>

        <div class="disclaimer-section">
          <h2>What This Simulator Does NOT Do</h2>
          <ul>
            <li>Provide patient-specific dosing or treatment recommendations</li>
            <li>Replace clinical judgment or medical training</li>
            <li>Account for individual patient variation</li>
            <li>Serve as a basis for real clinical decisions</li>
          </ul>
        </div>

        <div class="disclaimer-section warning">
          <h2>Important Notice</h2>
          <p>
            The hemodynamic models presented are <strong>simplified representations</strong> of complex
            physiological systems. Real patients present with unique combinations of factors that
            cannot be fully captured in any simulation.
          </p>
          <p>
            Always consult current clinical guidelines, institutional protocols, and experienced
            clinicians when managing actual patients with cardiac disease.
          </p>
        </div>
      </div>

      <div class="disclaimer-footer">
        <label class="acknowledgment">
          <input type="checkbox" bind:checked={accepted} />
          <span>I understand this is for educational purposes only and not for clinical use</span>
        </label>
        <button
          class="accept-btn"
          disabled={!accepted}
          on:click={handleAccept}
        >
          Enter Simulator
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .disclaimer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    overflow-y: auto;
  }

  .disclaimer-modal {
    background: #12122a;
    border-radius: 16px;
    width: 100%;
    max-width: 700px;
    border: 2px solid #fbbf24;
    box-shadow: 0 0 60px rgba(251, 191, 36, 0.2);
  }

  .disclaimer-header {
    padding: 24px;
    text-align: center;
    border-bottom: 1px solid #2a2a4a;
  }

  .warning-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .disclaimer-header h1 {
    margin: 0;
    font-size: 24px;
    color: #fbbf24;
  }

  .disclaimer-content {
    padding: 24px;
    max-height: 50vh;
    overflow-y: auto;
  }

  .disclaimer-section {
    margin-bottom: 24px;
  }

  .disclaimer-section:last-child {
    margin-bottom: 0;
  }

  .disclaimer-section h2 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #fff;
  }

  .disclaimer-section p {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #aaa;
    line-height: 1.6;
  }

  .disclaimer-section p:last-child {
    margin-bottom: 0;
  }

  .disclaimer-section ul {
    margin: 0;
    padding-left: 20px;
  }

  .disclaimer-section li {
    font-size: 14px;
    color: #aaa;
    line-height: 1.8;
  }

  .disclaimer-section.important {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    padding: 16px;
  }

  .disclaimer-section.important h2 {
    color: #ef4444;
  }

  .disclaimer-section.warning {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 12px;
    padding: 16px;
  }

  .disclaimer-section.warning h2 {
    color: #fbbf24;
  }

  .disclaimer-footer {
    padding: 24px;
    border-top: 1px solid #2a2a4a;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .acknowledgment {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
  }

  .acknowledgment input {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    cursor: pointer;
  }

  .acknowledgment span {
    font-size: 14px;
    color: #ccc;
    line-height: 1.5;
  }

  .accept-btn {
    padding: 14px 32px;
    border-radius: 8px;
    border: none;
    background: #4ade80;
    color: #000;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .accept-btn:disabled {
    background: #3a3a5a;
    color: #666;
    cursor: not-allowed;
  }

  .accept-btn:not(:disabled):hover {
    background: #22c55e;
    transform: translateY(-1px);
  }
</style>
