```js
const $el = document.create('audio');
$el.src = 'http://example.org/music.mp3';

const media = new Media('http://example.org/music.mp3');
media.source({
  play: $el.play.bind($el),
  pause: $el.pause.bind($el),
  ...
})

$el.addEventListener('play', () => {
  media.dispatch('play');
});

$el.addEventListener('pause', () => {
  media.dispatch('pause');
});
...

$el.addEventListener('loadedmetadata', () => {
  media.dispatch('loadedmetadata');
  media.setDuration($el.duration);
})

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
