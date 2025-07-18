import { runBtcPredictionGame } from "@/server/controllers/games/btc-pred";
import { BtcPredReq } from "@/server/models/custom/games";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/btc-pred:
 *   post:
 *     summary: Run a BTC prediction game round
 *     description: Executes game logic based on provided prediction parameters for BTC.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BtcPredReq'
 *     responses:
 *       200:
 *         description: BTC prediction game executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: "win"
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
      let gd: BtcPredReq = game_data as BtcPredReq;
      if (!gd) {
        return res
          .status(400)
          .json({ error: "Invalid or missing btc pred game params", gd });
      }

      let response = await runBtcPredictionGame(gd);

      if (response.code === 200) {
        return res.status(200).json(response.message);
      } else {
        return res.status(response.code).json(response.message);
      }
    } catch (error) {
      return res.status(400).json({
        error: "Invalid or missing btc pred game parameters",
        error_msg: error,
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
