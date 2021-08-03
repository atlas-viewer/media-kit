import { Handler } from 'mitt';
import { MediaEvents } from '../types/media-events';

export interface MediaAdapter {
  getCurrentTime(): number;
  setCurrentTime(time: number): void;
  isLoaded: boolean;
  isPlaying: boolean;
  load(withMedia?: boolean): Promise<void>;
  syncClock(time: number): void;
  pause(): void;
  play(): void;
  isBuffering(): boolean;
  on<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void;
  off<Key extends keyof MediaEvents>(type: Key, handler: Handler<MediaEvents[Key]>): void;
}
