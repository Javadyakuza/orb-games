import type { NextApiRequest, NextApiResponse } from "next";
import { Address, Dictionary } from "@ton/core";
import { GameSetting, GameType } from "@/server/models/custom/games";
import {
  addNewGameSetting,
  getGameSetting,
  updateGameSetting,
} from "@/server/controllers/settings/game-setting";
import { addUser, getUser, updateUser } from "@/server/controllers/users/user";
import { Users } from "@/server/models/db/users";
import { getTxHIstories } from "@/server/controllers/transactions/tx-history";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "GET") {
    let { wallet_address } = req.query;

    try {
      let address: string = wallet_address as string;
      if (!address) {
        return res
          .status(400)
          .json({ error: "Invalid or missing parameter", address });
      }
      let tx_histories = await getTxHIstories(address);

      if (tx_histories.code === 200) {
        return res.status(200).json(tx_histories.message);
      } else {
        return res.status(tx_histories.code).json(tx_histories.message);
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Invalid or missing parameter", error_msg: error });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
