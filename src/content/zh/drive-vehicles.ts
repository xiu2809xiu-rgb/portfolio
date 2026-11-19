import { vehicles as en, type Vehicle } from '../drive-vehicles';

/* Types and the default id come straight through; only the picker's words differ. */
export * from '../drive-vehicles';

const base = (id: string) => en.find((vehicle) => vehicle.id === id)!;

/**
 * The cars, in Chinese.
 *
 * Bodywork, tuning and engine note are spread in from the English list, so a car
 * drives and sounds the same whichever language it was picked in. What is
 * restated is the three lines the picker shows.
 *
 * The English names are body styles, not model names — "the hatch", "the van" —
 * so they are translated the same way: as the everyday word for that kind of
 * car, without inventing a badge for it.
 */
export const vehicles: readonly Vehicle[] = [
  {
    ...base('hatch'),
    name: '掀背车',
    blurb: '车身轻，前后悬短，变向干脆。',
    character: '机灵，好开。认路就选它。',
  },
  {
    ...base('van'),
    name: '面包车',
    blurb: '又高又方，看上去全是车顶。',
    character: '起步慢，刹停也慢。它倒挺自在。',
  },
  {
    ...base('roadster'),
    name: '敞篷跑车',
    blurb: '没车顶，风挡低，脑后什么都没有。',
    character: '这里最快的一辆，刹车也最狠。',
  },
  {
    ...base('pickup'),
    name: '皮卡',
    blurb: '驾驶室靠前，后面是货斗，装得下箱子。',
    character: '不紧不慢，稳稳当当。一路轰隆隆。',
  },
];

export function vehicleById(id: string | null | undefined): Vehicle {
  return vehicles.find((v) => v.id === id) ?? vehicles[0];
}
