import { Alert, Link, Typography } from '@mui/material';

export default function PlayerLink({ value, label, showMissing = false }: { value?: string, label?: string, showMissing?: boolean }) {
  if (value === undefined) {
    return showMissing ? <Typography color="text.secondary">No player URL configured</Typography> : null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return <Alert severity="error">Invalid player_url: an absolute HTTP or HTTPS URL is required.</Alert>;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return <Alert severity="error">Invalid player_url: only HTTP and HTTPS URLs are supported.</Alert>;
  }

  return (
    <Link href={url.href} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
      {label || value}
    </Link>
  );
}
