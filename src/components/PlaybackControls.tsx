import { IconButton, Stack } from '@mui/material';
import { PlayArrow, Pause, SkipPrevious, SkipNext } from '@mui/icons-material';
import { Snapcast, SnapControl } from '../snapcontrol';

export default function PlaybackControls({ stream, snapcontrol }: { stream: Snapcast.Stream, snapcontrol: SnapControl }) {
  const properties = stream.properties;
  if (!properties.canControl) {
    return null;
  }
  const playing = properties.playbackStatus === 'playing';

  return (
    <Stack direction="row" sx={{ justifyContent: "center", alignItems: "center" }}>
      <IconButton aria-label="Previous" disabled={!properties.canGoPrevious} onClick={() => snapcontrol.control(stream.id, 'previous')}>
        <SkipPrevious />
      </IconButton>
      <IconButton aria-label={playing ? 'Pause' : 'Play'} disabled={playing ? !properties.canPause : !properties.canPlay} onClick={() => snapcontrol.control(stream.id, playing ? 'pause' : 'play')}>
        {playing ? <Pause /> : <PlayArrow />}
      </IconButton>
      <IconButton aria-label="Next" disabled={!properties.canGoNext} onClick={() => snapcontrol.control(stream.id, 'next')}>
        <SkipNext />
      </IconButton>
    </Stack>
  );
}
