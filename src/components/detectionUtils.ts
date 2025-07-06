// Modular debounce utility for instrument detection
// Allows per-instrument and per-algorithm debounce config
import type { InstrumentType } from './instrumentConfig';

export interface DebounceConfig {
  minIntervalMs?: number; // default: 200ms
}

export class InstrumentDebounce {
  private lastHitTimes: Partial<Record<InstrumentType, number>> = {};
  private minIntervalMs: number;

  constructor(config?: DebounceConfig) {
    this.minIntervalMs = config?.minIntervalMs ?? 200;
  }

  shouldTrigger(instrument: InstrumentType): boolean {
    const now = Date.now();
    const last = this.lastHitTimes[instrument] ?? 0;
    const allowed = now - last >= this.minIntervalMs;
    if (allowed) {
      this.lastHitTimes[instrument] = now;
      // Debug: log allowed trigger
      // eslint-disable-next-line no-console
      console.log(`[Debounce] ALLOW instrument: ${instrument}, now: ${now}, last: ${last}, interval: ${this.minIntervalMs}`);
    } else {
      // Debug: log suppressed trigger
      // eslint-disable-next-line no-console
      console.log(`[Debounce] SUPPRESS instrument: ${instrument}, now: ${now}, last: ${last}, interval: ${this.minIntervalMs}`);
    }
    return allowed;
  }

  reset(instrument?: InstrumentType) {
    if (instrument) delete this.lastHitTimes[instrument];
    else this.lastHitTimes = {};
  }
}
