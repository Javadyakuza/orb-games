import {
  GameStatus,
  SlotsReq,
  SlotsSetting,
  SlotsSettingGameSettings,
  Stops,
} from "@/server/models/custom/games";
import { getGameSetting } from "../settings/game-setting";
import { Response } from "@/server/models/custom/response";
import { GameHistory } from "@/server/models/db/game_history";
import { toNano } from "@ton/core";
import { fastHashCode as hash } from "fast-hash-code";
import { addGameHistory, updateGameHistory } from "./game-history";
import { playSlotsGame } from "@/server/services/games/slots";
import { getUser, updateUserBalance } from "../users/user";
import { Users } from "@/server/models/db/users";

export async function runSlotsGame(
  slots_req: SlotsReq
): Promise<Response<GameHistory>> {
  // Get game settings
  const gameSettingResponse = await getGameSetting("slots");
  const gd = gameSettingResponse.message as SlotsSetting;
  let gs: SlotsSettingGameSettings = JSON.parse(String(gd.game_settings));

  let payout = Number(toNano(BigInt(slots_req.amount) * BigInt(gs.multiplier)));

  let game_hash = hash(
    slots_req.game_type + slots_req.wallet_address + String(payout),
    {
      seed: Date.now(),
    }
  ).toString();

  let init_res = await addGameHistory({
    wallet_address: slots_req.wallet_address,
    game_type: "slots",
    payout,
    status: GameStatus.INITIATED,
    game_hash,
    amount: slots_req.amount,
  });

  if (init_res.code !== 200) {
    return {
      code: convertCode(init_res.message as string),
      message: init_res.message as string,
    };
  }

  // calling the slots game service
  let slots_res = await playSlotsGame({
    amount: slots_req.amount,
    stops: gs.reel,
  });


  // updating the game history in the database
  let update_res = await updateGameHistory({
    game_hash,
    status: GameStatus.FINISHED,
    won: slots_res.won,
    payout: payout,
    wallet_address: slots_req.wallet_address,
    game_type: "slots",
    amount: slots_req.amount,
  });

  if (update_res.code !== 200) {
    return {
      code: convertCode(update_res.message as string),
      message: update_res.message as string,
    };
  }

  // updating the user balance
  let user_balance = (await getUser(slots_req.wallet_address))
    .message as Users;

  let new_balance = slots_res.won
    ? user_balance.balance + payout
    : user_balance.balance - Number(toNano(slots_req.amount));

  let update_user_res = await updateUserBalance(
    new_balance,
    slots_req.wallet_address
  );

  if (update_user_res.code !== 200) {
    return {
      code: convertCode(update_user_res.message as string),
      message: update_user_res.message as string,
    };
  }
  return {
    code: 200,
    message: {
      game_hash,
      wallet_address: slots_req.wallet_address,
      game_type: "slots",
      payout,
      status: GameStatus.FINISHED,
      game_result: JSON.parse(JSON.stringify(slots_res)),
      won: slots_res.won,
      amount: slots_req.amount,
    },
  };
  return 1 as any;
}
