import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Snapcast, SnapControl } from './snapcontrol.ts';

function client(id) {
    return {
        id, connected: true, host: { name: id }, snapclient: {},
        config: { name: id, volume: { muted: false, percent: 30 } }, lastSeen: {}
    };
}

function group(id, ids, stream_id = 'old', muted = false) {
    return { id, clients: ids.map(client), stream_id, muted };
}

function status(groups) {
    return {
        groups, server: { host: {}, snapserver: {} },
        streams: ['old', 'new'].map(id => ({
            id, status: 'playing', uri: { query: {} }
        }))
    };
}

function setup(t, groups, respond) {
    const sent = [];
    class Socket {
        static OPEN = 1;
        readyState = 1;
        send(data) {
            const request = JSON.parse(data);
            sent.push(request);
            if (respond) queueMicrotask(() => {
                const response = respond(request);
                this.onmessage({ data: JSON.stringify({ jsonrpc: '2.0', id: request.id, ...response }) });
            });
        }
        close() { this.readyState = 3; }
    }
    t.mock.method(console, 'debug', () => {});
    t.mock.property(globalThis, 'WebSocket', Socket);
    const control = new SnapControl();
    control.connect('ws://test');
    control.server = new Snapcast.Server(status(groups));
    t.after(() => control.disconnect());
    return { control, sent };
}

test('switches singleton and confirms the server status', async t => {
    const { control, sent } = setup(t, [group('one', ['a'])], request => ({
        result: request.method === 'Server.GetStatus'
            ? { server: status([group('one', ['a'], 'new')]) } : { stream_id: 'new' }
    }));
    await control.assignClient('a', 'new');
    assert.deepEqual(sent.map(({ method, params }) => ({ method, params })), [
        { method: 'Group.SetStream', params: { id: 'one', stream_id: 'new' } },
        { method: 'Server.GetStatus', params: undefined }
    ]);
});

test('detaches only the selected client and uses the returned group ID', async t => {
    const { control, sent } = setup(t, [group('original', ['a', 'b', 'c'])], request => {
        if (request.method === 'Group.SetClients')
            return { result: { server: status([group('original', ['b', 'c']), group('created', ['a'])]) } };
        if (request.method === 'Server.GetStatus')
            return { result: { server: status([group('original', ['b', 'c']), group('created', ['a'], 'new')]) } };
        return { result: { stream_id: 'new' } };
    });
    await control.assignClient('a', 'new');
    assert.deepEqual(sent[0].params, { id: 'original', clients: ['b', 'c'] });
    assert.deepEqual(sent[1].params, { id: 'created', stream_id: 'new' });
    assert.equal(control.server.getGroup('original').stream_id, 'old');
});

test('does not split a client already on the requested source', async t => {
    const { control, sent } = setup(t, [group('one', ['a', 'b'], 'new')]);
    await control.assignClient('a', 'new');
    assert.equal(sent.length, 0);
});

test('does not change stream when detaching is rejected', async t => {
    const { control, sent } = setup(t, [group('one', ['a', 'b'])],
        () => ({ error: { code: -1, message: 'Cannot detach' } }));
    await assert.rejects(control.assignClient('a', 'new'), /Cannot detach/);
    assert.equal(sent.length, 1);
});

test('reports partial success when the source switch fails after detaching', async t => {
    const { control } = setup(t, [group('one', ['a', 'b'])], request =>
        request.method === 'Group.SetClients'
            ? { result: { server: status([group('one', ['b']), group('two', ['a'])]) } }
            : { error: { message: 'Source unavailable' } });
    await assert.rejects(control.assignClient('a', 'new'),
        /Source unavailable.*already left its previous group/);
});

test('preserves mute before detaching from a muted group', async t => {
    const { control, sent } = setup(t, [group('one', ['a', 'b'], 'old', true)], request => {
        if (request.method === 'Group.SetClients' || request.method === 'Server.GetStatus') {
            const moved = group('two', ['a'], request.method === 'Server.GetStatus' ? 'new' : 'old');
            moved.clients[0].config.volume.muted = true;
            return { result: { server: status([group('one', ['b'], 'old', true), moved]) } };
        }
        return { result: {} };
    });
    await control.assignClient('a', 'new');
    assert.equal(sent[0].method, 'Client.SetVolume');
    assert.deepEqual(sent[0].params, { id: 'a', volume: { muted: true, percent: 30 } });
    assert.equal(sent[1].method, 'Group.SetClients');
    assert.equal(control.server.getClient('a').config.volume.muted, true);
});

for (const [description, changedGroups] of [
    ['membership changes', [group('one', ['a', 'c'], 'old', true), group('other', ['b'])]],
    ['the client moves to another group', [group('other', ['a', 'b'], 'old', true)]],
    ['the group source changes', [group('one', ['a', 'b'], 'new', true)]],
    ['the group is unmuted', [group('one', ['a', 'b'], 'old', false)]],
    ['the client disappears', [group('one', ['b'], 'old', true)]]
]) {
    test(`does not detach if ${description} while muting`, async t => {
        const { control, sent } = setup(t, [group('one', ['a', 'b'], 'old', true)], () => {
            control.server.fromJson(status(changedGroups));
            return { result: {} };
        });
        await assert.rejects(control.assignClient('a', 'new'),
            /grouping changed.*client was muted/);
        assert.deepEqual(sent.map(request => request.method), ['Client.SetVolume']);
    });
}

test('rejects on disconnect instead of hanging', async t => {
    const { control } = setup(t, [group('one', ['a'])]);
    const assignment = control.assignClient('a', 'new');
    control.disconnect();
    await assert.rejects(assignment, /disconnected/);
});

test('reports confirmed mute and detachment if the connection is lost during the source switch', async t => {
    const { control } = setup(t, [group('one', ['a', 'b'], 'old', true)], request => {
        if (request.method === 'Group.SetClients')
            return { result: { server: status([group('one', ['b'], 'old', true), group('two', ['a'])]) } };
        if (request.method === 'Group.SetStream')
            control.disconnect();
        return { result: {} };
    });
    await assert.rejects(control.assignClient('a', 'new'),
        /disconnected.*already left its previous group.*client was muted/);
});

test('rejects a timed-out request and ignores its late response', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { control, sent } = setup(t, [group('one', ['a'])]);
    const assignment = control.assignClient('a', 'new');
    t.mock.timers.tick(10001);
    await assert.rejects(assignment, /did not respond/);
    control.connection.onmessage({ data: JSON.stringify({ id: sent[0].id, result: {} }) });
    assert.equal(control.server.getGroup('one').stream_id, 'old');
});

test('does not switch a group if server regrouping left multiple clients together', async t => {
    const { control, sent } = setup(t, [group('one', ['a', 'b'])],
        () => ({ result: { server: status([group('one', ['a', 'b'])]) } }));
    await assert.rejects(control.assignClient('a', 'new'), /grouping changed/);
    assert.equal(sent.length, 1);
});

test('does not report success when the server keeps the old source', async t => {
    const { control } = setup(t, [group('one', ['a'])], request => ({
        result: request.method === 'Server.GetStatus' ? { server: status([group('one', ['a'])]) } : {}
    }));
    await assert.rejects(control.assignClient('a', 'new'), /did not confirm/);
});
