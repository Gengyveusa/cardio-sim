// Arrhythmia Engine - manages rhythm state transitions
// Probabilistic but seedable for reproducible runs

import type { VitalSigns, DriverState, RhythmState } from './types';

interface RhythmTransition {
  to: RhythmState;
  baseProb: number;
  riskMultiplier: number;
}

const RHYTHM_TRANSITIONS: Record<RhythmState, RhythmTransition[]> = {
  sinus: [
    { to: 'sinus_tachycardia', baseProb: 0.01, riskMultiplier: 1.5 },
    { to: 'atrial_fibrillation', baseProb: 0.002, riskMultiplier: 3 },
    { to: 'ventricular_tachycardia', baseProb: 0.001, riskMultiplier: 5 }
  ],
  sinus_tachycardia: [
    { to: 'sinus', baseProb: 0.02, riskMultiplier: 0 },
    { to: 'atrial_fibrillation', baseProb: 0.005, riskMultiplier: 2 },
    { to: 'ventricular_tachycardia', baseProb: 0.003, riskMultiplier: 4 }
  ],
  sinus_bradycardia: [
    { to: 'sinus', baseProb: 0.03, riskMultiplier: 0 },
    { to: 'asystole', baseProb: 0.002, riskMultiplier: 6 },
    { to: 'pea', baseProb: 0.001, riskMultiplier: 4 }
  ],
  atrial_fibrillation: [
    { to: 'sinus', baseProb: 0.005, riskMultiplier: 0 },
    { to: 'ventricular_tachycardia', baseProb: 0.003, riskMultiplier: 3 }
  ],
  ventricular_tachycardia: [
    { to: 'sinus', baseProb: 0.01, riskMultiplier: 0 },
    { to: 'ventricular_fibrillation', baseProb: 0.02, riskMultiplier: 4 },
    { to: 'pea', baseProb: 0.005, riskMultiplier: 3 }
  ],
  ventricular_fibrillation: [
    { to: 'asystole', baseProb: 0.05, riskMultiplier: 2 },
    { to: 'pea', baseProb: 0.02, riskMultiplier: 1.5 }
  ],
  pea: [
    { to: 'sinus', baseProb: 0.01, riskMultiplier: 0 },
    { to: 'asystole', baseProb: 0.03, riskMultiplier: 3 }
  ],
  asystole: [
    { to: 'pea', baseProb: 0.005, riskMultiplier: 0 },
    { to: 'sinus', baseProb: 0.002, riskMultiplier: 0 }
  ]
};

export class ArrhythmiaEngine {
  private rng: () => number;
  private currentRhythm: RhythmState = 'sinus';
  private rhythmStabilityTimer: number = 0;
  private readonly MIN_RHYTHM_DURATION = 3; // Minimum seconds before transition

  constructor(rng: () => number) {
    this.rng = rng;
  }

  public update(
    vitals: VitalSigns,
    drivers: DriverState,
    dt: number
  ): { rhythmState: RhythmState; arrhythmiaRisk: number } {
    this.currentRhythm = vitals.rhythmState;
    this.rhythmStabilityTimer += dt;

    const arrhythmiaRisk = vitals.arrhythmiaRisk;

    // Don't allow rapid rhythm changes
    if (this.rhythmStabilityTimer < this.MIN_RHYTHM_DURATION) {
      return { rhythmState: this.currentRhythm, arrhythmiaRisk };
    }

    // Special HR-based transitions
    if (this.currentRhythm === 'sinus') {
      if (vitals.hr > 100) {
        this.currentRhythm = 'sinus_tachycardia';
        this.rhythmStabilityTimer = 0;
        return { rhythmState: this.currentRhythm, arrhythmiaRisk };
      }
      if (vitals.hr < 60) {
        this.currentRhythm = 'sinus_bradycardia';
        this.rhythmStabilityTimer = 0;
        return { rhythmState: this.currentRhythm, arrhythmiaRisk };
      }
    }

    // Return from tachy/brady if HR normalizes
    if (this.currentRhythm === 'sinus_tachycardia' && vitals.hr <= 100) {
      this.currentRhythm = 'sinus';
      this.rhythmStabilityTimer = 0;
      return { rhythmState: this.currentRhythm, arrhythmiaRisk };
    }
    if (this.currentRhythm === 'sinus_bradycardia' && vitals.hr >= 60) {
      this.currentRhythm = 'sinus';
      this.rhythmStabilityTimer = 0;
      return { rhythmState: this.currentRhythm, arrhythmiaRisk };
    }

    // Critical state transitions based on severe physiology
    if (this.checkCriticalTransitions(vitals, drivers)) {
      return { rhythmState: this.currentRhythm, arrhythmiaRisk };
    }

    // Probabilistic transitions based on arrhythmia risk
    const transitions = RHYTHM_TRANSITIONS[this.currentRhythm] || [];

    for (const transition of transitions) {
      const probability = transition.baseProb +
        arrhythmiaRisk * transition.riskMultiplier * 0.01;

      // Roll per timestep
      const scaledProb = probability * dt;
      if (this.rng() < scaledProb) {
        this.currentRhythm = transition.to;
        this.rhythmStabilityTimer = 0;
        break;
      }
    }

    return { rhythmState: this.currentRhythm, arrhythmiaRisk };
  }

  private checkCriticalTransitions(vitals: VitalSigns, drivers: DriverState): boolean {
    // Severe hypoxia can cause any rhythm to deteriorate
    if (vitals.spo2 < 60) {
      if (this.rng() < 0.02) {
        if (this.currentRhythm === 'ventricular_tachycardia') {
          this.currentRhythm = 'ventricular_fibrillation';
        } else if (this.currentRhythm === 'ventricular_fibrillation') {
          this.currentRhythm = 'asystole';
        } else if (['sinus', 'sinus_tachycardia', 'sinus_bradycardia'].includes(this.currentRhythm)) {
          this.currentRhythm = 'ventricular_tachycardia';
        }
        this.rhythmStabilityTimer = 0;
        return true;
      }
    }

    // Severe acidosis
    if (vitals.ph < 7.1) {
      if (this.rng() < 0.03) {
        if (['sinus', 'sinus_tachycardia', 'atrial_fibrillation'].includes(this.currentRhythm)) {
          this.currentRhythm = 'ventricular_tachycardia';
        } else if (this.currentRhythm === 'ventricular_tachycardia') {
          this.currentRhythm = 'ventricular_fibrillation';
        }
        this.rhythmStabilityTimer = 0;
        return true;
      }
    }

    // Very high catecholamines with ischemia
    if (vitals.catecholamines > 0.8 && vitals.ischemiaIndex > 0.6) {
      if (this.rng() < 0.02) {
        if (['sinus', 'sinus_tachycardia'].includes(this.currentRhythm)) {
          this.currentRhythm = 'ventricular_tachycardia';
          this.rhythmStabilityTimer = 0;
          return true;
        }
      }
    }

    // Profound hypotension (PEA state)
    if (vitals.map < 30 && vitals.co < 2) {
      if (this.rng() < 0.05) {
        this.currentRhythm = 'pea';
        this.rhythmStabilityTimer = 0;
        return true;
      }
    }

    return false;
  }

  public reset(): void {
    this.currentRhythm = 'sinus';
    this.rhythmStabilityTimer = 0;
  }

  public forceRhythm(rhythm: RhythmState): void {
    this.currentRhythm = rhythm;
    this.rhythmStabilityTimer = 0;
  }
}
