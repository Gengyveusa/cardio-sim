<script lang="ts">
  import { showScenarioEditor, currentScenario, loadScenario, exportRun, getShareableLink } from '$lib/stores/simulation';
  import type { ScenarioDefinition, PhaseDefinition, Keyframe, InterventionRule } from '$lib/engine/types';

  let editedScenario: ScenarioDefinition | null = null;
  let activeTab: 'general' | 'phases' | 'keyframes' | 'rules' | 'export' = 'general';
  let jsonError: string | null = null;
  let jsonInput = '';
  let shareableLink = '';
  let exportedJson = '';

  $: if ($showScenarioEditor && $currentScenario) {
    editedScenario = JSON.parse(JSON.stringify($currentScenario));
    jsonInput = JSON.stringify(editedScenario, null, 2);
  }

  function closeEditor() {
    showScenarioEditor.set(false);
    editedScenario = null;
    jsonError = null;
  }

  function applyChanges() {
    if (!editedScenario) return;
    loadScenario(editedScenario);
    closeEditor();
  }

  function handleJsonChange() {
    try {
      editedScenario = JSON.parse(jsonInput);
      jsonError = null;
    } catch (e) {
      jsonError = (e as Error).message;
    }
  }

  function generateExport() {
    exportedJson = exportRun();
  }

  function generateShareLink() {
    shareableLink = getShareableLink();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function downloadJson(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if $showScenarioEditor}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
  <div class="editor-overlay" on:click={closeEditor} on:keydown={(e) => e.key === 'Escape' && closeEditor()} role="dialog" aria-modal="true" tabindex="-1">
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div class="editor-modal" on:click|stopPropagation role="document">
      <div class="editor-header">
        <h2>Scenario Editor</h2>
        <button class="close-btn" on:click={closeEditor}>×</button>
      </div>

      <div class="editor-tabs">
        <button class:active={activeTab === 'general'} on:click={() => activeTab = 'general'}>
          General
        </button>
        <button class:active={activeTab === 'phases'} on:click={() => activeTab = 'phases'}>
          Phases
        </button>
        <button class:active={activeTab === 'keyframes'} on:click={() => activeTab = 'keyframes'}>
          Keyframes
        </button>
        <button class:active={activeTab === 'rules'} on:click={() => activeTab = 'rules'}>
          Rules
        </button>
        <button class:active={activeTab === 'export'} on:click={() => activeTab = 'export'}>
          Export/Import
        </button>
      </div>

      <div class="editor-content">
        {#if activeTab === 'general' && editedScenario}
          <div class="form-section">
            <label>
              <span>Scenario Name</span>
              <input type="text" bind:value={editedScenario.name} />
            </label>

            <label>
              <span>ID</span>
              <input type="text" bind:value={editedScenario.id} />
            </label>

            <label>
              <span>Phenotype</span>
              <select bind:value={editedScenario.phenotype}>
                <option value="DCM">DCM - Dilated Cardiomyopathy</option>
                <option value="HCM">HCM - Hypertrophic Cardiomyopathy</option>
              </select>
            </label>

            <label>
              <span>Description</span>
              <textarea bind:value={editedScenario.description} rows="4"></textarea>
            </label>

            <label>
              <span>Duration (minutes)</span>
              <input type="number" bind:value={editedScenario.duration} min="1" max="120" />
            </label>
          </div>
        {/if}

        {#if activeTab === 'phases' && editedScenario}
          <div class="phases-list">
            {#each editedScenario.phases as phase, i}
              <div class="phase-item">
                <div class="phase-header">
                  <span class="phase-number">{i + 1}</span>
                  <input type="text" bind:value={phase.name} placeholder="Phase name" />
                </div>
                <div class="phase-times">
                  <label>
                    <span>Start</span>
                    <input type="number" bind:value={phase.startTime} step="0.5" />
                  </label>
                  <label>
                    <span>End</span>
                    <input type="number" bind:value={phase.endTime} step="0.5" />
                  </label>
                </div>
                <label class="full-width">
                  <span>Description</span>
                  <textarea bind:value={phase.description} rows="2"></textarea>
                </label>
              </div>
            {/each}
          </div>
        {/if}

        {#if activeTab === 'keyframes' && editedScenario}
          <div class="keyframes-list">
            <p class="help-text">Keyframes define driver values at specific times. Values are interpolated between keyframes.</p>
            {#each editedScenario.keyframes as keyframe, i}
              <div class="keyframe-item">
                <div class="keyframe-time">
                  <label>
                    <span>Time (T+minutes)</span>
                    <input type="number" bind:value={keyframe.time} step="0.5" />
                  </label>
                </div>
                <div class="keyframe-drivers">
                  {#each Object.entries(keyframe.drivers) as [key, value]}
                    <label class="driver-input">
                      <span>{key}</span>
                      <input type="number" value={value} step="0.05" min="0" max="1"
                        on:input={(e) => keyframe.drivers[key as keyof typeof keyframe.drivers] = parseFloat((e.target as HTMLInputElement).value)} />
                    </label>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if activeTab === 'rules' && editedScenario}
          <div class="rules-list">
            <p class="help-text">Intervention rules trigger overlays based on conditions. Edit the JSON directly for complex rules.</p>
            {#each editedScenario.interventionRules as rule}
              <div class="rule-item" data-severity={rule.severity}>
                <div class="rule-header">
                  <span class="severity-badge">{rule.severity.toUpperCase()}</span>
                  <input type="text" bind:value={rule.name} />
                </div>
                <label class="full-width">
                  <span>Message</span>
                  <textarea bind:value={rule.message} rows="2"></textarea>
                </label>
              </div>
            {/each}
          </div>
        {/if}

        {#if activeTab === 'export'}
          <div class="export-section">
            <div class="export-group">
              <h3>Share Link</h3>
              <p class="help-text">Generate a shareable link that includes the scenario and current seed.</p>
              <div class="export-controls">
                <button on:click={generateShareLink}>Generate Link</button>
                {#if shareableLink}
                  <input type="text" value={shareableLink} readonly />
                  <button on:click={() => copyToClipboard(shareableLink)}>Copy</button>
                {/if}
              </div>
            </div>

            <div class="export-group">
              <h3>Export Run</h3>
              <p class="help-text">Export the current run including all events and vital history as JSON.</p>
              <div class="export-controls">
                <button on:click={generateExport}>Generate Export</button>
                {#if exportedJson}
                  <button on:click={() => downloadJson(exportedJson, 'cardio-sim-run.json')}>Download</button>
                {/if}
              </div>
            </div>

            <div class="export-group">
              <h3>Edit Raw JSON</h3>
              <p class="help-text">Advanced: Edit the scenario definition directly as JSON.</p>
              <textarea
                class="json-editor"
                bind:value={jsonInput}
                on:input={handleJsonChange}
                spellcheck="false"
              ></textarea>
              {#if jsonError}
                <div class="json-error">{jsonError}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <div class="editor-footer">
        <button class="cancel-btn" on:click={closeEditor}>Cancel</button>
        <button class="apply-btn" on:click={applyChanges} disabled={!!jsonError}>
          Apply Changes
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .editor-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .editor-modal {
    background: #12122a;
    border-radius: 16px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    border: 1px solid #3a3a5a;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #2a2a4a;
  }

  .editor-header h2 {
    margin: 0;
    font-size: 20px;
    color: #fff;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #2a2a4a;
    color: #888;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: #3a3a5a;
    color: #fff;
  }

  .editor-tabs {
    display: flex;
    border-bottom: 1px solid #2a2a4a;
    padding: 0 24px;
  }

  .editor-tabs button {
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s ease;
  }

  .editor-tabs button:hover {
    color: #aaa;
  }

  .editor-tabs button.active {
    color: #4ade80;
    border-bottom-color: #4ade80;
  }

  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label span {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input, select, textarea {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #3a3a5a;
    background: #1a1a2e;
    color: #fff;
    font-size: 14px;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #4a66a0;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  .phases-list, .keyframes-list, .rules-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .help-text {
    color: #666;
    font-size: 13px;
    margin-bottom: 8px;
  }

  .phase-item, .keyframe-item, .rule-item {
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .phase-header, .rule-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .phase-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #4a66a0;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .phase-times {
    display: flex;
    gap: 16px;
  }

  .phase-times label {
    flex: 1;
  }

  .full-width {
    width: 100%;
  }

  .keyframe-time {
    margin-bottom: 8px;
  }

  .keyframe-drivers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .driver-input {
    background: #12122a;
    padding: 8px;
    border-radius: 6px;
  }

  .driver-input input {
    width: 100%;
    margin-top: 4px;
    padding: 6px 8px;
    font-size: 12px;
  }

  .severity-badge {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
  }

  .rule-item[data-severity="green"] .severity-badge {
    background: #22c55e;
    color: #000;
  }

  .rule-item[data-severity="yellow"] .severity-badge {
    background: #eab308;
    color: #000;
  }

  .rule-item[data-severity="red"] .severity-badge {
    background: #ef4444;
    color: #fff;
  }

  .export-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .export-group h3 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #ccc;
  }

  .export-controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .export-controls input {
    flex: 1;
    min-width: 200px;
  }

  .export-controls button {
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    background: #4a66a0;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
  }

  .export-controls button:hover {
    background: #5a76b0;
  }

  .json-editor {
    width: 100%;
    min-height: 300px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.5;
  }

  .json-error {
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 6px;
    color: #ef4444;
    font-size: 12px;
  }

  .editor-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #2a2a4a;
  }

  .cancel-btn, .apply-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    border: none;
  }

  .cancel-btn {
    background: #2a2a4a;
    color: #888;
  }

  .cancel-btn:hover {
    background: #3a3a5a;
    color: #fff;
  }

  .apply-btn {
    background: #4ade80;
    color: #000;
    font-weight: 600;
  }

  .apply-btn:hover:not(:disabled) {
    background: #22c55e;
  }

  .apply-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
