import { Media } from '../objects/media';

export type TrackStop = {
  identifier?: string;
  media: Media;
  source: {
    start: number;
    end: number;
  };

  target: {
    start: number;
    end: number;
  };
};
