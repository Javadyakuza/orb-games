import { getGameSetting } from "@/server/controllers/settings/game-setting";
import {
  SlotsGameParams,
  SlotsGameResponse,
  SlotsSetting,
} from "@/server/models/custom/games";

export async function playSlotsGame(
  params: SlotsGameParams
): Promise<SlotsGameResponse> {


  return 1 as any;
}
