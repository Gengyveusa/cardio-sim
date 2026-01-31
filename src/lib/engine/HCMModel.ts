// HCM (Hypertrophic Cardiomyopathy) Physiology Model
// Characteristics:
// - LVOTO worsens with ↓preload, ↓afterload, ↑HR, ↑inotropy
// - Hypotension may be LVOTO-driven
// - High risk of ischemia due to wall thickness and high O2 demand
// - Arrhythmias and PEA risk

import type { VitalSigns, DriverState } from './types';

export class HCMModel {
  private readonly HR_RESPONSE_RATE = 0.3;
  private readonly LVOT_RESPONSE_RATE = 0.2;
  private readonly ISCHEMIA_RATE = 0.08; // Higher than DCM due to thick walls

  public update(vitals: VitalSigns, drivers: DriverState, dt: number): VitalSigns {
    const v = { ...vitals };

    // ============ CONTRACTILITY ============
    // HCM has INCREASED contractility (hyperdynamic)
    const baseContractility = 0.75;
    const epiBoost = drivers.epiLoad * 0.2;
    const sedationImpact = -drivers.sedationDepth * 0.15;
    const painBoost = drivers.painStimulus * 0.1;
    const targetContractility = Math.max(0.3, Math.min(1.0,
      baseContractility + epiBoost + sedationImpact + painBoost
    ));
    v.contractility += (targetContractility - v.contractility) * dt * 0.5;

    // ============ HEART RATE ============
    const baseHR = 70;
    let targetHR = baseHR;
    targetHR += drivers.painStimulus * 35;
    targetHR += drivers.epiLoad * 45;
    targetHR += v.catecholamines * 25;
    targetHR -= drivers.sedationDepth * 15;
    targetHR -= drivers.betaBlockerEffect * 30; // Beta blockers more effective in HCM

    if (v.spo2 < 90) {
      targetHR += (90 - v.spo2) * 1.5;
    }
    if (v.spo2 < 70) {
      targetHR -= (70 - v.spo2) * 4;
    }
    if (v.ph < 7.35) {
      targetHR += (7.35 - v.ph) * 80;
    }

    targetHR = Math.max(35, Math.min(170, targetHR));
    v.hr += (targetHR - v.hr) * dt * this.HR_RESPONSE_RATE;

    // ============ PRELOAD / AFTERLOAD ============
    // Preload CRITICAL in HCM - needs to be maintained
    v.preload = Math.max(0, Math.min(1,
      0.5 + drivers.fluidStatus * 0.35 - drivers.sedationDepth * 0.2
    ));

    // Afterload - maintaining afterload is protective in HCM
    const catecholamineEffect = v.catecholamines * 0.15;
    const vasopressorEffect = drivers.vasopressorDose * 0.35;
    const sedationEffect = -drivers.sedationDepth * 0.2; // Vasodilation from sedation is BAD in HCM
    v.afterload = Math.max(0.1, Math.min(1,
      0.5 + catecholamineEffect + vasopressorEffect + sedationEffect
    ));

    v.svr = 900 + v.afterload * 700;

    // ============ LVOT GRADIENT ============
    // THE KEY FEATURE OF HCM
    // Worsens with: ↓preload, ↓afterload, ↑HR, ↑contractility
    const baseGradient = 25;

    // Preload effect: low preload dramatically worsens obstruction
    const preloadEffect = v.preload < 0.5 ? (0.5 - v.preload) * 100 : -(v.preload - 0.5) * 20;

    // Afterload effect: low afterload worsens obstruction (no backpressure)
    const afterloadEffect = v.afterload < 0.5 ? (0.5 - v.afterload) * 80 : -(v.afterload - 0.5) * 15;

    // HR effect: tachycardia worsens obstruction (less filling time)
    const hrEffect = v.hr > 80 ? (v.hr - 80) * 0.8 : 0;

    // Contractility effect: increased inotropy worsens SAM and obstruction
    const contractilityEffect = (v.contractility - 0.5) * 50;

    // Beta blocker benefit
    const betaBlockerBenefit = -drivers.betaBlockerEffect * 40;

    let targetGradient = baseGradient + preloadEffect + afterloadEffect +
      hrEffect + contractilityEffect + betaBlockerBenefit;

    // Gradient can't be negative
    targetGradient = Math.max(0, Math.min(150, targetGradient));
    v.lvotGradient += (targetGradient - v.lvotGradient) * dt * this.LVOT_RESPONSE_RATE;

    // ============ CARDIAC OUTPUT ============
    // HCM: CO is LIMITED by LVOT obstruction
    // Despite good contractility, the obstruction limits ejection
    const obstructionPenalty = v.lvotGradient > 30 ? (v.lvotGradient - 30) / 100 : 0;
    const strokeVolume = v.contractility * v.preload * 90 * (1 - obstructionPenalty * 0.5);
    const effectiveCO = (v.hr * strokeVolume) / 1000;
    v.co = Math.max(1.5, Math.min(7, effectiveCO));

    // ============ BLOOD PRESSURE ============
    // MAP can drop due to LVOTO, not just vasodilation
    // This is the key distinguishing feature for HCM hypotension
    v.map = (v.co * v.svr) / 80;

    // Additional MAP penalty from severe obstruction
    if (v.lvotGradient > 60) {
      v.map -= (v.lvotGradient - 60) * 0.3;
    }

    v.map = Math.max(25, Math.min(140, v.map));

    // SBP/DBP - note: may have bifid pulse with severe LVOTO
    const pulsePressure = 35 + v.contractility * 25 - obstructionPenalty * 15;
    v.sbp = v.map + pulsePressure / 2;
    v.dbp = v.map - pulsePressure / 2;
    v.sbp = Math.max(35, Math.min(180, v.sbp));
    v.dbp = Math.max(20, Math.min(110, v.dbp));

    // ============ LVEDP ============
    // Elevated in HCM due to diastolic dysfunction (stiff, thick walls)
    const baseLVEDP = 16;
    const stiffnessEffect = 8; // Inherent diastolic dysfunction
    const preloadEffect2 = v.preload * 6;
    v.lvedp = baseLVEDP + stiffnessEffect + preloadEffect2 + drivers.fluidStatus * 4;
    v.lvedp = Math.max(8, Math.min(35, v.lvedp));

    // ============ PULMONARY EDEMA ============
    // Less common than DCM but can occur with fluid overload
    if (v.lvedp > 25) {
      v.pulmonaryEdema += (v.lvedp - 25) * 0.005 * dt;
    } else if (v.pulmonaryEdema > 0) {
      v.pulmonaryEdema -= 0.008 * dt;
    }
    v.pulmonaryEdema = Math.max(0, Math.min(0.7, v.pulmonaryEdema)); // Less severe than DCM

    // ============ RESPIRATORY ============
    let targetRR = 14;
    targetRR -= drivers.sedationDepth * 8;
    targetRR += drivers.painStimulus * 6;
    targetRR += v.pulmonaryEdema * 8;

    if (v.spo2 < 94) {
      targetRR += (94 - v.spo2) * 0.4;
    }

    const effectiveVentilation = drivers.ventilationIndex * (1 - drivers.airwayObstruction);
    if (effectiveVentilation < 0.5) {
      targetRR += 8;
    }

    targetRR = Math.max(4, Math.min(35, targetRR));
    v.rr = targetRR;

    // ============ PaCO2 ============
    const targetPaCO2 = 40 + (1 - effectiveVentilation) * 35 + v.pulmonaryEdema * 8;
    v.paco2 += (targetPaCO2 - v.paco2) * dt * 0.1;
    v.paco2 = Math.max(20, Math.min(90, v.paco2));

    // ============ pH ============
    const respiratoryComponent = 7.40 - (v.paco2 - 40) * 0.008;
    const metabolicComponent = v.co < 3.5 ? -(3.5 - v.co) * 0.04 : 0;
    const lacticComponent = v.ischemiaIndex * 0.12; // HCM prone to ischemia
    v.ph = respiratoryComponent + metabolicComponent - lacticComponent;
    v.ph = Math.max(6.8, Math.min(7.6, v.ph));

    // ============ SpO2 ============
    const baseSpO2 = 98;
    const ventilationPenalty = (1 - effectiveVentilation) * 35;
    const edemaPenalty = v.pulmonaryEdema * 25;
    const o2Benefit = (drivers.oxygenSupply - 0.21) * 18;
    v.spo2 = baseSpO2 - ventilationPenalty - edemaPenalty + o2Benefit;
    v.spo2 = Math.max(55, Math.min(100, v.spo2));

    // ============ CATECHOLAMINES ============
    let targetCatecholamines = 0.25;
    targetCatecholamines += drivers.painStimulus * 0.25;
    targetCatecholamines += drivers.epiLoad * 0.35;

    if (v.spo2 < 90) {
      targetCatecholamines += (90 - v.spo2) * 0.015;
    }
    if (v.paco2 > 50) {
      targetCatecholamines += (v.paco2 - 50) * 0.008;
    }
    if (v.ph < 7.30) {
      targetCatecholamines += (7.30 - v.ph) * 1.5;
    }

    targetCatecholamines *= (1 - drivers.betaBlockerEffect * 0.6);
    targetCatecholamines = Math.max(0, Math.min(1, targetCatecholamines));
    v.catecholamines += (targetCatecholamines - v.catecholamines) * dt * 0.08;

    // ============ CORONARY PERFUSION ============
    // HCM has HIGHER O2 demand due to thick walls
    // Also has reduced coronary reserve
    const perfusionPressure = v.dbp - v.lvedp;
    const hrPenalty = v.hr > 80 ? (v.hr - 80) * 0.007 : 0; // More sensitive to HR
    const thicknessPenalty = 0.1; // Baseline reduction due to wall thickness
    v.coronaryPerfusion = Math.max(0, Math.min(1,
      perfusionPressure / 65 - hrPenalty - thicknessPenalty
    ));

    // ============ ISCHEMIA ============
    // HCM is MORE prone to ischemia than DCM
    // Thick walls, high O2 demand, reduced reserve
    const ischemiaThreshold = 0.55; // Higher threshold (more vulnerable)
    if (v.coronaryPerfusion < ischemiaThreshold) {
      const ischemiaRate = (ischemiaThreshold - v.coronaryPerfusion) * 0.15;
      v.ischemiaIndex += ischemiaRate * dt * this.ISCHEMIA_RATE;
    } else if (v.ischemiaIndex > 0) {
      v.ischemiaIndex -= 0.008 * dt;
    }

    // Tachycardia increases O2 demand, worsening ischemia
    if (v.hr > 100) {
      v.ischemiaIndex += (v.hr - 100) * 0.001 * dt;
    }

    v.ischemiaIndex = Math.max(0, Math.min(1, v.ischemiaIndex));

    // ============ ARRHYTHMIA RISK ============
    // HCM has HIGH baseline arrhythmia risk
    let arrhythmiaRisk = 0.15; // Higher baseline than DCM

    // Ischemia is a major trigger
    arrhythmiaRisk += v.ischemiaIndex * 0.4;

    // Catecholamines trigger arrhythmias
    arrhythmiaRisk += v.catecholamines * 0.25;

    // Acidosis
    if (v.ph < 7.30) {
      arrhythmiaRisk += (7.30 - v.ph) * 2.5;
    }

    // Hypoxia
    if (v.spo2 < 85) {
      arrhythmiaRisk += (85 - v.spo2) * 0.025;
    }

    // Severe LVOTO can trigger arrhythmias
    if (v.lvotGradient > 80) {
      arrhythmiaRisk += (v.lvotGradient - 80) * 0.005;
    }

    v.arrhythmiaRisk = Math.max(0, Math.min(1, arrhythmiaRisk));

    return v;
  }
}
