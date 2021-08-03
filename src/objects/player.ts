import { MediaAdapter } from './media-adapter';
import { MediaEvents } from '../types/media-events';
import { Handler } from 'mitt';

export class Player implements MediaAdapter {
  object: MediaAdapter;
  isPlaying = false;
  isLoaded = false;
  _isBuffering = false;
  currentTimeMs = 0;
  clockStart = 0;
  clock: number | undefined;

  constructor(object: MediaAdapter) {
    this.object = object;

    this.object.on('play', () => {
      if (!this.isPlaying) {
        this.play();
      }
    });

    this.object.on('pause', () => {
      if (this.isPlaying) {
        this.pause();
      }
    });
  }

  syncClock(time: number): void {
    // @todo This is a clock provider, how would that work?
  }

  update = (timeStep: number): void => {
    const delta = timeStep - this.clockStart;
    this.clockStart = timeStep;
    if (!this.object.isBuffering()) {
      if (this._isBuffering) {
        this._isBuffering = false;
        this.currentTimeMs = this.object.getCurrentTime();
      } else {
        this.currentTimeMs += delta;
        this.object.syncClock(this.currentTimeMs / 1000);
      }
    }

    this.clock = requestAnimationFrame(this.update);
  };

  play(): void {
    this.isPlaying = true;
    this.currentTimeMs = this.object.getCurrentTime() * 1000;
    this.clockStart = performance.now();
    this.clock = requestAnimationFrame(this.update);
    this.object.play();
    this._isBuffering = this.object.isBuffering();
  }

  pause(): void {
    // When we pause, we need to stop our clock and the media, if it's not stopped already.
    if (this.clock) {
      cancelAnimationFrame(this.clock);
    }
    this.isPlaying = false;
    this.object.pause();
  }

  getCurrentTime(): number {
    // @todo we will have our own internal source of truth for this value
    return 0;
  }

  isBuffering(): boolean {
    return this.object.isBuffering();
  }

  load(withMedia?: boolean): Promise<void> {
    return this.object.load(withMedia);
  }

  off<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void {
    this.object.off(type, handler);
  }

  on<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void {
    this.object.on(type, handler);
  }

  setCurrentTime(time: number): void {
    this.object.setCurrentTime(time);
  }
}
