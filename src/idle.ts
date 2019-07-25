import { getIdleTime } from "@paulcbetts/system-idle-time";
import { EventEmitter } from "events";

const Idle = function(seconds: number) {
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
};

Idle.prototype.on = function(event: any, callback: any) {
  this.emitter.on(event, callback);
};

Idle.prototype.dispose = function() {
  clearInterval(this.intervalId);
};

export default Idle;
