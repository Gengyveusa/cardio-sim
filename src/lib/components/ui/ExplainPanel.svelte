<script lang="ts">
  import { currentPhase, currentScenario, vitals, timeMinutes } from '$lib/stores/simulation';

  $: phenotype = $currentScenario?.phenotype ?? 'DCM';
  $: phase = $currentPhase;
  $: v = $vitals;

  // Dynamic explanations based on current state
  $: explanation = getExplanation(phenotype, phase?.id ?? '', $timeMinutes, v);

  interface ExplanationContent {
    title: string;
    mechanism: string;
    divergence: string;
    teaching: string;
  }

  function getExplanation(
    phenotype: string,
    phaseId: string,
    time: number,
    vitals: typeof v
  ): ExplanationContent {
    if (!vitals) {
      return {
        title: 'Loading...',
        mechanism: '',
        divergence: '',
        teaching: ''
      };
    }

    // DCM-specific explanations
    if (phenotype === 'DCM') {
      if (phaseId === 'baseline' || phaseId === 'induction') {
        return {
          title: 'DCM: Baseline Physiology',
          mechanism: 'Dilated cardiomyopathy features a weakened, dilated left ventricle with reduced ejection fraction. The Frank-Starling mechanism is already maximized, leaving little cardiac reserve.',
          divergence: 'Unlike HCM, DCM patients are AFTERLOAD SENSITIVE. Increased SVR dramatically reduces cardiac output because the weak ventricle cannot overcome resistance.',
          teaching: 'Key concept: Sedation causes vasodilation → ↓afterload → initially ↑CO. But respiratory depression → hypercapnia → catecholamine surge → ↑afterload → CO crashes.'
        };
      }

      if (vitals.paco2 > 50 || vitals.catecholamines > 0.5) {
        return {
          title: 'DCM: Catecholamine Surge',
          mechanism: `Current PaCO₂: ${vitals.paco2.toFixed(0)} mmHg. Hypercapnia and acidosis trigger massive endogenous catecholamine release. This is the body's attempt to compensate, but in DCM it becomes the problem.`,
          divergence: 'CRITICAL DIVERGENCE: In a normal heart, catecholamines improve contractility and CO. In DCM, they primarily increase SVR (afterload), which the weak ventricle CANNOT overcome.',
          teaching: 'The catecholamine surge is both a marker of severity AND a driver of further decompensation. Breaking this cycle (improve ventilation, reduce catecholamines) is essential.'
        };
      }

      if (vitals.lvedp > 20 || vitals.pulmonaryEdema > 0.3) {
        return {
          title: 'DCM: Pulmonary Edema',
          mechanism: `LVEDP: ${vitals.lvedp.toFixed(0)} mmHg. The failing LV cannot empty effectively, causing backup pressure into the pulmonary circulation. Fluid transudates into alveoli.`,
          divergence: 'Flash pulmonary edema in DCM develops rapidly once LVEDP exceeds ~20 mmHg. Unlike HCM, the problem is FORWARD failure, not obstruction.',
          teaching: 'Treatment priorities: 1) Reduce preload (diuretics, nitrates) 2) Support ventilation (CPAP/BiPAP) 3) Carefully reduce afterload. Avoid pure vasopressors!'
        };
      }

      return {
        title: 'DCM: Current Status',
        mechanism: phase?.description ?? 'Monitoring hemodynamic status.',
        divergence: 'DCM patients tolerate hypotension poorly but are HARMED by vasopressors that increase afterload. This paradox requires careful management.',
        teaching: 'In DCM: Inotropes (dobutamine) > pure vasopressors. Afterload reduction is often beneficial even when hypotensive.'
      };
    }

    // HCM-specific explanations
    if (phenotype === 'HCM') {
      if (phaseId === 'baseline' || phaseId === 'induction') {
        return {
          title: 'HCM: Baseline Physiology',
          mechanism: 'Hypertrophic cardiomyopathy features asymmetric septal hypertrophy with dynamic LVOT obstruction. The obstruction WORSENS with decreased preload, decreased afterload, and increased contractility/HR.',
          divergence: 'Unlike DCM, HCM patients NEED afterload. Vasodilation removes the backpressure that keeps the LVOT open. Catecholamines make everything worse.',
          teaching: 'HCM is the great mimicker. Hypotension looks like it needs vasopressors, but standard ACLS drugs (epinephrine) will KILL these patients.'
        };
      }

      if (vitals.lvotGradient > 50) {
        return {
          title: 'HCM: LVOT Obstruction',
          mechanism: `LVOT gradient: ${vitals.lvotGradient.toFixed(0)} mmHg. The systolic anterior motion (SAM) of the mitral valve is causing dynamic outflow obstruction. The faster the heart tries to eject, the worse the obstruction becomes.`,
          divergence: 'CRITICAL: This hypotension is OBSTRUCTIVE, not from low SVR. Giving epinephrine will increase contractility and HR, making the gradient WORSE and the patient MORE hypotensive.',
          teaching: 'Treatment is COUNTERINTUITIVE: Give volume (↑preload), phenylephrine (↑afterload), beta-blockers (↓HR/inotropy). Avoid all catecholamines!'
        };
      }

      if (vitals.ischemiaIndex > 0.3) {
        return {
          title: 'HCM: Myocardial Ischemia',
          mechanism: `Ischemia index: ${(vitals.ischemiaIndex * 100).toFixed(0)}%. The hypertrophied myocardium has high oxygen demand but poor coronary reserve. Tachycardia reduces filling time and diastolic coronary perfusion.`,
          divergence: 'In HCM, ischemia occurs even with normal coronary arteries. The thick walls compress intramyocardial vessels, and supply-demand mismatch is easily triggered.',
          teaching: 'Ischemia in HCM is treated by slowing the heart (beta-blockers), raising DBP (phenylephrine), and ensuring adequate preload. NOT by increasing inotropy!'
        };
      }

      if (vitals.catecholamines > 0.5 && vitals.lvotGradient > 40) {
        return {
          title: 'HCM: WRONG TREATMENT GIVEN',
          mechanism: `Catecholamine level: ${(vitals.catecholamines * 100).toFixed(0)}%. High catecholamines are worsening the obstruction. The beta-1 effects (↑HR, ↑inotropy) combined with beta-2 vasodilation are the WORST possible combination for HCM.`,
          divergence: 'THIS IS THE KEY LEARNING POINT: Standard ACLS with epinephrine will turn HCM hypotension into cardiovascular collapse. The "correct" drug is killing the patient.',
          teaching: 'STOP all catecholamines immediately. Give phenylephrine (pure alpha agonist), volume, and esmolol. If PEA arrest develops, do NOT give epinephrine per standard ACLS.'
        };
      }

      return {
        title: 'HCM: Current Status',
        mechanism: phase?.description ?? 'Monitoring hemodynamic status.',
        divergence: 'HCM hemodynamics are opposite to DCM. What helps DCM (afterload reduction, inotropes) HARMS HCM.',
        teaching: 'Rule of thumb for HCM: "Full, Slow, Tight" - keep preload full, HR slow, and afterload tight.'
      };
    }

    return {
      title: 'Cardiac Cascade Simulator',
      mechanism: 'Select a scenario to begin.',
      divergence: '',
      teaching: ''
    };
  }
