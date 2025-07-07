// Enhanced debounce system to prevent double triggering
export class InstrumentDebounce {
  private lastTriggerTimes: Map<string, number> = new Map();
  private debounceMs: number;
  
  constructor(debounceMs: number = 200) {
    this.debounceMs = debounceMs;
  }
  
  shouldTrigger(instrument: string): boolean {
    const now = Date.now();
    const lastTrigger = this.lastTriggerTimes.get(instrument) || 0;
    const timeSinceLastTrigger = now - lastTrigger;
    
    if (timeSinceLastTrigger >= this.debounceMs) {
      this.lastTriggerTimes.set(instrument, now);
      return true;
    }
    
    return false;
  }
  
  // Method to adjust debounce time for specific instruments
  setDebounceTime(debounceMs: number) {
    this.debounceMs = debounceMs;
  }
  
  // Method to clear debounce history (useful for testing)
  reset() {
    this.lastTriggerTimes.clear();
  }
}
