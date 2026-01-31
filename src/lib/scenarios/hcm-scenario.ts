// HCM Scenario: Hypertrophic Cardiomyopathy Cascade
// Timeline: T-10 to T+35 (45 minutes total)

import type { ScenarioDefinition } from '$lib/engine/types';

export const hcmScenario: ScenarioDefinition = {
  id: 'hcm-cascade',
  name: 'HCM Cardiac Cascade',
  phenotype: 'HCM',
  description: 'Hypertrophic cardiomyopathy patient with dynamic LVOT obstruction undergoing procedural sedation. Demonstrates the paradoxical hemodynamics where standard resuscitation measures can worsen obstruction.',
  duration: 45,
  phases: [
    {
      id: 'baseline',
      name: 'Baseline Assessment',
      startTime: -10,
      endTime: -5,
      description: 'Pre-procedure baseline. Known HCM with resting LVOT gradient 25-30mmHg. On beta-blocker therapy.',
      keyframeDrivers: {
        sedationDepth: 0,
        ventilationIndex: 1.0,
        painStimulus: 0,
        betaBlockerEffect: 0.4
      },
      events: ['Patient positioned', 'Baseline gradient assessed', 'Beta-blocker continued']
    },
    {
      id: 'induction',
      name: 'Sedation Induction',
      startTime: -5,
      endTime: 0,
      description: 'Careful sedation with attention to avoiding vasodilation. Even mild propofol can drop SVR dangerously.',
      keyframeDrivers: {
        sedationDepth: 0.5,
        ventilationIndex: 0.85
      },
      events: ['Low-dose propofol', 'Monitoring SVR closely']
    },
    {
      id: 'procedure-start',
      name: 'Procedure Start',
      startTime: 0,
      endTime: 5,
      description: 'Procedural stimulation causes sympathetic activation. HR rises, worsening LVOT gradient.',
      keyframeDrivers: {
        sedationDepth: 0.55,
        painStimulus: 0.4,
        ventilationIndex: 0.8
      },
      events: ['Procedure initiated', 'Patient grimacing', 'HR increasing']
    },
    {
      id: 'lvoto-worsening',
      name: 'LVOTO Worsening',
      startTime: 5,
      endTime: 10,
      description: 'Combination of tachycardia from pain and relative hypovolemia worsens LVOT obstruction. BP dropping.',
      keyframeDrivers: {
        sedationDepth: 0.6,
        painStimulus: 0.5,
        fluidStatus: -0.2
      },
      events: ['LVOT gradient rising', 'SBP dropping', 'Murmur louder']
    },
    {
      id: 'hypotension-onset',
      name: 'Hypotension Development',
      startTime: 10,
      endTime: 15,
      description: 'MAP drops. Team considers vasopressor but this is the WRONG approach for HCM-LVOTO.',
      keyframeDrivers: {
        sedationDepth: 0.65,
        painStimulus: 0.3,
        fluidStatus: -0.3
      },
      events: ['MAP < 65', 'Team discussing pressors', 'Critical decision point']
    },
    {
      id: 'catecholamine-crisis',
      name: 'Catecholamine Crisis',
      startTime: 15,
      endTime: 20,
      description: 'If epinephrine given: ↑HR + ↑inotropy → severe LVOTO → cardiovascular collapse. The typical code drugs make HCM worse.',
      keyframeDrivers: {
        epiLoad: 0.5,
        fluidStatus: -0.25
      },
      events: ['Epinephrine administered', 'LVOT gradient skyrockets', 'BP paradoxically worse']
    },
    {
      id: 'ischemia-development',
      name: 'Ischemia Development',
      startTime: 20,
      endTime: 25,
      description: 'Thick walls + tachycardia + hypotension → severe supply-demand mismatch. Ischemia triggers more arrhythmias.',
      keyframeDrivers: {
        epiLoad: 0.6,
        painStimulus: 0.6
      },
      events: ['ST changes', 'Chest pain if awake', 'Ectopy increasing']
    },
    {
      id: 'crisis',
      name: 'Crisis Phase',
      startTime: 25,
      endTime: 30,
      description: 'Severe LVOTO with ischemia. VT/VF risk high. PEA arrest possible from obstruction.',
      keyframeDrivers: {
        epiLoad: 0.7,
        ventilationIndex: 0.6
      },
      events: ['VT noted', 'Severe hypotension', 'Considering cardioversion']
    },
    {
      id: 'correct-resuscitation',
      name: 'Correct Resuscitation',
      startTime: 30,
      endTime: 33,
      description: 'CORRECT approach: Volume, phenylephrine (pure alpha), beta-blocker, leg raise. AVOID epinephrine.',
      keyframeDrivers: {
        fluidStatus: 0.3,
        vasopressorDose: 0.4,
        betaBlockerEffect: 0.6,
        epiLoad: 0.2
      },
      events: ['Fluid bolus', 'Phenylephrine', 'Esmolol', 'Legs elevated']
    },
    {
      id: 'outcome',
      name: 'Outcome',
      startTime: 33,
      endTime: 35,
      description: 'With correct treatment: preload restored, afterload increased, HR controlled → LVOTO resolves.',
      keyframeDrivers: {
        fluidStatus: 0.4,
        vasopressorDose: 0.3,
        betaBlockerEffect: 0.5,
        ventilationIndex: 0.95,
        epiLoad: 0.1
      },
      events: ['Gradient improving', 'BP recovering', 'Rhythm stabilizing']
    }
  ],
  keyframes: [
    { time: -10, drivers: { sedationDepth: 0, ventilationIndex: 1.0, painStimulus: 0, epiLoad: 0, fluidStatus: 0, betaBlockerEffect: 0.4, oxygenSupply: 0.21 } },
    { time: -5, drivers: { sedationDepth: 0.3, ventilationIndex: 0.95 } },
    { time: 0, drivers: { sedationDepth: 0.5, ventilationIndex: 0.85 } },
    { time: 3, drivers: { sedationDepth: 0.55, painStimulus: 0.35, ventilationIndex: 0.82 } },
    { time: 5, drivers: { sedationDepth: 0.55, painStimulus: 0.45, fluidStatus: -0.1 } },
    { time: 8, drivers: { sedationDepth: 0.6, painStimulus: 0.5, fluidStatus: -0.2 } },
    { time: 10, drivers: { painStimulus: 0.4, fluidStatus: -0.25 } },
    { time: 13, drivers: { fluidStatus: -0.3 } },
    { time: 15, drivers: { epiLoad: 0.3 } },
    { time: 17, drivers: { epiLoad: 0.5 } },
    { time: 20, drivers: { epiLoad: 0.6, painStimulus: 0.5 } },
    { time: 23, drivers: { epiLoad: 0.65 } },
    { time: 25, drivers: { epiLoad: 0.7, ventilationIndex: 0.7 } },
    { time: 28, drivers: { epiLoad: 0.75, ventilationIndex: 0.6 } },
    { time: 30, drivers: { fluidStatus: 0.1, vasopressorDose: 0.2, betaBlockerEffect: 0.5, epiLoad: 0.4 } },
    { time: 32, drivers: { fluidStatus: 0.3, vasopressorDose: 0.4, betaBlockerEffect: 0.6, epiLoad: 0.2 } },
    { time: 35, drivers: { fluidStatus: 0.4, vasopressorDose: 0.3, betaBlockerEffect: 0.5, epiLoad: 0.1, ventilationIndex: 0.95 } }
  ],
  interventionRules: [
    // GREEN - Preventive
    {
      id: 'hcm-preload-critical',
      name: 'Maintain Preload',
      description: 'Preload is CRITICAL in HCM. Volume depletion dramatically worsens LVOTO.',
      severity: 'green',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'preload', operator: '<', value: 0.5 }
      ],
      timeWindow: { start: -10, end: 10 },
      message: 'HCM requires adequate preload. Pre-load with 500mL crystalloid before any vasodilating drugs.',
      actions: ['IV fluid bolus', 'Avoid dehydration', 'Monitor JVP']
    },
    {
      id: 'hcm-avoid-vasodilation',
      name: 'Avoid Vasodilators',
      description: 'Vasodilation removes the afterload that keeps the LVOT open.',
      severity: 'green',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'afterload', operator: '<', value: 0.45 }
      ],
      message: 'Low afterload worsens LVOTO. Avoid propofol boluses, nitrates, and other vasodilators.',
      actions: ['Use ketamine or etomidate', 'Have phenylephrine ready', 'Slow propofol if needed']
    },
    {
      id: 'hcm-hr-control',
      name: 'Heart Rate Control',
      description: 'Tachycardia reduces filling time and worsens obstruction.',
      severity: 'green',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'hr', operator: '>', value: 85 }
      ],
      message: 'HR rising. Tachycardia worsens LVOTO by reducing filling time. Consider esmolol.',
      actions: ['Ensure adequate analgesia', 'Consider beta-blocker', 'Avoid catecholamines']
    },
    // YELLOW - Early Recognition
    {
      id: 'hcm-lvot-rising',
      name: 'LVOT Gradient Rising',
      description: 'Dynamic obstruction worsening - intervene now before crisis.',
      severity: 'yellow',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'lvotGradient', operator: '>', value: 50 }
      ],
      message: 'LVOT gradient rising. Give volume, raise afterload with phenylephrine, control HR.',
      actions: ['Fluid bolus 500mL', 'Phenylephrine 100mcg', 'Esmolol if tachycardic', 'Elevate legs']
    },
    {
      id: 'hcm-hypotension-warning',
      name: 'Hypotension - Consider LVOTO',
      description: 'Hypotension in HCM may be LVOTO-driven, not hypovolemia.',
      severity: 'yellow',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'map', operator: '<', value: 65 },
        { parameter: 'lvotGradient', operator: '>', value: 40 }
      ],
      message: 'LVOTO-driven hypotension! Do NOT give epinephrine. Use phenylephrine + volume + beta-blocker.',
      actions: ['Phenylephrine (pure alpha)', 'Rapid fluid bolus', 'Esmolol 10-20mg', 'Avoid inotropes']
    },
    {
      id: 'hcm-ischemia-warning',
      name: 'Ischemia Developing',
      description: 'Supply-demand mismatch in thick-walled ventricle.',
      severity: 'yellow',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'ischemiaIndex', operator: '>', value: 0.3 }
      ],
      message: 'Myocardial ischemia developing. Thick walls need MORE coronary flow. Control HR, raise DBP.',
      actions: ['Beta-blocker to slow HR', 'Phenylephrine for DBP', 'Avoid tachycardia']
    },
    // RED - Emergency
    {
      id: 'hcm-severe-lvoto',
      name: 'Severe LVOTO Crisis',
      description: 'Critical obstruction - standard ACLS will make this WORSE.',
      severity: 'red',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'lvotGradient', operator: '>', value: 80 },
        { parameter: 'map', operator: '<', value: 55 }
      ],
      message: 'SEVERE LVOTO CRISIS. AVOID EPINEPHRINE. Phenylephrine + Volume + Beta-blocker + Leg raise.',
      actions: ['Phenylephrine 200mcg', 'Rapid 1L crystalloid', 'Esmolol 20mg', 'Trendelenburg', 'AVOID epi/dopamine']
    },
    {
      id: 'hcm-wrong-treatment',
      name: 'Wrong Treatment Alert',
      description: 'Catecholamines given to HCM patient - gradient will worsen.',
      severity: 'red',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'epiLoad', operator: '>', value: 0.4 },
        { parameter: 'lvotGradient', operator: '>', value: 60 }
      ],
      message: 'CATECHOLAMINES WORSENING LVOTO! Stop epinephrine. Give phenylephrine + esmolol immediately.',
      actions: ['Stop all catecholamines', 'Phenylephrine bolus', 'Esmolol 20-40mg', 'Volume resuscitation']
    },
    {
      id: 'hcm-arrest-risk',
      name: 'Arrest Risk - Ischemia + LVOTO',
      description: 'Combination of ischemia and severe obstruction - VF/PEA risk.',
      severity: 'red',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'ischemiaIndex', operator: '>', value: 0.6 },
        { parameter: 'arrhythmiaRisk', operator: '>', value: 0.6 }
      ],
      message: 'HIGH ARREST RISK. Ischemia + arrhythmia risk critical. If VF: defibrillate. If PEA: phenylephrine, NOT epi.',
      actions: ['Defibrillator ready', 'Phenylephrine for PEA', 'Avoid epinephrine', 'Consider amiodarone']
    },
    {
      id: 'hcm-pea-arrest',
      name: 'PEA Arrest Protocol',
      description: 'PEA in HCM is often from complete LVOTO.',
      severity: 'red',
      phenotypes: ['HCM'],
      conditions: [
        { parameter: 'rhythmState', operator: '==', value: 'pea' }
      ],
      message: 'PEA ARREST. Likely complete LVOTO. Phenylephrine 1mg, volume bolus, compress gently. NO EPINEPHRINE.',
      actions: ['Phenylephrine 1mg IV', 'Rapid volume infusion', 'Gentle CPR', 'Avoid epinephrine']
    }
  ],
  baselineVitals: {
    hr: 68,
    sbp: 118,
    dbp: 75,
    map: 89,
    spo2: 98,
    co: 5.2,
    svr: 1350,
    preload: 0.55,
    afterload: 0.55,
    coronaryPerfusion: 0.7,
    lvedp: 18,
    lvotGradient: 28,
    rr: 14,
    paco2: 40,
    ph: 7.40,
    catecholamines: 0.25,
    pulmonaryEdema: 0.0,
    ischemiaIndex: 0.05,
    contractility: 0.75
  },
  baselineDrivers: {
    sedationDepth: 0,
    ventilationIndex: 1.0,
    painStimulus: 0,
    epiLoad: 0,
    airwayObstruction: 0,
    fluidStatus: 0,
    vasopressorDose: 0,
    betaBlockerEffect: 0.4, // On chronic beta blocker
    oxygenSupply: 0.21
  }
};
