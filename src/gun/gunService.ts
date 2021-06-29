import Gun from "gun/gun";
import Sea from "gun/sea";
// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
// eslint-disable-next-line import/no-unresolved
import { IGunCryptoKeyPair } from "gun/types/types";
// eslint-disable-next-line import/no-unresolved
import { IGunStaticSEA } from "gun/types/static/sea";

import { GunState } from "../types/gunTypes";

/**
 * This is a base for a central service to handle all Gun's stuff.
 * This is preliminary and not really meant to be actually used, but if it
 * simplifies the work of using Gun's graph, it should be implemented everywhere :)
 *
 * Currently making gun queries takes a lot of lines to get the user, check if a key exists, etc.
 * This should handle all of that in a structured way, maybe using promises and proper error codes.
 *
 * This could also handle writing to the user namespace without having to provide the epub, for example.
 */
export default class GunService {
  _gun: IGunChainReference<GunState> | undefined;

  _sea: IGunStaticSEA | undefined;

  _soul: string | undefined;

  _kvp: IGunCryptoKeyPair | undefined;

  _contructor() {
    this._gun = Gun<GunState>([
      "http://api.mtgatool.com:8765/gun",
      "https://gun-us.herokuapp.com/:8765/gun",
      // "mtgatool-gun-eqszq.ondigitalocean.app:8765/gun",
    ]);
    this._sea = Sea;
  }

  public login = (username: string, password: string) => {
    return new Promise((resolve, reject) => {
      this._gun?.user().auth(username, password, (data: any) => {
        if (data.err) reject(data.err);
        else {
          this._soul = data.soul;
          this._kvp = data.sea;
          resolve(data);
        }
      });
    });
  };

  public signup = (username: string, password: string) => {
    return new Promise((resolve, reject) => {
      this._gun?.user().create(username, password, (data: any) => {
        if (data.err) reject(data.err);
        else {
          this._soul = data.pub;
          resolve(data);
        }
      });
    });
  };

  public path = <T>(path: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      this._gun?.get(`${this._soul}/${path}`).once((data: any) => {
        if (data.err) reject(data.err);
        else {
          resolve(data);
        }
      });
    });
  };
}
