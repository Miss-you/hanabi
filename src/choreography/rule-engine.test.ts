import { describe, it, expect } from "vitest";
import { RuleEngine, MusicContext } from "@/choreography/RuleEngine";
import { AudioEvent } from "@/core/types";
import { TUNING } from "@/config/tuning";

describe("RuleEngine", () => {
  it("fires the finale rule near track end", () => {
    const engine = new RuleEngine();
    const duration = 100;
    const currentTime = duration - TUNING.ruleEngine.finale.remainingSeconds + 1;
    const event: AudioEvent = {
      type: "bass",
      launchTime: currentTime - 0.2,
      explodeTime: currentTime,
      isClimax: true,
      targetY: 200,
      energy: TUNING.ruleEngine.finale.minEnergy + 0.1,
    };
    const context: MusicContext = {
      currentTime,
      currentEvent: event,
      currentSection: null,
      beatInfo: null,
      duration,
      screenWidth: 1200,
      screenHeight: 800,
      recentEvents: [event],
    };

    const commands = engine.evaluate(context);

    expect(commands).toHaveLength(1);
    expect(commands[0]?.pattern).toBe("finale");
    expect(commands[0]?.params.targetY).toBeCloseTo(
      800 * TUNING.ruleEngine.finale.targetY,
      5,
    );
  });
});
