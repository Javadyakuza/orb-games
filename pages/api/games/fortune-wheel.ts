import { runBtcPredictionGame } from "@/server/controllers/games/btc-pred";
import { runFortuneWheelGame } from "@/server/controllers/games/fortune-wheel";
import { FortuneWheelReq } from "@/server/models/custom/games";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/fortune-wheel:
 *   post:
 *     summary: Run a fortune wheel game
 *     description: Executes the fortune wheel game logic using the request payload.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FortuneWheelReq'
 *     responses:
 *       200:
 *         description: Game executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prize:
 *                   type: string
 *                   example: "10 tokens"
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "POST") {
    let game_data = req.body;
    try {
      let gd: FortuneWheelReq = game_data as FortuneWheelReq;
      if (!gd) {
        return res
          .status(400)
          .json({ error: "Invalid or missing fortune wheel game params", gd });
      }

      let response = await runFortuneWheelGame(gd);

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
