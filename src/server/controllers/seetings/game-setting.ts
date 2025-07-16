import { supabase } from "@/server/middleware/supabase";
import {
  ErrorResponse,
  SuccessResponse,
} from "@/server/models/custom/response";
import { GameSetting, GameType } from "@/server/models/custom/games";
import { gameSettingSelector } from "@/server/models/db/game_settings";

async function getGameSetting(
  gt: GameType
): Promise<GameSetting | ErrorResponse> {
  const { data, error } = await supabase
    .from("games_settings")
    .select(gameSettingSelector().game_settings().game_type().build())
    .eq("game_type", gt)
    .single();

  if (error) {
    return { code: error.code, message: error.message };
  }

  if (!data.game_settings && !data.game_type) {
    return {
      code: "404",
      message: `Game setting for type ${gt} not found.`,
    };
  }

  return data.game_settings as GameSetting;
}

async function updateGameSetting(
  new_gt: GameSetting
): Promise<ErrorResponse | SuccessResponse> {
  const { error } = await supabase
    .from("games_settings")
    .update(new_gt)
    .eq("game_type", new_gt.gameType);

  if (error) {
    return { code: error.code, message: error.message };
  }

  return {
    code: "200",
    message: "Game setting updated successfully.",
  };
}

export { getGameSetting, updateGameSetting };
