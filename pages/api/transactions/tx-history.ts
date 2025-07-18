import type { NextApiRequest, NextApiResponse } from "next";

import { getTxHIstories } from "@/server/controllers/transactions/tx-history";

/**
 * @swagger
 * /api/tx-history:
 *   get:
 *     summary: Fetch transaction history for a wallet address
 *     description: Retrieves the transaction history associated with a provided wallet address.
 *     parameters:
 *       - name: wallet_address
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "addr_test1q..."
 *     responses:
 *       200:
 *         description: Transaction history successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tx_hash:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Bad request due to missing or invalid wallet address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing parameter"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

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
