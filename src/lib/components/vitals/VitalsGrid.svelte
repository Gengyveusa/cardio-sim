<script lang="ts">
  import VitalsTile from './VitalsTile.svelte';
  import { vitals, history, currentScenario } from '$lib/stores/simulation';

  $: v = $vitals;
  $: h = $history;
  $: phenotype = $currentScenario?.phenotype ?? 'DCM';
</script>

<div class="vitals-grid">
  <!-- Cardiac Vitals Row -->
  <div class="vitals-section">
    <h3 class="section-title">Cardiovascular</h3>
    <div class="tiles-row">
      {#if v}
        <VitalsTile
          label="HR"
          value={v.hr}
          unit="bpm"
          history={h}
          accessor={(d) => d.vitals.hr}
          warningLow={55}
          warningHigh={110}
          criticalLow={40}
          criticalHigh={150}
        />

        <VitalsTile
          label="BP"
          value={v.sbp}
          unit="/{v.dbp.toFixed(0)}"
          history={h}
          accessor={(d) => d.vitals.sbp}
          warningLow={95}
          warningHigh={160}
          criticalLow={80}
          criticalHigh={180}
        />

        <VitalsTile
          label="MAP"
          value={v.map}
          unit="mmHg"
          history={h}
          accessor={(d) => d.vitals.map}
          warningLow={65}
          warningHigh={110}
          criticalLow={55}
          criticalHigh={130}
        />

        <VitalsTile
          label="CO"
          value={v.co}
          unit="L/min"
          history={h}
          accessor={(d) => d.vitals.co}
          warningLow={3.5}
          criticalLow={2.5}
          decimals={1}
        />

        <VitalsTile
          label="SVR"
          value={v.svr}
          unit="dyn·s/cm⁵"
          history={h}
          accessor={(d) => d.vitals.svr}
          warningLow={800}
          warningHigh={1600}
          showSparkline={false}
        />
      {/if}
    </div>
  </div>

  <!-- Respiratory Row -->
  <div class="vitals-section">
    <h3 class="section-title">Respiratory</h3>
    <div class="tiles-row">
      {#if v}
        <VitalsTile
          label="SpO₂"
          value={v.spo2}
          unit="%"
          history={h}
          accessor={(d) => d.vitals.spo2}
          warningLow={94}
          criticalLow={88}
        />

        <VitalsTile
          label="RR"
          value={v.rr}
          unit="/min"
          history={h}
          accessor={(d) => d.vitals.rr}
          warningLow={8}
          warningHigh={25}
          criticalLow={6}
          criticalHigh={35}
        />

        <VitalsTile
          label="PaCO₂"
          value={v.paco2}
          unit="mmHg"
          history={h}
          accessor={(d) => d.vitals.paco2}
          warningLow={32}
          warningHigh={50}
          criticalLow={25}
          criticalHigh={65}
        />

        <VitalsTile
          label="pH"
          value={v.ph}
          unit=""
          history={h}
          accessor={(d) => d.vitals.ph}
          warningLow={7.32}
          warningHigh={7.48}
          criticalLow={7.20}
          criticalHigh={7.55}
          decimals={2}
        />
      {/if}
    </div>
  </div>

  <!-- Cardiac-Specific Row -->
  <div class="vitals-section">
    <h3 class="section-title">Cardiac Status</h3>
    <div class="tiles-row">
      {#if v}
        <VitalsTile
          label="LVEDP"
          value={v.lvedp}
          unit="mmHg"
          history={h}
          accessor={(d) => d.vitals.lvedp}
          warningHigh={20}
          criticalHigh={28}
        />

        {#if phenotype === 'HCM'}
          <VitalsTile
            label="LVOT Δ"
            value={v.lvotGradient}
            unit="mmHg"
            history={h}
            accessor={(d) => d.vitals.lvotGradient}
            warningHigh={50}
            criticalHigh={80}
          />
        {/if}

        <VitalsTile
          label="Coronary"
          value={v.coronaryPerfusion * 100}
          unit="%"
          history={h}
          accessor={(d) => d.vitals.coronaryPerfusion * 100}
          warningLow={60}
          criticalLow={45}
        />

        <VitalsTile
          label="Ischemia"
          value={v.ischemiaIndex * 100}
          unit="%"
          history={h}
          accessor={(d) => d.vitals.ischemiaIndex * 100}
          warningHigh={25}
          criticalHigh={50}
        />

        <VitalsTile
          label="Catechol"
          value={v.catecholamines * 100}
          unit="%"
          history={h}
          accessor={(d) => d.vitals.catecholamines * 100}
          warningHigh={60}
          criticalHigh={80}
        />
      {/if}
    </div>
  </div>

  <!-- Risk Indicators Row -->
  <div class="vitals-section">
    <h3 class="section-title">Risk Indicators</h3>
    <div class="tiles-row">
      {#if v}
        <VitalsTile
          label="Edema"
          value={v.pulmonaryEdema * 100}
          unit="%"
          history={h}
          accessor={(d) => d.vitals.pulmonaryEdema * 100}
          warningHigh={30}
          criticalHigh={60}
        />

        <VitalsTile
          label="Arrhythmia Risk"
          value={v.arrhythmiaRisk * 100}
          unit="%"
          history={h}
          accessor={(d) => d.vitals.arrhythmiaRisk * 100}
          warningHigh={40}
          criticalHigh={70}
        />

        <div class="rhythm-display">
          <span class="rhythm-label">Rhythm</span>
          <span class="rhythm-value" class:abnormal={v.rhythmState !== 'sinus'}>
            {formatRhythm(v.rhythmState)}
          </span>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module" lang="ts">
  function formatRhythm(rhythm: string): string {
    const map: Record<string, string> = {
      'sinus': 'Sinus Rhythm',
      'sinus_tachycardia': 'Sinus Tachycardia',
      'sinus_bradycardia': 'Sinus Bradycardia',
      'atrial_fibrillation': 'Atrial Fibrillation',
      'ventricular_tachycardia': 'V-Tach',
      'ventricular_fibrillation': 'V-Fib',
      'pea': 'PEA',
      'asystole': 'Asystole'
    };
    return map[rhythm] || rhythm;
  }
</script>

<style>
  .vitals-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: #0d0d1a;
    border-radius: 12px;
  }

  .vitals-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-title {
    color: #666;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
    padding-left: 4px;
  }

  .tiles-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .rhythm-display {
    background: #16162a;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 12px;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rhythm-label {
    color: #888;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rhythm-value {
    color: #4ade80;
    font-size: 16px;
    font-weight: 600;
  }

  .rhythm-value.abnormal {
    color: #fbbf24;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @media (max-width: 768px) {
    .tiles-row {
      justify-content: center;
    }
  }
</style>
