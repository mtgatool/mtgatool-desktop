export default function getRankIndex(_rank: string, _tier: number): number {
  let ii = 0;
  if (_rank == "Unranked") ii = 0;
  if (_rank == "Bronze") ii = 1 + (_tier - 1); // 1 2 3 4
  if (_rank == "Silver") ii = 5 + (_tier - 1); // 5 6 7 8
  if (_rank == "Gold") ii = 9 + (_tier - 1); // 9 0 1 2
  if (_rank == "Platinum") ii = 13 + (_tier - 1); // 3 4 5 6
  if (_rank == "Diamond") ii = 17 + (_tier - 1); // 7 8 9 0
  if (_rank == "Mythic") ii = 21;
  return ii;
}