</script>

<div class="explain-panel">
  <div class="panel-header">
    <h3 class="panel-title">Explain Divergence</h3>
    <span class="phenotype-badge" class:dcm={phenotype === 'DCM'} class:hcm={phenotype === 'HCM'}>
      {phenotype}
    </span>
  </div>

  <div class="explanation-content">
    <h4 class="section-title">{explanation.title}</h4>

    {#if explanation.mechanism}
      <div class="section">
        <span class="section-label">Mechanism</span>
        <p>{explanation.mechanism}</p>
      </div>
    {/if}

    {#if explanation.divergence}
      <div class="section divergence">
        <span class="section-label">Why This Differs</span>
        <p>{explanation.divergence}</p>
      </div>
    {/if}

    {#if explanation.teaching}
      <div class="section teaching">
        <span class="section-label">Teaching Point</span>
        <p>{explanation.teaching}</p>
      </div>
    {/if}
  </div>

  {#if phase}
    <div class="phase-info">
      <span class="phase-label">Current Phase:</span>
      <span class="phase-name">{phase.name}</span>
      {#if phase.events && phase.events.length > 0}
        <div class="events">
          {#each phase.events as event}
            <span class="event-tag">{event}</span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .explain-panel {
    background: #0d0d1a;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #2a2a4a;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .panel-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #ccc;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .phenotype-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .phenotype-badge.dcm {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .phenotype-badge.hcm {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.4);
  }

  .explanation-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .section {
    padding: 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }

  .section-label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    margin-bottom: 6px;
  }

  .section p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: #bbb;
  }

  .section.divergence {
    background: rgba(251, 191, 36, 0.1);
    border-left: 3px solid #eab308;
  }

  .section.divergence p {
    color: #fbbf24;
  }

  .section.teaching {
    background: rgba(74, 222, 128, 0.1);
    border-left: 3px solid #4ade80;
  }

  .section.teaching p {
    color: #4ade80;
  }

  .phase-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #2a2a4a;
  }

  .phase-label {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
  }

  .phase-name {
    font-size: 14px;
    font-weight: 600;
    color: #4ade80;
    margin-left: 8px;
  }

  .events {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .event-tag {
    padding: 4px 8px;
    background: rgba(74, 102, 160, 0.2);
    border-radius: 4px;
    font-size: 11px;
    color: #8aa;
  }
</style>
