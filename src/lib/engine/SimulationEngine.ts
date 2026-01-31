// Core simulation engine with fixed timestep accumulator
// Uses requestAnimationFrame for smooth rendering

import type {
  SimulationState,
  ScenarioDefinition,
  VitalSigns,
  DriverState,
  PhaseDefinition,
  InterventionRule,
  Keyframe,
  RuleCondition,
  VitalHistory,
  SimulationEvent
} from './types';
import { DCMModel } from './DCMModel';
import { HCMModel } from './HCMModel';
import { ArrhythmiaEngine } from './ArrhythmiaEngine';

const FIXED_DT = 0.033; // ~30Hz physics, seconds per step
const MAX_ACCUMULATED_TIME = 0.2; // Cap to prevent spiral of death
const HISTORY_INTERVAL = 1.0; // Record history every 1 second
const HISTORY_MAX_DURATION = 180; // Keep 3 minutes of history

export class SimulationEngine {
  private state: SimulationState;
  private scenario: ScenarioDefinition;
  private dcmModel: DCMModel;
  private hcmModel: HCMModel;
  private arrhythmiaEngine: ArrhythmiaEngine;
  private accumulator: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private onUpdate: ((state: SimulationState) => void) | null = null;
  private lastHistoryTime: number = -999;
  private rng: () => number;

  constructor(scenario: ScenarioDefinition, seed?: number) {
    this.scenario = scenario;
    const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
    this.rng = this.createSeededRng(actualSeed);
    this.dcmModel = new DCMModel();
    this.hcmModel = new HCMModel();
    this.arrhythmiaEngine = new ArrhythmiaEngine(this.rng);

    this.state = this.createInitialState(scenario, actualSeed);
  }

