// Just a list of all the routes in the app for Sentry
const routes = [
  { path: "/" },
  { path: "/auth" },
  { path: "/home" },
  { path: "/timeline" },
  { path: "/drafts" },
  { path: "/decks/:id" },
  { path: "/decks" },
  { path: "/match/:id" },
  { path: "/aggregator" },
  { path: "/history/:id" },
  { path: "/history" },
  { path: "/explore/:event" },
  { path: "/explore" },
  { path: "/collection/:query" },
  { path: "/collection" },
  { path: "/user/:id" },
  { path: "/user" },
];

export default routes;
