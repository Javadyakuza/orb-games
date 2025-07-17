import { GameHistory } from "@/server/models/db/game_history";
import { Response } from "@/server/models/custom/response";
import { supabase } from "@/server/middleware/supabase";

async function getGameHistory(): Response<GameHistory> {
  //   fetching the game history from the database
}

async function updateGameHistory(new_gh: GameHistory): Response<GameHistory> {
  // updating the game history in the database
  const { error } = await supabase
    .from("game_history")
    .update(new_gh)
    .eq("game_hash", new_gh.game_hash);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  return {
    code: 200,
    message: "Game history updated successfully.",
  };
}

async function addGameHistory(gh: GameHistory): Response<GameHistory> {
  // checking if the game was already initiated

  // adding a new game history to the database
  const { error } = await supabase.from("game_history").insert(gh);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  return {
    code: 200,
    message: "Game history initiated successfully.",
  };
}

export { getGameHistory, updateGameHistory, addGameHistory };
