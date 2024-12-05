export default function getRankIndex16(_rank: string): number {
  let ii = 0;
  if (_rank == "Unranked") ii = 0;
  if (_rank == "Bronze") ii = 1;
  if (_rank == "Silver") ii = 2;
  if (_rank == "Gold") ii = 3;
  if (_rank == "Platinum") ii = 4;
  if (_rank == "Diamond") ii = 5;
  if (_rank == "Mythic") ii = 6;
  return ii;
}
