import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Snapcast, SnapControl } from '../snapcontrol';

export default function SourceClients({ stream, server, snapcontrol, showOffline }: {
  stream: Snapcast.Stream;
  server: Snapcast.Server;
  snapcontrol: SnapControl;
  showOffline: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clients = server.groups.flatMap(group => group.clients);
  const visible = clients.filter(client => showOffline || client.connected);
  const listeners = server.groups.filter(group => group.stream_id === stream.id)
    .flatMap(group => group.clients).filter(client => showOffline || client.connected);
  const candidates = visible.filter(client => !listeners.some(listener => listener.id === client.id));
  const group = server.groups.find(group => group.clients.some(client => client.id === clientId));
  const current = group && server.getStream(group.stream_id);
  const selected = clients.find(client => client.id === clientId);

  async function assign() {
    if (!selected || !group) {
      setError('The selected client is no longer available.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await snapcontrol.assignClient(clientId, stream.id);
      setOpen(false);
      setClientId('');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        Assigned clients: {listeners.length ? listeners.map(client =>
          client.getName() + (!client.connected ? ' (offline)' : client.config.volume.muted ||
            server.groups.some(group => group.muted && group.clients.some(member => member.id === client.id)) ? ' (muted)' : '')
        ).join(', ') : 'None'}
      </Typography>
      <Button sx={{ alignSelf: 'flex-start' }} disabled={candidates.length === 0} onClick={() => {
        setClientId('');
        setError('');
        setOpen(true);
      }}>Assign client</Button>
      <Dialog fullWidth open={open} onClose={() => { if (!busy) setOpen(false); }}>
        <DialogTitle>Assign client to {stream.getName()}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField select label="Client" value={candidates.some(client => client.id === clientId) ? clientId : ''} disabled={busy}
              onChange={event => { setClientId(event.target.value); setError(''); }}>
              {candidates.map(client => <MenuItem key={client.id} value={client.id}>
                {client.getName()}{!client.connected ? ' (offline)' : ''}
              </MenuItem>)}
            </TextField>
            {current && <Typography>Current source: {current.getName()}</Typography>}
            {group && group.clients.length > 1 && <Alert severity="warning">
              This client will leave its group. Other clients will keep their current source.
              {group.muted && ' This client will stay muted after moving.'}
            </Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy || !candidates.some(client => client.id === clientId)} onClick={assign}>
            {busy ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
