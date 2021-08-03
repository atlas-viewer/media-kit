import { MediaAdapter } from '../objects/media-adapter';
import { GenericMedia } from '../objects/generic-media';

export class HTMLAudio extends GenericMedia implements MediaAdapter {
  src: string;
  $el: HTMLAudioElement;
  mediaSyncMarginSecs: number;

  constructor(
    src: string | HTMLAudioElement,
    options: {
      crossOrigin?: string;
      mediaSyncMarginSecs?: number;
      preload?: string;
      instance?: ($el: HTMLAudioElement, obj: HTMLAudio) => void;
    } = {}
  ) {
    super();
    this.isLoaded = false;
    if (typeof src === 'string') {
      this.src = src;
      this.$el = document.createElement('audio');
    } else {
      this.src = src.src;
      this.$el = src;
    }
    this.mediaSyncMarginSecs = options.mediaSyncMarginSecs || 1;
    this.$el.crossOrigin = options.crossOrigin || 'anonymous';
    this.$el.preload = options.preload || 'metadata';
    if (options.instance) {
      options.instance(this.$el, this);
    }
    this.$el.addEventListener('loadedmetadata', () => {
      this.isLoaded = true;
      this.emitter.emit('load');
    });

    // Register events.
    this.$el.addEventListener('play', () => {
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.emitter.emit('play', { time: this.$el.currentTime });
      }
    });

    this.$el.addEventListener('pause', () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.emitter.emit('pause', { time: this.$el.currentTime });
      }
    });

    this.$el.src = this.src;
    this.$el.pause();
  }

  getElement(): HTMLAudioElement {
    return this.$el;
  }

  getCurrentTime(): number {
    return this.$el.currentTime;
  }

  isBuffering(): boolean {
    return this.$el.readyState < 3;
  }

  async load(withMedia?: boolean): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (withMedia) {
      this.$el.load();
    }

    await new Promise<void>((resolve) => {
      this.$el.addEventListener('loadedmetadata', () => {
        resolve();
      });
    });
  }

  pause(): void {
    this.isPlaying = false;
    this.$el.pause();
    this.emitter.emit('pause', { time: this.$el.currentTime });
  }

  play(): void {
    this.isPlaying = true;
    this.$el.play();
    this.emitter.emit('play', { time: this.$el.currentTime });
  }

  setCurrentTime(time: number): void {
    this.$el.currentTime = time;
  }

  syncClock(time: number): void {
    if (Math.abs(this.$el.currentTime - time) > this.mediaSyncMarginSecs) {
      this.$el.currentTime = time;
    }
  }
}
