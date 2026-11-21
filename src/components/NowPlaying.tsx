import { CardMedia, Stack, Typography } from '@mui/material';
import { Snapcast } from '../snapcontrol';
import logo from '../assets/logo192.png';

export default function NowPlaying({ metadata }: { metadata?: Snapcast.Metadata }) {
  if (!metadata) {
    return null;
  }

  const station = metadata.name?.trim();
  const title = metadata.title?.trim() || station || "Unknown Title";
  const artist = metadata.artist?.map(value => value.trim()).filter(Boolean).join(', ') || (station !== title ? station : undefined);

  return (
    <Stack spacing={2} direction="row" sx={{ alignItems: "center" }}>
      <CardMedia
        component="img"
        sx={{ width: 48 }}
        image={metadata.artUrl || logo}
        alt={title + " cover"}
      />
      <Stack spacing={0} direction="column" sx={{ justifyContent: "center", flexGrow: 1, overflow: 'hidden' }}>
        <Typography noWrap variant="subtitle1" align="left">
          {title}
        </Typography>
        {artist && <Typography noWrap variant="body1" align="left">
          {artist}
        </Typography>}
      </Stack>
    </Stack>
  );
}
