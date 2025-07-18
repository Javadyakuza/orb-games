import type { NextApiRequest, NextApiResponse } from "next";
import { addUser, getUser, updateUser } from "@/server/controllers/users/user";
import { Users } from "@/server/models/db/users";


/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Fetch user by wallet address
 *     description: Returns user data based on the given wallet address query parameter.
 *     parameters:
 *       - name: wallet_address
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "addr_test1q..."
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *
 *   post:
 *     summary: Add a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User successfully added
 *       400:
 *         description: Invalid user data
 *
 *   put:
 *     summary: Update an existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User successfully updated
 *       400:
 *         description: Invalid user update data
 *       404:
 *         description: User not found
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
      return res.status(400).json({
        error: "Invalid or missing user adding parameters",
        error_msg: error,
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
