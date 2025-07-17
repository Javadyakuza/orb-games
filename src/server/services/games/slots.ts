import { getGameSetting } from "@/server/controllers/settings/game-setting";
import {
  SlotsGameParams,
  SlotsGameResponse,
  SlotsSetting,
  Stop,
} from "@/server/models/custom/games";

export async function playSlotsGame(
  params: SlotsGameParams
): Promise<SlotsGameResponse> {
  const final_result: [Stop, Stop, Stop] = [
    params.stops[Math.floor(Math.random() * params.stops.length)],
    params.stops[Math.floor(Math.random() * params.stops.length)],
    params.stops[Math.floor(Math.random() * params.stops.length)],
  ];

  const won =
    final_result[0].element === final_result[1].element &&
    final_result[1].element === final_result[2].element;

  let payout = 0;
  if (won) {
    const winningElement = final_result[0].element;
    const multiplier =
      params.payouts.find((val) => val.element == winningElement)?.payout || 1;
    payout = params.amount * multiplier;
  }

  return {
    won,
    final_result,
    payout,
  };
}
