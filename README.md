[![Build Status](https://travis-ci.org/mtgatool/mtgatool-desktop.svg?branch=master)](https://travis-ci.org/mtgatool/mtgatool-desktop)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

<p align="center">
  <img width="200" height="200" src="https://github.com/Manuel-777/MTG-Arena-Tool-Metadata/raw/master/icon.png"><br>
  <b><h1>MTG Arena Tool</h1></b>
</p>

MTG Arena Tool is a collection browser, a deck tracker and a statistics manager. Explore which decks you played against and what other players are brewing. MTG Arena Tool is all about improving your Magic Arena experience.

***THIS IS PRELIMINARY, NOT FULLY TESTED version 6***.

Things are still unfinished, bugs will probably happen. Use at your own risk.

### Run from source
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
