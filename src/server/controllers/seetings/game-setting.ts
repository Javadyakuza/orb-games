import { supabase } from "@/server/middleware/supabase";
import {
  ErrorResponse,
  SuccessResponse,
} from "@/server/models/custom/response";
import { GameSetting, GameType } from "@/server/models/custom/games";
import { gameSettingSelector } from "@/server/models/db/game_settings";

async function getGameSetting<T = GameSetting>(
  gt: GameType
): Promise<SuccessResponse<T> | ErrorResponse<T>> {
  const { data, error } = await supabase
    .from("games_settings")
    .select(gameSettingSelector().game_settings().game_type().build())
    .eq("game_type", gt)
    .single();

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  if (!data.game_settings && !data.game_type) {
    return {
      code: 404,
      message: `Game setting for type ${gt} not found.`,
    };
  }

  return {
    code: 200,
    message: data.game_settings as T,
  };
}

async function updateGameSetting<T = GameSetting>(
  new_gt: GameSetting
): Promise<ErrorResponse<T> | SuccessResponse<T>> {
  const { error } = await supabase
    .from("games_settings")
    .update(new_gt)
    .eq("game_type", new_gt.game_type);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  return {
    code: 200,
    message: "Game setting updated successfully.",
  };
}

async function addNewGameSetting<T = GameSetting>(
  new_gt: GameSetting
): Promise<ErrorResponse<T> | SuccessResponse<T>> {
  const { error } = await supabase.from("games_settings").insert(new_gt);
  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  return {
    code: 200,
    message: "Game setting added successfully.",
  };
}
export { getGameSetting, updateGameSetting, addNewGameSetting };
