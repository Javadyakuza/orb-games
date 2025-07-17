import type { NextApiRequest, NextApiResponse } from "next";
import { getGamesHistory } from "@/server/controllers/games/game-history";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "GET") {
    // returning the requested game settings
    let { wallet_address } = req.query;

    try {
      let addr: string = wallet_address as string;
      if (!wallet_address) {
        return res
          .status(400)
          .json({ error: "Invalid or missing parameter", addr });
      }

      let games_history = await getGamesHistory(addr);
      if (games_history.code === 200) {
        return res.status(200).json(games_history.message);
      } else {
        return res.status(games_history.code).json(games_history.message);
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
