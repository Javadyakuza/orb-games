import {
  FortuneWheelGameParams,
  FortuneWheelGameResponse,
} from "@/server/models/custom/games";

export async function playFortuneWheelGame(
  params: FortuneWheelGameParams
): Promise<FortuneWheelGameResponse> {
  if (params.multipliers.length === 0) {
    throw new Error("Multipliers array cannot be empty");
  }

  const randomIndex = Math.floor(Math.random() * params.multipliers.length);
  if (params.multipliers[randomIndex] !== 0) {
    return {
      won: false,
      final_multiplier: params.multipliers[randomIndex],
      multipliers_options: params.multipliers,
    };
  } else {
    return {
      won: true,
      final_multiplier: params.multipliers[randomIndex],
      multipliers_options: params.multipliers,
    };
  }
}
