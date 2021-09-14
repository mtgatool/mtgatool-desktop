## Project structure

The project runs under a (create-react-app)[https://create-react-app.dev/] + typescript + electron.

We use eslint and prettier for style enforcement, please install those plugins for your code editor if you plan to contribute!



The structure is quite straightforward, but some considerations to better understand what is going on under the hood:

The app runs 3 main "processes", in the form of electron windows, that are always-on:

### Background
Code lives under `src/background/`

Its started on index running `backgroundChannelListeners`, then initiates the worker at `src/background/worker.ts`


This is where all the heavy stuff happens, mostly log parsing. The background process then sends messages to the other processes trough a BroadcastChannel. I choose BroadcastChannel over IPC to avoid the complexity and bottlenecks of electron's IPC, that gave us some issues when we were working on v5, having to control messages in the main process as a relay between them was very painful.


