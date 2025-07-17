import { runBtcPredictionGame } from "@/server/controllers/games/btc-pred";
import { runFortuneWheelGame } from "@/server/controllers/games/fortune-wheel";
import { runSlotsGame } from "@/server/controllers/games/slots";
import { FortuneWheelReq, SlotsReq } from "@/server/models/custom/games";
import { playSlotsGame } from "@/server/services/games/slots";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "POST") {
    let game_data = req.body;
    try {
      let gd: SlotsReq = game_data as SlotsReq;
      if (!gd) {
        return res
          .status(400)
          .json({ error: "Invalid or missing fortune wheel game params", gd });
      }

      let response = await runSlotsGame(gd);

      if (response.code === 200) {
        return res.status(200).json(response.message);
      } else {
        return res.status(response.code).json(response.message);
      }
    } catch (error) {
      return res.status(400).json({
        error: "Invalid or missing fortune wheel game parameters",
        error_msg: error,
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
