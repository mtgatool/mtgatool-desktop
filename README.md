[![Build Status](https://github.com/mtgatool/mtgatool-desktop/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/mtgatool/mtgatool-desktop/actions/workflows/build.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

<p align="center">
  <img width="200" height="200" src="https://github.com/Manuel-777/MTG-Arena-Tool-Metadata/raw/master/icon.png"><br>
  <b><h1>MTG Arena Tool</h1></b>
</p>

MTG Arena Tool is a collection browser, a deck tracker and a statistics manager. Explore which decks you played against and what other players are brewing. MTG Arena Tool is all about improving your Magic Arena experience.

The MTGA tracker daemon can be found at https://github.com/frcaton/mtga-tracker-daemon.

### Install on Linux

On Linux systems you can use the .AppImage as-is, but the recommended installer takes care of setting up the desktop integrations and daemon services; This is a one time setup; After that both the daemon and mtgatool appimage can update automatically.

Head to the downloads page and download the latest `mtgatool-desktop-linux-installer.tar.gz`

Navigate in terminal to the directory where the tar.gz was downloaded, then extract and install; _(requires sudo to install the daemon service)_
```
mkdir mtgatool &&
tar -xf mtgatool-desktop-linux-installer.tar.gz -C mtgatool &&
cd mtgatool &&
sudo ./install.sh
```

You can check the mtga-tracker-daemon service status using systemctl;

```systemctl status mtga-trackerd.service```

Or simply [open a browser tab and try the api](http://localhost:6842/status)! You can find more information about it at [mtga-tracker-daemon](https://github.com/frcaton/mtga-tracker-daemon).



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

## License

[GPLv3](./LICENSE.md)

## Contact
You can find me at any of these;

[Twitter](https://twitter.com/MEtchegaray7)

[Discord](https://discord.gg/K9bPkJy)

[mtgatool@gmail.com](mailto:mtgatool@gmail.com)
