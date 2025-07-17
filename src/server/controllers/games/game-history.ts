import { GameHistory, gameHistorySelector } from "@/server/models/db/game_history";
import { supabase } from "@/server/middleware/supabase";
import { Response } from "@/server/models/custom/response";

async function getGamesHistory(wallet_address: string): Response<GameHistory> {
  //   fetching the games history from the database based on the wallet address of the user
  const { data, error } = await supabase
    .from("game_history")
    .select(gameHistorySelector().all().build())
    .eq("wallet_address", wallet_address)
    .single();

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  if (!data) {
    return {
      code: 404,
      message: `Game history for wallet address ${wallet_address} not found.`,
    };
  }

  return {
    code: 200,
    message: data as GameHistory,
  };
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

export { getGamesHistory, updateGameHistory, addGameHistory };
