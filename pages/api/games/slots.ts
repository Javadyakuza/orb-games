import { runSlotsGame } from "@/server/controllers/games/slots";
import { FortuneWheelReq, SlotsReq } from "@/server/models/custom/games";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * @swagger
 * /api/slots:
 *   post:
 *     summary: Run a slots game
 *     description: Executes the slots game logic and returns the result.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SlotsReq'
 *     responses:
 *       200:
 *         description: Game executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbols:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["🍒", "🍒", "🍋"]
 *                 result:
 *                   type: string
 *                   example: "win"
 *                 reward:
 *                   type: number
 *                   example: 20
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
