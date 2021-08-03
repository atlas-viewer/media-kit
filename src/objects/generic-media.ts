import { MediaAdapter } from './media-adapter';
import { MediaEvents } from '../types/media-events';
import mitt, { Emitter, Handler } from 'mitt';

export class GenericMedia implements MediaAdapter {
  isLoaded: boolean;
  isPlaying: boolean;
  private currentTime: number;
  emitter: Emitter<MediaEvents>;

  constructor() {
    this.isLoaded = true;
    this.isPlaying = false;
    this.currentTime = 0;
    this.emitter = mitt();
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  isBuffering(): boolean {
    return false;
  }

  load(withMedia?: boolean): Promise<void> {
    return Promise.resolve(undefined);
  }

  off<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void {
    this.emitter.off(type, handler);
  }

  on<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void {
    this.emitter.on(type, handler);
  }

  pause(): void {
    this.isPlaying = false;
    this.emitter.emit('pause', { time: this.getCurrentTime() });
  }

  play(): void {
    this.isPlaying = true;
    this.emitter.emit('play', { time: this.getCurrentTime() });
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  syncClock(time: number): void {
    this.currentTime = time;
  }
}
