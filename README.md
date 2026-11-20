# Snapweb

Web client for [Snapcast](https://github.com/snapcast/snapcast), optimized for
mobile devices, with the look and feel of
[Snapdroid](https://github.com/snapcast/snapdroid)

## Develop

Use Node.js 24 or newer. Run the client-assignment regression tests with
`npm test` (Node's experimental TypeScript transformation is used).

1. Add your snapserver host as a local environment var
    ```bash
    echo 'VITE_APP_SNAPSERVER_HOST = localhost:1780' > .env.local
    ```
1. Install dependencies
    ```bash
    npm ci
    ```
1. Run local web server and watcher
    ```bash
    npm run dev
    ```

## Build for production

1. Install dependencies: `npm ci`
1. Build: `npm run build`
1. Copy the created `dist` directory to some path on your snapserver host and
   let the `[http] doc_root` in your `snapserver.conf` point to it
1. Restart `snapserver` and navigate with a browser to
   `http://<snapserver host>:1780`
1. Enjoy :)

Prebuilt versions can be downloaded as zip archive or debian package in [Releases](https://github.com/snapcast/snapweb/releases).

## Source player links

The Sources tab lists Snapserver streams and their live title, artist and artwork,
using the same metadata as the Sinks tab. Metadata requires a source that provides
it, for example through a stream control script.

Each source shows its playback status and, when supported, previous, play/pause,
and next controls. Unsupported actions are disabled. The Sinks tab also provides
an "Open player" link for its selected source when a player URL is configured.
Player links open in a new tab; playback controls act directly through Snapserver.

Sources also list their assigned clients, marking muted and (when "Show offline
clients" is enabled) disconnected clients. "Assign client" moves one client to
that source. If it belongs to a multi-client group, the dialog warns before
detaching it; the other clients keep their source. When leaving a muted group,
the moved client stays muted (using its individual mute setting). A failed or interrupted
assignment displays an error. Because detaching and changing the source are
separate server operations, check grouping before retrying a failed assignment.

Radio metadata uses the station name when artist information is missing.
To give a source a friendly label, append a URL-encoded `display_name` parameter,
for example `&display_name=Music%201`. It appears in both tabs and source
selectors; the stream ID (`name`) remains unchanged. As with `player_url`, this
is a convention of this fork and requires a Snapserver restart, not a rebuild.

Add a URL-encoded `player_url` query parameter to a source in the `[stream]`
section of `snapserver.conf` to link to its player interface:

```ini
source = pipe:///tmp/snap-mpd1?name=player1&controlscript=meta_mpd.py&controlscriptparams=--mpd-port%3D6601&player_url=http%3A%2F%2F192.168.1.10%3A8081%2F
```

`player_url` is a convention used by this Snapweb fork, not a built-in Snapcast
setting. Snapserver exposes it in the stream URI through its API. Preserve all
existing source parameters and restart Snapserver after changing its configuration;
no Snapweb rebuild is needed. URLs must be absolute HTTP or HTTPS URLs reachable
by the device running Snapweb; do not use `localhost` for remote devices. Sources
without a URL display "No player URL configured"; invalid URLs display an error
instead of a clickable link. The links are public to anyone who can access
Snapserver, so do not include credentials. `VITE_APP_SOURCE_URLS` is no longer used.

## Setup as WebApp

On Android open `http://<snapserver host>:1780` in Chrome and select in the menu
`Add to homescreen`

## Screenshot

Screenshot is taken on a Pixel 7 emulation in Chrome DevTools

![Snapweb-Dark](https://raw.githubusercontent.com/snapcast/snapweb/master/snapweb_dark.png#gh-dark-mode-only)
![Snapweb-Light](https://raw.githubusercontent.com/snapcast/snapweb/master/snapweb_light.png#gh-light-mode-only)

## Contributing

Since my time and my web development skills are limited, pull requests are
highly appreciated. Please check the list of
[open issues](https://github.com/snapcast/snapweb/issues).\
Branch from the `develop` branch and ensure it is up to date with the current
`develop` branch before submitting your pull request.

High prio issues:

- Missing opus support [#8](https://github.com/snapcast/snapweb/issues/8)
- Missing Vorbis support [#14](https://github.com/snapcast/snapweb/issues/14)