  private createSeededRng(seed: number): () => number {
    // Mulberry32 PRNG for reproducible runs
    let state = seed;
    return () => {
      state |= 0;
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private createInitialState(scenario: ScenarioDefinition, seed: number): SimulationState {
    const baseVitals: VitalSigns = {
      hr: 72,
      sbp: 120,
      dbp: 80,
      map: 93,
      spo2: 98,
      co: 5.0,
      svr: 1200,
      preload: 0.5,
      afterload: 0.5,
      coronaryPerfusion: 0.8,
      lvedp: 12,
      lvotGradient: scenario.phenotype === 'HCM' ? 30 : 0,
      rr: 14,
      paco2: 40,
      ph: 7.40,
      catecholamines: 0.3,
      pulmonaryEdema: 0.0,
      ischemiaIndex: 0.0,
      rhythmState: 'sinus',
      contractility: scenario.phenotype === 'DCM' ? 0.4 : 0.7,
      arrhythmiaRisk: 0.1,
      ...scenario.baselineVitals
    };

    const baseDrivers: DriverState = {
      // Defaults first, then scenario overrides
      ...{
        sedationDepth: 0,
        ventilationIndex: 1.0,
        painStimulus: 0,
        epiLoad: 0,
        airwayObstruction: 0,
        fluidStatus: 0,
        vasopressorDose: 0,
        betaBlockerEffect: 0,
        oxygenSupply: 0.21
      },
      ...scenario.baselineDrivers
    };

    // Start at T-10 (which is -10 minutes from T0)
    const startTimeMinutes = scenario.phases[0]?.startTime ?? -10;

    return {
      time: 0,
      timeMinutes: startTimeMinutes,
      phenotype: scenario.phenotype,
      vitals: baseVitals,
      drivers: baseDrivers,
      currentPhase: this.getPhaseAtTime(startTimeMinutes),
      activeInterventions: [],
      history: [],
      events: [],
      isPlaying: false,
      playbackSpeed: 1.0,
      loopMode: false,
      seed
    };
  }

  private getPhaseAtTime(timeMinutes: number): PhaseDefinition | null {
    for (const phase of this.scenario.phases) {
      if (timeMinutes >= phase.startTime && timeMinutes < phase.endTime) {
        return phase;
      }
    }
    return null;
  }

  private interpolateDrivers(timeMinutes: number): Partial<DriverState> {
    const keyframes = this.scenario.keyframes;
    if (keyframes.length === 0) return {};

    // Find surrounding keyframes
    let before: Keyframe | null = null;
    let after: Keyframe | null = null;

    for (const kf of keyframes) {
      if (kf.time <= timeMinutes) {
        if (!before || kf.time > before.time) {
          before = kf;
        }
      }
      if (kf.time > timeMinutes) {
        if (!after || kf.time < after.time) {
          after = kf;
        }
      }
    }

    if (!before && !after) return {};
    if (!before) return after!.drivers;
    if (!after) return before.drivers;

    // Linear interpolation between keyframes
    const t = (timeMinutes - before.time) / (after.time - before.time);
    const result: Partial<DriverState> = {};

    const allKeys = new Set([
      ...Object.keys(before.drivers),
      ...Object.keys(after.drivers)
    ]) as Set<keyof DriverState>;

    for (const key of allKeys) {
      const v1 = before.drivers[key] ?? this.state.drivers[key];
      const v2 = after.drivers[key] ?? this.state.drivers[key];
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        (result as Record<string, number>)[key] = v1 + (v2 - v1) * t;
      }
    }

    return result;
  }

  private evaluateCondition(condition: RuleCondition, vitals: VitalSigns, drivers: DriverState): boolean {
    let value: number | string;

    if (condition.parameter in vitals) {
      value = vitals[condition.parameter as keyof VitalSigns] as number | string;
    } else if (condition.parameter in drivers) {
      value = drivers[condition.parameter as keyof DriverState];
    } else {
      return false;
    }

    const target = condition.value;
    let result = false;

    switch (condition.operator) {
      case '<':
        result = typeof value === 'number' && typeof target === 'number' && value < target;
        break;
      case '>':
        result = typeof value === 'number' && typeof target === 'number' && value > target;
        break;
      case '<=':
        result = typeof value === 'number' && typeof target === 'number' && value <= target;
        break;
      case '>=':
        result = typeof value === 'number' && typeof target === 'number' && value >= target;
        break;
      case '==':
        result = value === target;
        break;
      case '!=':
        result = value !== target;
        break;
      case 'rising':
      case 'falling':
        // Would need history comparison - simplified for now
        result = true;
        break;
    }

    // Handle nested AND/OR conditions
    if (condition.and) {
      result = result && condition.and.every(c => this.evaluateCondition(c, vitals, drivers));
    }
    if (condition.or) {
      result = result || condition.or.some(c => this.evaluateCondition(c, vitals, drivers));
    }

    return result;
  }

  private evaluateInterventions(): InterventionRule[] {
    const activeRules: InterventionRule[] = [];

    for (const rule of this.scenario.interventionRules) {
      // Check phenotype match
      if (!rule.phenotypes.includes(this.state.phenotype)) continue;

      // Check time window
      if (rule.timeWindow) {
        if (this.state.timeMinutes < rule.timeWindow.start ||
            this.state.timeMinutes > rule.timeWindow.end) {
          continue;
        }
      }

      // Check all conditions
      const allConditionsMet = rule.conditions.every(c =>
        this.evaluateCondition(c, this.state.vitals, this.state.drivers)
      );

      if (allConditionsMet) {
        activeRules.push(rule);
      }
    }

    return activeRules;
  }

  private stepSimulation(dt: number): void {
    // Update time
    const speedMultiplier = this.state.playbackSpeed;
    const effectiveDt = dt * speedMultiplier;
    this.state.time += effectiveDt;
    this.state.timeMinutes = this.scenario.phases[0].startTime + (this.state.time / 60);

    // Check for loop
    const endTime = this.scenario.phases[this.scenario.phases.length - 1].endTime;
    if (this.state.loopMode && this.state.timeMinutes >= endTime) {
      this.reset();
      return;
    }

    // Stop at end if not looping
    if (this.state.timeMinutes >= endTime) {
      this.state.isPlaying = false;
      this.state.timeMinutes = endTime;
      return;
    }

    // Update current phase
    const newPhase = this.getPhaseAtTime(this.state.timeMinutes);
    if (newPhase && newPhase.id !== this.state.currentPhase?.id) {
      this.state.events.push({
        time: this.state.time,
        type: 'phase_change',
        data: { phaseId: newPhase.id, phaseName: newPhase.name }
      });
      this.state.currentPhase = newPhase;
    }

    // Interpolate drivers from keyframes
    const interpolatedDrivers = this.interpolateDrivers(this.state.timeMinutes);
    this.state.drivers = { ...this.state.drivers, ...interpolatedDrivers };

    // Apply physiology model based on phenotype
    if (this.state.phenotype === 'DCM') {
      this.state.vitals = this.dcmModel.update(this.state.vitals, this.state.drivers, dt);
    } else {
      this.state.vitals = this.hcmModel.update(this.state.vitals, this.state.drivers, dt);
    }

    // Update arrhythmia state
    const { rhythmState, arrhythmiaRisk } = this.arrhythmiaEngine.update(
      this.state.vitals,
      this.state.drivers,
      dt
    );

    if (rhythmState !== this.state.vitals.rhythmState) {
      this.state.events.push({
        time: this.state.time,
        type: 'rhythm_change',
        data: { from: this.state.vitals.rhythmState, to: rhythmState }
      });
    }

    this.state.vitals.rhythmState = rhythmState;
    this.state.vitals.arrhythmiaRisk = arrhythmiaRisk;

    // Evaluate interventions
    this.state.activeInterventions = this.evaluateInterventions();

    // Record history periodically
    if (this.state.time - this.lastHistoryTime >= HISTORY_INTERVAL) {
      this.state.history.push({
        time: this.state.time,
        vitals: { ...this.state.vitals }
      });
      this.lastHistoryTime = this.state.time;

      // Trim old history
      const cutoffTime = this.state.time - HISTORY_MAX_DURATION;
      this.state.history = this.state.history.filter(h => h.time >= cutoffTime);
    }
  }

  private tick(timestamp: number): void {
    if (!this.state.isPlaying) {
      this.animationFrameId = null;
      return;
    }

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
    }

    // Calculate elapsed time in seconds
    const elapsed = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // Accumulate time, but cap to prevent spiral of death
    this.accumulator += Math.min(elapsed, MAX_ACCUMULATED_TIME);

    // Step simulation in fixed increments
    while (this.accumulator >= FIXED_DT) {
      this.stepSimulation(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // Notify subscribers
    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
  }

  public start(): void {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.lastFrameTime = 0;
    this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
  }

  public pause(): void {
    this.state.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public reset(): void {
    this.pause();
    const seed = this.state.seed;
    this.rng = this.createSeededRng(seed);
    this.arrhythmiaEngine = new ArrhythmiaEngine(this.rng);
    this.state = this.createInitialState(this.scenario, seed);
    this.lastHistoryTime = -999;
    this.accumulator = 0;

    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }
  }

  public seekTo(timeMinutes: number): void {
    const wasPlaying = this.state.isPlaying;
    this.pause();

    // Reset and fast-forward
    const seed = this.state.seed;
    this.rng = this.createSeededRng(seed);
    this.arrhythmiaEngine = new ArrhythmiaEngine(this.rng);
    this.state = this.createInitialState(this.scenario, seed);
    this.lastHistoryTime = -999;

    const startTime = this.scenario.phases[0].startTime;
    const targetSeconds = (timeMinutes - startTime) * 60;

    // Fast-forward in larger steps
    const fastDt = 0.1;
    let simulatedTime = 0;
    while (simulatedTime < targetSeconds) {
      this.stepSimulation(fastDt);
      simulatedTime += fastDt;
    }

    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }

    if (wasPlaying) {
      this.start();
    }
  }

  public setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.5, Math.min(4.0, speed));
  }

  public setLoopMode(enabled: boolean): void {
    this.state.loopMode = enabled;
  }

  public subscribe(callback: (state: SimulationState) => void): () => void {
    this.onUpdate = callback;
    // Immediately call with current state
    callback(this.getState());

    return () => {
      this.onUpdate = null;
    };
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public getScenario(): ScenarioDefinition {
    return this.scenario;
  }

  public loadScenario(scenario: ScenarioDefinition, seed?: number): void {
    this.pause();
    this.scenario = scenario;
    const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
    this.rng = this.createSeededRng(actualSeed);
    this.arrhythmiaEngine = new ArrhythmiaEngine(this.rng);
    this.state = this.createInitialState(scenario, actualSeed);
    this.lastHistoryTime = -999;
    this.accumulator = 0;

    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }
  }

  public exportRun(): string {
    const exportData = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      scenario: this.scenario,
      events: this.state.events,
      vitalHistory: this.state.history,
      seed: this.state.seed
    };
    return JSON.stringify(exportData);
  }

  public logEvent(type: SimulationEvent['type'], data: Record<string, unknown>): void {
    this.state.events.push({
      time: this.state.time,
      type,
      data
    });
  }

  public destroy(): void {
    this.pause();
    this.onUpdate = null;
  }
}
