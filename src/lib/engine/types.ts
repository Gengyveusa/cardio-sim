// Core simulation types for the Cardiac Cascade Simulator

export type Phenotype = 'DCM' | 'HCM';

export type RhythmState =
  | 'sinus'
  | 'sinus_tachycardia'
  | 'sinus_bradycardia'
  | 'atrial_fibrillation'
  | 'ventricular_tachycardia'
  | 'ventricular_fibrillation'
  | 'pea'
  | 'asystole';

export type InterventionSeverity = 'green' | 'yellow' | 'red';

export interface VitalSigns {
  hr: number;              // Heart rate (bpm)
  sbp: number;             // Systolic BP (mmHg)
  dbp: number;             // Diastolic BP (mmHg)
  map: number;             // Mean arterial pressure (mmHg)
  spo2: number;            // Oxygen saturation (%)
  co: number;              // Cardiac output (L/min)
  svr: number;             // Systemic vascular resistance (dyn·s/cm⁵)
  preload: number;         // Preload index (0-1)
  afterload: number;       // Afterload index (0-1)
  coronaryPerfusion: number; // Coronary perfusion index (0-1)
  lvedp: number;           // LV end-diastolic pressure (mmHg)
  lvotGradient: number;    // LVOT gradient (mmHg) - primarily for HCM
  rr: number;              // Respiratory rate (breaths/min)
  paco2: number;           // Arterial CO2 (mmHg)
  ph: number;              // Blood pH
  catecholamines: number;  // Catecholamine index (0-1)
  pulmonaryEdema: number;  // Pulmonary edema index (0-1)
  ischemiaIndex: number;   // Ischemia index (0-1)
  rhythmState: RhythmState;
  contractility: number;   // Contractility index (0-1)
  arrhythmiaRisk: number;  // Arrhythmia risk (0-1)
}

export interface DriverState {
  sedationDepth: number;      // 0 (awake) to 1 (deep sedation)
  ventilationIndex: number;   // 0 (apnea) to 1 (adequate)
  painStimulus: number;       // 0 (none) to 1 (severe)
  epiLoad: number;            // Epinephrine load (0-1)
  airwayObstruction: number;  // 0 (patent) to 1 (complete obstruction)
  fluidStatus: number;        // -1 (depleted) to 1 (overloaded)
  vasopressorDose: number;    // 0-1
  betaBlockerEffect: number;  // 0-1
  oxygenSupply: number;       // FiO2 0.21-1.0
}

export interface PhaseDefinition {
  id: string;
  name: string;
  startTime: number;    // Minutes from T0
  endTime: number;      // Minutes from T0
  description: string;
  keyframeDrivers: Partial<DriverState>;
  events?: string[];
}

export interface Keyframe {
  time: number;         // Minutes from T0
  drivers: Partial<DriverState>;
}

export interface InterventionRule {
  id: string;
  name: string;
  description: string;
  severity: InterventionSeverity;
  phenotypes: Phenotype[];
  conditions: RuleCondition[];
  timeWindow?: {
    start: number;
    end: number;
  };
  message: string;
  actions: string[];
}

export interface RuleCondition {
  parameter: keyof VitalSigns | keyof DriverState;
  operator: '<' | '>' | '<=' | '>=' | '==' | '!=' | 'rising' | 'falling';
  value: number | string;
  and?: RuleCondition[];
  or?: RuleCondition[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  phenotype: Phenotype;
  description: string;
  duration: number;         // Total duration in minutes
  phases: PhaseDefinition[];
  keyframes: Keyframe[];
  interventionRules: InterventionRule[];
  baselineVitals: Partial<VitalSigns>;
  baselineDrivers: DriverState;
}

export interface SimulationState {
  time: number;             // Current time in seconds (not minutes)
  timeMinutes: number;      // Time relative to T0 in minutes
  phenotype: Phenotype;
  vitals: VitalSigns;
  drivers: DriverState;
  currentPhase: PhaseDefinition | null;
  activeInterventions: InterventionRule[];
  history: VitalHistory[];
  events: SimulationEvent[];
  isPlaying: boolean;
  playbackSpeed: number;
  loopMode: boolean;
  seed: number;
}

export interface VitalHistory {
  time: number;
  vitals: VitalSigns;
}

export interface SimulationEvent {
  time: number;
  type: 'phase_change' | 'intervention' | 'rhythm_change' | 'severity_max' | 'user_action';
  data: Record<string, unknown>;
}

export interface RunExport {
  id: string;
  timestamp: string;
  scenario: ScenarioDefinition;
  events: SimulationEvent[];
  vitalHistory: VitalHistory[];
  seed: number;
}
