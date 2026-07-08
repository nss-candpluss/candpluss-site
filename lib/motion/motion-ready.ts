type MotionReadyListener = (motionRevision: number) => void;

let motionRevision = 0;
const listeners = new Set<MotionReadyListener>();

export function getMotionRevision(): number {
  return motionRevision;
}

export function notifyMotionReady(): void {
  motionRevision += 1;

  for (const listener of listeners) {
    listener(motionRevision);
  }
}

export function subscribeMotionReady(listener: MotionReadyListener): () => void {
  listeners.add(listener);
  listener(motionRevision);

  return () => {
    listeners.delete(listener);
  };
}
