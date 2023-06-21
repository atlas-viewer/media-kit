# Media Kit

**This repository is in early development**

Test-driven approach
- Primary focus points:
	- Syncing time
	- Reliable and easy events
	- Seamless "virtual" tracks
- Ideas for virtual tracks
	- Adding removing static images from DOM
	- Changing position of viewport/annotation
	- Non-time based, using scroll position

### React ideas

A time-based component
```jsx
function MyTimeBasedThing() {
  const { time, percent } = useTimeline({ freq: 1/60, duration: 5 });

  if (percent < 0.5) {
    return <div>A</div>
  }
  return <div>B</div>
}
```

Or with keyframes
```jsx
function MyKeyFrameThing() {
  const { time, currentStop } = useTimeline({ stops: [5, 10, 15], duration: 60 })
  // .. only renders when transitioning past 5, 10 and 15
}
```

And composed when rendering:

```jsx
<MediaKit.Provider player={player}>
  {/* Custom source allows some time-warping, shifting on the timeline */}
  <MediaKit.CustomSource start={0} end={2.5} speed={2}>
    <MyTimeBasedThing />
  </MediaKit.CustomSource>
</MediaKit.Provider/>
```

Custom player UI:
```jsx

function Controls() {
  const { play, pause, nextTrack, prevTrack } = usePlayerControls();
  const { isPlaying, getTime } = usePlayerState();
  // Element.innerText will be formatted time (avoid re-renders)
  const timeRef = useTimeRef();
  // Click on el will go to % of width
  // Also css variable with percentage will be set, for styling
  const scrubberRef = useScrubberRef();

  return (
    <div>
      <CurrentTime ref={timeRef} />
      <Scrubber ref={scrubberRef} />
    </div>
  );
}
```

When mixing React and Non-React sources:
- Before the provider is created - you should know basic information about what you want to play, like the duration.
- Once you have this empty temporal space, anything under the provider can add to the timeline (interactively)
- You can also add non-React elements with the player API (such as audio) and have components that control the player API itself - and not directly with the audio elements.
- When react components mount, they will be added to the player instance - they will also be added contextually (warping)
- Dev tools can then be used to still visualise the input on a timeline. 

## Prev notes

# Media Kit

**This repository is in early development**


```js
const $el = document.create('audio');
$el.src = 'http://example.org/music.mp3';

const media = new MediaKit.HTMLAudio('http://example.org/music.mp3');

const track = new Track();

track.addMedia(media, {
  source: {
    start: 0,
    end: 20,
  },
  target: {
    start: 0,
    end: 20,
  }
})

track.addMedia(media, {
  source: {
    start: 40,
    end: 60,
  },
  target: {
    start: 20,
    end: 40,
  }
});

track.play();
track.pause();
track.seekTo(24);

const sequence = new Sequence();

sequence.addTrack(track);

sequence.play();
sequence.pause();
sequence.seekTo(24);
sequence.next();
sequence.previous();


const composition = new Composition(sequence); // or new Composition(track), or new Composition(media), or new Composition([track, media, track]); which will create a sequence internally.

composition.addSection(0, 20);

composition.addSection(25, 30);
composition.addSection(25, 30);
composition.addSection(25, 30);

composition.addSection(0, 20, 1); // targeting first index 1 of the sequence internally.

composition.play();
composition.pause();
composition.seekTo(24);
```



JSX API (idea)

```js
import { h } from '@atlas-viewer/media-kit';

const sequence = (
    <audio-sequence>
        <audio src="https://example.org/track1.mp3" />
        <audio src="https://example.org/track2.mp3" />
        <audio src="https://example.org/track3.mp3" />
    </audio-sequence>
);

const timeline = (
  <audio-sequence>
    <audio src="https://example.org/track1.mp3" start="0" duration="60" />
    <audio src="https://example.org/track2.mp3" start="60" duration="60"/>
    <audio src="https://example.org/track3.mp3" start="120" duration="60"/>
  </audio-sequence>
);

const gaps = (
  <audio-sequence>
    <audio src="https://example.org/track1.mp3" start="0" duration="60" />
    <gap duration="5" />
    <audio src="https://example.org/track2.mp3" start="60" duration="60"/>
    <gap duration="5" />
    <audio src="https://example.org/track3.mp3" start="120" duration="60"/>
  </audio-sequence>
);

const parallel = (
  <audio-sequence>
    <mix>
      <audio src="https://example.org/track1.mp3" start="0" duration="60" />
      <audio src="https://example.org/track2.mp3" start="0" duration="60" />
    </mix>
    <audio src="https://example.org/track3.mp3" start="60" duration="60" />
  </audio-sequence>
);
```

With integration with custom timeline elements.

```js
// Only run once.
const CustomSource = defineSource({
    create() {
        return document.createElement('div');
    },
    clear(el) {
        el.innerText = '';
    },
    render(el, data) {
        el.innerText = data.text;
    }, 
    timestops: [
        { start: 0, end: 10, data: { text: 'Some transcription' } },
        { start: 10, end: 20, data: { text: 'Some other transcription' } },
    ],
});

const player = (
  <audio-sequence>
    <mix>
      <CustomSource start="0" duration="20" />
      <audio src="https://example.org/track1.mp3" start="0" duration="20" />
    </mix>
  </audio-sequence>
);

document.appendChild(player);

// Has the same API as an HTMLAudioElement
player.play();
player.pause();
player.currentTime;
```

```html
<!-- At 1 second, the following HTML would be produced: -->
<audio-sequence> <!-- a web component wrapper -->
    <div>Some transcription</div> <!-- our "CustomSource" we created -->
    <audio src="https://example.org/track1.mp3" /> <!-- the native HTML audio -->
</audio-sequence>
```

