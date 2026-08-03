[![Build Status](https://github.com/mtgatool/mtgatool-desktop/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/mtgatool/mtgatool-desktop/actions/workflows/build.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

<p align="center">
  <img width="200" height="200" src="https://github.com/Manuel-777/MTG-Arena-Tool-Metadata/raw/master/icon.png"><br>
  <b><h1>MTG Arena Tool</h1></b>
</p>

MTG Arena Tool is a collection browser, a deck tracker and a statistics manager. Explore which decks you played against and what other players are brewing. MTG Arena Tool is all about improving your Magic Arena experience.

### Install on macOS

Download the latest `.dmg` from the downloads page and drag the app to
`/Applications` as usual, then run this **once** in a terminal:

```
xattr -dr com.apple.quarantine "/Applications/MTG Arena Tool.app"
```

This is a one time setup. macOS quarantines anything downloaded from the
internet, and refuses to launch a quarantined app that isn't signed with a paid
Apple Developer ID — the app is killed on start. The command above clears that
flag.

It also matters for the deck tracker specifically. Reading the MTGA game process
needs the `com.apple.security.cs.debugger` entitlement, which macOS only honours
once the app is allowed to run normally. Skip this step and the tracker still
starts, but Settings will report that it can't read MTGA's memory and you'll be
limited to log-based data.

You do **not** need to run the app with `sudo`.

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

**Make sure you are using node 15+ and npm 7+**

If swtching node versions is an issue you can use [nvm](https://github.com/nvm-sh/nvm) (there's a [Windows versiion](https://github.com/coreybutler/nvm-windows) too!)


Before running you will need to install some packages globally;

```npm install -g foreman @craco/craco```

Once installed you can proceed installing the app's packages;

```npm install```


To run the desktop app in development mode (with hot module reloading enabled)

```npm start```

To do the same, but for the web use:

```npm start:web```

You can use the app in localhost:3006 (we use this port to avoid conflicts with the electron version at port 3000)


Build is rather straightforward for both web and desktop;

```npm run build```

```npm run build:web```

#### Developing on macOS

The memory reader needs the debugger entitlement, which lives in a code
signature — packaged builds get it from the `afterPack` hook
(`scripts/after-pack-macos.js`), but the Electron binary you run in dev mode
does not. Sign it once after `npm install`:

```
codesign -s - -f --deep --entitlements entitlements.mac.plist \
  node_modules/electron/dist/Electron.app
```

Without this the reader fails and Settings reports it can't read MTGA's memory.
Re-run it whenever Electron is reinstalled. Do **not** add `--options runtime`:
an ad-hoc signature plus the hardened runtime makes Electron's bundled dylibs
fail library validation, and it dies with `SIGTRAP` on launch.

## License

[GPLv3](./LICENSE.md)

## Contact
You can find me at any of these;

[Twitter](https://twitter.com/MEtchegaray7)

[Discord](https://discord.gg/K9bPkJy)

[mtgatool@gmail.com](mailto:mtgatool@gmail.com)
