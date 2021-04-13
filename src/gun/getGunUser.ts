import { GunUserChain } from "../types/gunTypes";

export default function getGunUser(): GunUserChain | undefined {
  const userRef = window.gun.user() as GunUserChain;

  if (userRef && (userRef as any).is) {
    return userRef;
  }

  return undefined;
}
