/** Best-of-three Caroms playtest: alternate the break between rack winners.
 * The 2024 manuscript establishes a one-ball opening break but does not
 * specify later rack order. Alternating is a provisional fair-play choice.
 */
export function caromsBreaker(rackWins) {
 if(!Array.isArray(rackWins)||rackWins.length!==2||
    rackWins.some(n=>!Number.isInteger(n)||n<0))
  throw new RangeError('Expected two nonnegative rack-win totals');
 return (rackWins[0]+rackWins[1])%2;
}
