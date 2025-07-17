import { supabase } from "@/server/middleware/supabase";
import { Response } from "@/server/models/custom/response";
import {
  BtcPredSetting,
  FortuneWheelSetting,
  GameSetting,
  GameType,
  isBtcPredSetting,
  isFortuneWheelSetting,
  isSlotsSetting,
  SlotsSetting,
} from "@/server/models/custom/games";
import { gameSettingSelector } from "@/server/models/db/game_settings";

async function getGameSetting(gt: GameType): Response<GameSetting> {
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
    message: {
      game_type: gt,
      game_settings: isFortuneWheelSetting(data.game_settings as GameSetting)
        ? (data.game_settings as FortuneWheelSetting)
        : isBtcPredSetting(data.game_settings as GameSetting)
        ? (data.game_settings as BtcPredSetting)
        : isSlotsSetting(data.game_settings as GameSetting)
        ? (data.game_settings as SlotsSetting)
        : data.game_settings,
    },
  };
}

async function updateGameSetting(new_gt: GameSetting): Response<GameSetting> {
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

async function addNewGameSetting(new_gt: GameSetting): Response<GameSetting> {
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
