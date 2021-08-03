import { MediaAdapter } from './media-adapter';
import mitt, { Emitter, Handler, WildcardHandler } from 'mitt';
import { MediaEvents } from '../types/media-events';

export class Media implements MediaAdapter {
  duration: number;
  mediaSyncMarginSecs: number;
  adapter: MediaAdapter;
  isPlaying: boolean;
  isLoaded: boolean;
  private emitter: Emitter<MediaEvents>;

  constructor(props: { duration: number; mediaSyncMarginSecs?: number; adapter: MediaAdapter }) {
    this.duration = props.duration;
    this.mediaSyncMarginSecs = props.mediaSyncMarginSecs || 1;
    this.adapter = props.adapter;
    this.emitter = mitt();
    this.isPlaying = false;
    this.isLoaded = props.adapter.isLoaded;

    this.adapter.on('load', () => {
      this.isLoaded = true;
    });

    // MediaAdapter -> Media events
    this.adapter.on('play', ({ time }) => {
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.emitter.emit('play', { time });
      }
    });

    this.adapter.on('pause', ({ time }) => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.emitter.emit('pause', { time });
      }
    });
  }

  setCurrentTime(time: number): void {
    this.adapter.setCurrentTime(time);
  }

  syncClock(time: number): void {
    if (time < 0) {
      this.adapter.setCurrentTime(0);
      this.adapter.pause();
      return;
    }

    if (time > this.duration) {
      this.adapter.setCurrentTime(this.duration);
      this.adapter.pause();
      return;
    }

    if (Math.abs(this.adapter.getCurrentTime() - time) > this.mediaSyncMarginSecs) {
      this.adapter.setCurrentTime(time);
    }
  }

  on<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void;
  on(type: '*', handler: WildcardHandler<MediaEvents>): void {
    this.emitter.on(type, handler);
  }

  off<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void;
  off(type: '*', handler: WildcardHandler<MediaEvents>): void {
    this.emitter.off(type, handler);
  }

  getCurrentTime(): number {
    return this.adapter.getCurrentTime();
  }

  load(withMedia?: boolean): Promise<void> {
    return this.adapter.load(withMedia);
  }

  stop(): void {
    this.pause();
    this.adapter.setCurrentTime(0);
  }

  pause(): void {
    this.isPlaying = false;
    this.adapter.pause();
    this.emitter.emit('pause', { time: this.adapter.getCurrentTime() });
  }

  play(time?: number): void {
    this.isPlaying = true;
    if (typeof time !== 'undefined') {
      this.adapter.setCurrentTime(time);
    }

    this.adapter.play();
    this.emitter.emit('play', { time: this.adapter.getCurrentTime() });
  }

  isBuffering(): boolean {
    return this.adapter.isBuffering();
  }
}
