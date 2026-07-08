[![Build Status](https://github.com/mtgatool/mtgatool-desktop/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/mtgatool/mtgatool-desktop/actions/workflows/build.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

<p align="center">
  <img width="200" height="200" src="https://github.com/Manuel-777/MTG-Arena-Tool-Metadata/raw/master/icon.png"><br>
  <b><h1>MTG Arena Tool</h1></b>
</p>

MTG Arena Tool is a collection browser, a deck tracker and a statistics manager. Explore which decks you played against and what other players are brewing. MTG Arena Tool is all about improving your Magic Arena experience.

### Install on Linux

On Linux systems you can use the .AppImage as-is, but the recommended installer takes care of setting up the desktop integrations; This is a one time setup.

Head to the downloads page and download the latest `mtgatool-desktop-linux-installer.tar.gz`

Navigate in terminal to the directory where the tar.gz was downloaded, then extract and install;
```
mkdir mtgatool &&
tar -xf mtgatool-desktop-linux-installer.tar.gz -C mtgatool &&
cd mtgatool &&
sudo ./install.sh
```

### Run from source

The desktop app is built with [Tauri](https://tauri.app), so you will need:

- Node 18+ and npm 9+
- A [Rust toolchain](https://rustup.rs) (stable)
- The [mtga-reader](https://github.com/mtgatool/mtga-reader) repository cloned as a sibling directory (`../mtga-reader`), used by the Tauri backend for memory reading
- The [tool-db](https://github.com/Manwe-777/tool-db) repository cloned as a sibling directory (`../tool-db`), with its packages built

Install the app's packages;

```npm install```

To run the desktop app in development mode (with hot module reloading enabled)

```npm run dev```

To do the same, but for the web use:

```npm run dev:web```

Note: MTG Arena runs elevated, so memory reading (ranks, collection, account)
only works when the app also runs with administrator permissions. The app
still works without it (log reading only).

Build is rather straightforward for both web and desktop;

```npm run build```

```npm run build:web```

## License

[GPLv3](./LICENSE.md)

## Contact
You can find me at any of these;

[Twitter](https://twitter.com/MEtchegaray7)

[Discord](https://discord.gg/K9bPkJy)

[mtgatool@gmail.com](mailto:mtgatool@gmail.com)
