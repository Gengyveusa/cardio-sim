// DCM Scenario: Dilated Cardiomyopathy Cascade
// Timeline: T-10 to T+35 (45 minutes total)

import type { ScenarioDefinition } from '$lib/engine/types';

export const dcmScenario: ScenarioDefinition = {
  id: 'dcm-cascade',
  name: 'DCM Cardiac Cascade',
  phenotype: 'DCM',
  description: 'Dilated cardiomyopathy patient undergoing procedural sedation with progressive decompensation cascade. Demonstrates afterload sensitivity, pulmonary edema development, and hypercapnia-induced catecholamine surge.',
  duration: 45, // minutes
  phases: [
    {
      id: 'baseline',
      name: 'Baseline Assessment',
      startTime: -10,
      endTime: -5,
      description: 'Pre-procedure baseline. Patient with known DCM, EF 25-30%, on optimal medical therapy. Compensated heart failure.',
      keyframeDrivers: {
        sedationDepth: 0,
        ventilationIndex: 1.0,
        painStimulus: 0,
        epiLoad: 0
      },
      events: ['Patient positioned', 'Monitors applied', 'IV access confirmed']
    },
    {
      id: 'induction',
      name: 'Sedation Induction',
      startTime: -5,
      endTime: 0,
      description: 'Propofol and fentanyl administered. Vasodilation and respiratory depression begin.',
      keyframeDrivers: {
        sedationDepth: 0.6,
        ventilationIndex: 0.8
      },
      events: ['Propofol 50mg IV', 'Fentanyl 50mcg IV']
    },
    {
      id: 'procedure-start',
      name: 'Procedure Start',
      startTime: 0,
      endTime: 5,
      description: 'Procedural stimulation begins. Sedation deepened in response to movement.',
      keyframeDrivers: {
        sedationDepth: 0.75,
        ventilationIndex: 0.7,
        painStimulus: 0.3
      },
      events: ['Procedure initiated', 'Additional propofol for movement']
    },
    {
      id: 'hypoventilation',
      name: 'Early Hypoventilation',
      startTime: 5,
      endTime: 10,
      description: 'Respiratory depression progresses. SpO2 begins to drift down. Airway becomes partially obstructed.',
      keyframeDrivers: {
        sedationDepth: 0.8,
        ventilationIndex: 0.5,
        airwayObstruction: 0.3,
        painStimulus: 0.2
      },
      events: ['RR decreasing', 'Snoring noted', 'SpO2 94%']
    },
    {
      id: 'hypoxia-onset',
      name: 'Hypoxia Development',
      startTime: 10,
      endTime: 15,
      description: 'SpO2 drops further. Hypercapnia developing. Compensatory tachycardia begins.',
      keyframeDrivers: {
        ventilationIndex: 0.35,
        airwayObstruction: 0.5,
        oxygenSupply: 0.3
      },
      events: ['SpO2 88%', 'Nasal O2 applied', 'HR rising']
    },
    {
      id: 'catecholamine-surge',
      name: 'Catecholamine Surge',
      startTime: 15,
      endTime: 20,
      description: 'Hypercapnia and acidosis trigger endogenous catecholamine release. HR and BP rise. Myocardial O2 demand increases.',
      keyframeDrivers: {
        ventilationIndex: 0.3,
        epiLoad: 0.4
      },
      events: ['PaCO2 rising', 'Catecholamine surge', 'Ectopy noted']
    },
    {
      id: 'decompensation',
      name: 'Cardiac Decompensation',
      startTime: 20,
      endTime: 25,
      description: 'Increased afterload from catecholamines overwhelms the DCM heart. LVEDP rises rapidly. Pulmonary edema develops.',
      keyframeDrivers: {
        ventilationIndex: 0.25,
        epiLoad: 0.6,
        fluidStatus: 0.3
      },
      events: ['LVEDP rising', 'Crackles auscultated', 'SpO2 dropping despite O2']
    },
    {
      id: 'crisis',
      name: 'Crisis Phase',
      startTime: 25,
      endTime: 30,
      description: 'Florid pulmonary edema. Severe hypoxia. Arrhythmia risk critical. Without intervention, arrest imminent.',
      keyframeDrivers: {
        ventilationIndex: 0.2,
        airwayObstruction: 0.6,
        epiLoad: 0.8
      },
      events: ['Pink frothy sputum', 'VT noted', 'Team activated']
    },
    {
      id: 'resuscitation',
      name: 'Resuscitation',
      startTime: 30,
      endTime: 33,
      description: 'Emergency intervention. Airway secured. Positive pressure ventilation. Vasodilators considered.',
      keyframeDrivers: {
        ventilationIndex: 0.8,
        airwayObstruction: 0,
        oxygenSupply: 1.0,
        epiLoad: 0.5
      },
      events: ['BVM ventilation', 'Airway secured', 'Rhythm check']
    },
    {
      id: 'outcome',
      name: 'Outcome',
      startTime: 33,
      endTime: 35,
      description: 'Resolution or continued deterioration based on intervention timing and effectiveness.',
      keyframeDrivers: {
        ventilationIndex: 0.9,
        oxygenSupply: 1.0,
        sedationDepth: 0.3,
        epiLoad: 0.2
      },
      events: ['Stabilizing...', 'ICU transfer arranged']
    }
  ],
  keyframes: [
    { time: -10, drivers: { sedationDepth: 0, ventilationIndex: 1.0, painStimulus: 0, epiLoad: 0, airwayObstruction: 0, fluidStatus: 0, oxygenSupply: 0.21 } },
    { time: -5, drivers: { sedationDepth: 0.3, ventilationIndex: 0.95 } },
    { time: 0, drivers: { sedationDepth: 0.6, ventilationIndex: 0.8 } },
    { time: 3, drivers: { sedationDepth: 0.7, ventilationIndex: 0.75, painStimulus: 0.2 } },
    { time: 5, drivers: { sedationDepth: 0.75, ventilationIndex: 0.6, painStimulus: 0.3 } },
    { time: 8, drivers: { sedationDepth: 0.8, ventilationIndex: 0.45, airwayObstruction: 0.35 } },
    { time: 10, drivers: { ventilationIndex: 0.35, airwayObstruction: 0.5, oxygenSupply: 0.3 } },
    { time: 13, drivers: { ventilationIndex: 0.3, airwayObstruction: 0.55, oxygenSupply: 0.4 } },
    { time: 15, drivers: { ventilationIndex: 0.28, epiLoad: 0.3 } },
    { time: 18, drivers: { ventilationIndex: 0.25, epiLoad: 0.5 } },
    { time: 20, drivers: { epiLoad: 0.6, fluidStatus: 0.2 } },
    { time: 23, drivers: { epiLoad: 0.7, fluidStatus: 0.3, ventilationIndex: 0.2 } },
    { time: 25, drivers: { epiLoad: 0.75, airwayObstruction: 0.6 } },
    { time: 28, drivers: { epiLoad: 0.85, ventilationIndex: 0.15 } },
    { time: 30, drivers: { ventilationIndex: 0.7, airwayObstruction: 0.1, oxygenSupply: 1.0 } },
    { time: 32, drivers: { ventilationIndex: 0.85, airwayObstruction: 0, epiLoad: 0.5 } },
    { time: 35, drivers: { ventilationIndex: 0.9, epiLoad: 0.25, sedationDepth: 0.3 } }
  ],
  interventionRules: [
    // GREEN - Preventive
    {
      id: 'dcm-preload-warning',
      name: 'Preload Optimization',
      description: 'Consider fluid bolus before induction in DCM patients to maintain preload during vasodilation.',
      severity: 'green',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'preload', operator: '<', value: 0.45 }
      ],
      timeWindow: { start: -10, end: 0 },
      message: 'DCM patients are preload-dependent. Consider 250-500mL crystalloid pre-induction.',
      actions: ['Assess volume status', 'Consider fluid bolus', 'Prepare vasopressor']
    },
    {
      id: 'dcm-sedation-caution',
      name: 'Sedation Depth Monitoring',
      description: 'Monitor for excessive sedation-induced respiratory depression.',
      severity: 'green',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'sedationDepth', operator: '>', value: 0.5 },
        { parameter: 'ventilationIndex', operator: '<', value: 0.8 }
      ],
      timeWindow: { start: -5, end: 10 },
      message: 'Sedation causing hypoventilation. Monitor closely for respiratory depression.',
      actions: ['Reduce sedation rate', 'Prepare airway equipment', 'Consider jaw thrust']
    },
    // YELLOW - Early Recognition
    {
      id: 'dcm-hypoxia-early',
      name: 'Early Hypoxia Detection',
      description: 'SpO2 trending down - intervene before cascade begins.',
      severity: 'yellow',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'spo2', operator: '<', value: 94 }
      ],
      message: 'SpO2 dropping. In DCM, hypoxia triggers catecholamine surge → ↑afterload → decompensation.',
      actions: ['Supplemental O2', 'Airway positioning', 'Reduce sedation', 'Prepare BVM']
    },
    {
      id: 'dcm-co2-rising',
      name: 'Hypercapnia Alert',
      description: 'PaCO2 rising - hypoventilation cascade beginning.',
      severity: 'yellow',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'paco2', operator: '>', value: 50 }
      ],
      message: 'Hypercapnia developing. Will trigger sympathetic surge and worsen DCM hemodynamics.',
      actions: ['Assisted ventilation', 'Airway adjunct', 'Consider reversal agents']
    },
    {
      id: 'dcm-lvedp-rising',
      name: 'LVEDP Rising',
      description: 'Left ventricular filling pressure increasing - pulmonary edema risk.',
      severity: 'yellow',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'lvedp', operator: '>', value: 20 }
      ],
      message: 'LVEDP elevated. Pulmonary edema developing. Reduce afterload if possible.',
      actions: ['Sitting position', 'Reduce fluid rate', 'Consider nitrates', 'Prepare diuretic']
    },
    // RED - Emergency
    {
      id: 'dcm-pulmonary-edema',
      name: 'Pulmonary Edema Crisis',
      description: 'Flash pulmonary edema - emergent intervention required.',
      severity: 'red',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'pulmonaryEdema', operator: '>', value: 0.5 }
      ],
      message: 'FLASH PULMONARY EDEMA. Immediate intervention: CPAP/BiPAP, nitrates, diuretics.',
      actions: ['Positive pressure ventilation', 'Nitroglycerin', 'Furosemide 40mg IV', 'Call for help']
    },
    {
      id: 'dcm-arrest-imminent',
      name: 'Arrest Imminent',
      description: 'Multiple critical parameters - arrest imminent without intervention.',
      severity: 'red',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'arrhythmiaRisk', operator: '>', value: 0.7 },
        { parameter: 'ph', operator: '<', value: 7.2 }
      ],
      message: 'ARREST IMMINENT. Severe acidosis + high arrhythmia risk. Prepare for resuscitation.',
      actions: ['Prepare defibrillator', 'Secure airway', 'Call code team', 'Prepare epinephrine']
    },
    {
      id: 'dcm-hypotension-crisis',
      name: 'Cardiogenic Shock',
      description: 'Severe hypotension with low cardiac output.',
      severity: 'red',
      phenotypes: ['DCM'],
      conditions: [
        { parameter: 'map', operator: '<', value: 55 },
        { parameter: 'co', operator: '<', value: 3 }
      ],
      message: 'CARDIOGENIC SHOCK. Low CO + hypotension. Inotrope needed but will increase afterload.',
      actions: ['Dobutamine > Epinephrine', 'Avoid pure vasopressors', 'Consider IABP']
    }
  ],
  baselineVitals: {
    hr: 78,
    sbp: 105,
    dbp: 68,
    map: 80,
    spo2: 96,
    co: 3.8,
    svr: 1400,
    preload: 0.5,
    afterload: 0.55,
    coronaryPerfusion: 0.65,
    lvedp: 16,
    lvotGradient: 0,
    rr: 16,
    paco2: 38,
    ph: 7.38,
    catecholamines: 0.3,
    pulmonaryEdema: 0.05,
    ischemiaIndex: 0.1,
    contractility: 0.35
  },
  baselineDrivers: {
    sedationDepth: 0,
    ventilationIndex: 1.0,
    painStimulus: 0,
    epiLoad: 0,
    airwayObstruction: 0,
    fluidStatus: 0,
    vasopressorDose: 0,
    betaBlockerEffect: 0.2, // On chronic beta blocker
    oxygenSupply: 0.21
  }
};
