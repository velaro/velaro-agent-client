import { getIdleTime } from "@paulcbetts/system-idle-time";
import { EventEmitter } from "events";

export default class Idle {
  public seconds: number;
  private isIdle: boolean;
  private emitter: EventEmitter;
  private intervalId: NodeJS.Timeout;

  constructor(seconds: number) {
    this.isIdle = false;
    this.seconds = seconds;
    this.emitter = new EventEmitter();

    this.intervalId = setInterval(() => {
      const idleTime = getIdleTime();

      const seconds = idleTime / 1000;

      if (this.isIdle === false && seconds > this.seconds) {
        this.isIdle = true;
        this.emitter.emit("idle");
      }

      if (this.isIdle === true && seconds < this.seconds) {
        this.isIdle = false;
        this.emitter.emit("active");
      }
    }, 10 * 1000);
  }

  public on(event: any, callback: any) {
    this.emitter.on(event, callback);
  }

  public dispose() {
    clearInterval(this.intervalId);
  }
}
