/** 左隣 / 表示中 / 右隣の 3 枚で組む横トラック */
export type FeatureTrackPosition = -1 | 0 | 1;

export type FeatureTrackSlot = {
  id: number;
  imageIndex: number;
  position: FeatureTrackPosition;
};

export function wrapIndex(index: number, length: number) {
  return length > 0 ? ((index % length) + length) % length : 0;
}

export function createFeatureTrack(length: number): FeatureTrackSlot[] {
  if (length <= 1) {
    return [{ id: 0, imageIndex: 0, position: 0 }];
  }

  return ([-1, 0, 1] as FeatureTrackPosition[]).map((position, id) => ({
    id,
    imageIndex: wrapIndex(position, length),
    position,
  }));
}

/**
 * 送り出したスロットだけを逆側へ回す。表示位置に来るスロットは id も画像も
 * そのまま残るため、切り替えの瞬間に再マウントによる空白（点滅）が起きない。
 * 逆側へ回るスロットは画面外にいるので、画像の差し替えは見えない。
 */
export function settleFeatureTrack(
  slots: FeatureTrackSlot[],
  centerImageIndex: number,
  direction: 1 | -1,
  length: number
): FeatureTrackSlot[] {
  return slots.map((slot) => {
    const shifted = slot.position - direction;
    const position = (
      shifted < -1 ? 1 : shifted > 1 ? -1 : shifted
    ) as FeatureTrackPosition;

    return {
      ...slot,
      position,
      imageIndex: wrapIndex(centerImageIndex + position, length),
    };
  });
}
