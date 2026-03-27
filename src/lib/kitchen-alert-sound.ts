/**
 * キッチン向けの短い通知音（ファイル不要・Web Audio API）。
 * 音量は控えめ。自動再生制限で鳴らない場合は静かに無視。
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new AC();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** @param variant `append` はやや低めで短く */
export function playKitchenAlertPing(variant: "new" | "append" = "new"): void {
  const ctx = getCtx();
  if (!ctx) return;

  const run = () => {
    const t0 = ctx.currentTime;
    const peak = variant === "append" ? 0.048 : 0.058;
    const freq = variant === "append" ? 740 : 920;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    osc.start(t0);
    osc.stop(t0 + 0.11);
  };

  void ctx.resume().then(run).catch(() => {});
}
