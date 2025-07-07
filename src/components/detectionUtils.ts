// Minimal stub for InstrumentDebounce used in useInstrumentDetection.ts
// Trigger clean build: cache bust comment
export class InstrumentDebounce {
  shouldTrigger(_instrument: string): boolean {
    return true;
  }
}
