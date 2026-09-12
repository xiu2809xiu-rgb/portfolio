/* Sign check for the compass needle. Pure maths, no browser needed. */
const headingTo = (fx, fz, dx, dz) => {
  const len = Math.hypot(dx, dz) || 1;
  const tx = dx / len, tz = dz / len;
  return Math.atan2(fx * tz - fz * tx, fx * tx + fz * tz);
};
const deg = (r) => +((r * 180) / Math.PI).toFixed(1);
/* Angles are equal modulo a full turn: -180 and +180 both point straight down,
   and atan2 returns the negative one only because of signed zero. */
const sameAngle = (a, b) => {
  const d = Math.abs(((a - b + 540) % 360) - 180);
  return d < 0.05;
};

/* Car facing +Z (its nose). With the chase camera looking along +Z, the car's
   right hand side is world -X — the convention the steering already uses. */
const F = [0, 1];
const cases = [
  ['target dead ahead  (0, +10)', [0, 10], 0, 'needle up'],
  ['target behind      (0, -10)', [0, -10], 180, 'needle down'],
  ['target to the RIGHT (-10, 0)', [-10, 0], 90, 'needle right'],
  ['target to the LEFT  (+10, 0)', [10, 0], -90, 'needle left'],
  ['ahead and right    (-10,+10)', [-10, 10], 45, 'needle up-right'],
];
let bad = 0;
for (const [label, [dx, dz], want, meaning] of cases) {
  const got = deg(headingTo(F[0], F[1], dx, dz));
  const ok = sameAngle(got, want);
  if (!ok) bad += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label} -> ${got}deg (want ${want}, ${meaning})`);
}

/* And once the car has turned 90 degrees to its own right, a target that was
   dead ahead must now read as being on its left. */
const turnedRight = [-1, 0]; // nose now points world -X
const got = deg(headingTo(turnedRight[0], turnedRight[1], 0, 10));
const ok = sameAngle(got, -90);
if (!ok) bad += 1;
console.log(`${ok ? 'OK  ' : 'FAIL'} after turning right, old target reads ${got}deg (want -90)`);

console.log(bad ? `\n${bad} FAILED` : '\nall heading cases pass');
process.exit(bad ? 1 : 0);
