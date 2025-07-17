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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "GET") {
    // returning the requested game settings
    let { wallet_address } = req.query;
    try {
      let address: string = wallet_address as string;
      if (!address) {
        return res
          .status(400)
          .json({ error: "Invalid or missing parameter", address });
      }
      let user = await getUser(address);
      if (user.code === 200) {
        return res.status(200).json(user.message);
      } else {
        return res.status(user.code).json(user.message);
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Invalid or missing parameter", error_msg: error });
    }
  } else if (req.method == "PUT") {
    let user_data = req.body;
    try {
      let user: Users = user_data as Users;

      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or missing user update parameters", user });
      }
      let response = await updateUser(user);

      if (response.code === 200) {
        return res.status(200).json(response.message);
      } else {
        return res.status(response.code).json(response.message);
      }
    } catch (error) {
      return res.status(400).json({
        error: "Invalid or missing user update parameters",
        error_msg: error,
      });
    }
  } else if (req.method == "POST") {
    let user_data = req.body;
    try {
      let user: Users = user_data as Users;
      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or missing user adding parameters", user });
      }

      let response = await addUser(user_data);

      if (response.code === 200) {
        return res.status(200).json(response.message);
      } else {
        return res.status(response.code).json(response.message);
      }
    } catch (error) {
      return res
        .status(400)
        .json({
          error: "Invalid or missing user adding parameters",
          error_msg: error,
        });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
