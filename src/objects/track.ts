import { Media } from './media';
import { TrackStop } from '../types/track-stop';
import { MediaAdapter } from './media-adapter';
import { MediaEvents } from '../types/media-events';
import mitt, { Emitter, Handler, WildcardHandler } from 'mitt';

export class Track implements MediaAdapter {
  media: Media[] = [];
  currentStop: TrackStop | undefined;
  trackStops: Array<TrackStop> = [];
  isLoaded = false;
  isPlaying = false;
  emitter: Emitter<MediaEvents>;

  constructor() {
    this.emitter = mitt();
  }

  syncClock(time: number): void {
    // Find current track stop.
    const stop = this.findStop(time);

    if (!stop && this.currentStop) {
      this.currentStop.media.pause();
      return;
    }

    // If equal to current, pass the syncClock to the current
    if (stop === this.currentStop) {
      if (this.currentStop) {
        // @todo recalculate the time here.
        this.currentStop.media.syncClock(time - this.currentStop.target.start + this.currentStop.source.start);
      }
      return;
    }

    // Otherwise we need to change the media playing.
    if (stop) {
      this.goToStop(stop, time);
    }
  }

  goToStop(stop: TrackStop, trackTime: number): void {
    if (this.currentStop) {
      this.currentStop.media.pause();
    }

    const time = trackTime - stop.target.start + stop.source.start;
    // We need to set the time correctly on the new media.
    stop.media.play(time);
    this.currentStop = stop;
  }

  getCurrentTime(): number {
    if (!this.currentStop) {
      return 0;
    }

    // 50s
    const clockTime = this.currentStop.media.getCurrentTime();
    // 45s (start = 5s)
    const mediaTime = clockTime - this.currentStop.source.start;

    // 55s (target start = 10s)
    return this.currentStop.target.start + mediaTime;
  }

  isBuffering(): boolean {
    return this.currentStop ? this.currentStop.media.isBuffering() : false;
  }

  findStop(time: number): TrackStop | undefined {
    // Fallback to checking all stops.
    for (const stop of this.trackStops) {
      if (stop.target.start - 0.001 <= time && stop.target.end - 0.001 > time) {
        return stop;
      }
    }

    if (this.trackStops[this.trackStops.length - 1].target.end === time) {
      return this.trackStops[this.trackStops.length - 1];
    }

    return;
  }

  addMedia(
    media: Media,
    options: {
      identifier?: string;

      // Defaults to 0 and (target.end - target.start)
      source?: {
        start: number;
        end: number;
      };

      target: {
        start: number;
        end: number;
      };
    }
  ): void {
    const trackStop: TrackStop = {
      media,
      identifier: options.identifier,
      source: options.source || {
        start: 0,
        end: options.target.end - options.target.start,
      },
      target: {
        start: options.target.start,
        end: options.target.end,
      },
    };

    trackStop.media.on('play', () => {
      if (!this.isPlaying && this.currentStop === trackStop) {
        this.isPlaying = true;
        this.emitter.emit('play', { time: this.getCurrentTime() });
      }
    });

    trackStop.media.on('pause', () => {
      if (this.isPlaying && this.currentStop === trackStop) {
        this.isPlaying = false;
        this.emitter.emit('pause', { time: this.getCurrentTime() });
      }
    });

    this.trackStops.push(trackStop);

    if (this.media.indexOf(trackStop.media) === -1) {
      this.media.push(trackStop.media);
    }

    // @todo rules
    //   - Gaps are allowed
    //   - Overlapping is not allowed (use composition)
    // Example usage:
    //   - Stitching together tracks
    //   - Interlacing 2 sources
    //   - Reordering a source
    // Should still logically represent a track (virtually).
    // Ordered list of media tracks with targets
    // Computed map of [time]: Array<Actions>
    // Where action is:
    //    - Pause
    //    - Play
    //    - Seek
    //    - Silence (for gaps)
    // On a specific media item.
    //
    // For example, back to back audio might be pause(A), play(B)
    // Can be reduced further. If the same time has pause(A) play(A) then both can be removed.
    //
    // External influences:
    //  - Current media paused, should pause the track too
    //  - Current media playing, should play the track
  }

  async load(withMedia?: boolean): Promise<void> {
    await Promise.all(this.media.map((s) => s.load(withMedia)));
  }

  on<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void;
  on(type: '*', handler: WildcardHandler<MediaEvents>): void {
    this.emitter.on(type, handler);
  }

  off<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void;
  off(type: '*', handler: WildcardHandler<MediaEvents>): void {
    this.emitter.off(type, handler);
  }

  pause(): void {
    this.isPlaying = false;
    this.currentStop?.media.pause();
    this.emitter.emit('pause', { time: this.getCurrentTime() });
  }

  play(): void {
    this.isPlaying = true;
    this.currentStop?.media.play();
    this.emitter.emit('play', { time: this.getCurrentTime() });
  }

  setCurrentTime(time: number): void {
    this.syncClock(time);
  }
}
