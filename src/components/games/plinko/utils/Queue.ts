/**
 * Queue utility for Plinko payout button animations
 * Simplified version without jQuery dependency
 */

export default class Queue {
  private queue: Array<() => void> = [];
  private running = false;

  add(item: () => void) {
    this.queue.push(item);
    if (!this.running) {
      this.run();
    }
  }

  private run() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;
    const item = this.queue.shift();
    if (item) {
      item();
      // Run next item after a short delay
      setTimeout(() => this.run(), 10);
    }
  }

  // Public method for manual queue processing
  public processQueue() {
    if (!this.running) {
      this.run();
    }
  }
}
