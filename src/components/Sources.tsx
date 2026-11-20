import { Box, Card, Stack, Typography } from '@mui/material';
import { Snapcast, SnapControl } from '../snapcontrol';
import NowPlaying from './NowPlaying';
import PlayerLink from './PlayerLink';
import PlaybackControls from './PlaybackControls';
import SourceClients from './SourceClients';

function playbackStatus(stream: Snapcast.Stream): string {
  switch (stream.properties.playbackStatus) {
    case 'playing': return 'Playing';
    case 'paused': return 'Paused';
    case 'stopped': return 'Stopped';
  }
  switch (stream.status) {
    case 'playing': return 'Playing';
    case 'idle': return 'Idle';
    case 'disabled': return 'Disabled';
    default: return stream.status || 'Unknown';
  }
}

export default function Sources({ server, snapcontrol, showOffline }: { server: Snapcast.Server, snapcontrol: SnapControl, showOffline: boolean }) {
  return (
    <Box sx={{ m: 1.5 }}>
      {server.streams.length === 0 && <Typography>No sources available.</Typography>}
      {server.streams.map(stream => (
        <Card key={stream.id} sx={{ p: 2, my: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <Stack>
                <Typography variant="h6">{stream.getName()}</Typography>
                {stream.getName() !== stream.id && <Typography variant="caption" color="text.secondary">{stream.id}</Typography>}
                <Typography color="text.secondary">{playbackStatus(stream)}</Typography>
              </Stack>
              <PlaybackControls stream={stream} snapcontrol={snapcontrol} />
            </Stack>
            <PlayerLink value={stream.uri.query.player_url} showMissing />
            <NowPlaying metadata={stream.properties.metadata} />
            <SourceClients stream={stream} server={server} snapcontrol={snapcontrol} showOffline={showOffline} />
          </Stack>
        </Card>
      ))}
    </Box>
  );
}
