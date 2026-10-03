{
  pkgs,
  lib,
  fetchurl,
  appimageTools,
}:
let
  version = "6.7.5";
  pname = "mtgatool-desktop";

  src = fetchurl {
    url = "https://github.com/mtgatool/${pname}/releases/download/v${version}/${pname}-${version}.AppImage";
    hash = "sha256-xNw8oT1BYmmsq861pIZsOBdj1hh0G32d5gJBwMwlJiY=";
  };
in
appimageTools.wrapType2 {
  inherit pname version src;

  meta = {
    homepage = "https://mtgatool.com/";
    downloadPage = "https://github.com/mtgatool/${pname}/releases/tag/v${version}";
    changelog = "https://mtgatool.com/release-notes";
    description = "MTG Arena Tool is a collection browser, a deck tracker and a statistics manager. Explore which decks you played against and what other players are brewing. MTG Arena Tool is all about improving your Magic Arena experience.";
    license = lib.licenses.gpl3;
    platforms = [ "x86_64-linux" ];
  };
}