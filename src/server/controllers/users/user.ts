import { supabase } from "@/server/middleware/supabase";
import { Response } from "@/server/models/custom/response";
import { Users, usersSelector } from "@/server/models/db/users";

async function getUser(wallet_address: string): Response<Users> {
  //   fetching the user from the database
  const { data, error } = await supabase
    .from("users")
    .select(usersSelector().balance().telegram_id().wallet_address().build())
    .eq("wallet_address", wallet_address)
    .single();
  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  if (!data) {
    return {
      code: 404,
      message: `User with wallet address ${wallet_address} not found.`,
    };
  }
  return {
    code: 200,
    message: data as Users,
  };
}

async function updateUser(new_user: Users): Response<Users> {
  //   updating the user in the database
  const { error } = await supabase
    .from("users")
    .update(new_user)
    .eq("wallet_address", new_user.wallet_address);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  return {
    code: 200,
    message: "User updated successfully.",
  };
}

async function updateUserBalance(
  new_balance: number,
  wallet_address: string
): Response<Users> {
  //   updating the user balance in the database
  const { error } = await supabase
    .from("users")
    .update({ balance: new_balance })
    .eq("wallet_address", wallet_address);

  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }
  return {
    code: 200,
    message: "User balance updated successfully.",
  };
}
async function addUser(user: Users): Response<Users> {
  //   adding a new user to the database
  const { error } = await supabase.from("users").insert(user);
  if (error) {
    return { code: convertCode(error.code), message: error.message };
  }

  return {
    code: 200,
    message: "User added successfully.",
  };
}

export { getUser, updateUser, addUser, updateUserBalance };
