import type { NextApiRequest, NextApiResponse } from "next";
import { Address, Dictionary } from "@ton/core";
import { GameSetting, GameType } from "@/server/models/custom/games";
import {
  addNewGameSetting,
  getGameSetting,
  updateGameSetting,
} from "@/server/controllers/settings/game-setting";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "GET") {
    // returning the requested game settings
    let { game_type } = req.query;
    try {
      let gt: GameType = game_type as GameType;
      if (!gt) {
        return res
          .status(400)
          .json({ error: "Invalid or missing game type", game_type });
      }
      let game_setting = await getGameSetting(gt);
      if (game_setting.code === 200) {
        return res.status(200).json(game_setting.message);
      } else {
        return res.status(game_setting.code).json(game_setting.message);
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Invalid or missing game type", error_msg: error });
    }
  } else if (req.method == "PUT") {
    let game_setting = req.body;
    try {
      let gs: GameSetting = game_setting as GameSetting;
      if (!gs) {
        return res
          .status(400)
          .json({ error: "Invalid or missing game setting", game_setting });
      }
      let response = await updateGameSetting(gs);

      if (response.code === 200) {
        return res.status(200).json(response.message);
      } else {
        return res.status(response.code).json(response.message);
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Invalid or missing game setting", error_msg: error });
    }
  } else if (req.method == "POST") {
    let game_setting = req.body;
    try {
      let gs: GameSetting = game_setting as GameSetting;
      if (!gs) {
        return res
          .status(400)
          .json({ error: "Invalid or missing game setting", game_setting });
      }

      let response = await addNewGameSetting(gs);

      if (response.code === 200) {
        return res.status(200).json(response.message);
      } else {
        return res.status(response.code).json(response.message);
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Invalid or missing game setting", error_msg: error });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
