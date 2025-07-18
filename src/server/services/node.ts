import { OpenedContract } from "@ton/core";
import { fileSystemLogger } from "./helpers";
import { TonClient, WalletContractV5R1 } from "@ton/ton";
import {
  DepositEvent,
  Escrow,
  loadDepositEvent,
  loadWithdrawEvent,
  WithdrawEvent,
} from "../../../build/Escrow/Escrow_Escrow";
import { contractAddresses } from "../models/constants";
import { TonApiClient } from "@ton-api/client";
import { getTonApiClient, getTonCenterClient } from "../middleware/tonClient";
import { getUser, updateUserBalance } from "../controllers/users/user";
import { Users } from "../models/db/users";
import { addTxHistory } from "../controllers/transactions/tx-history";
import {
  extendedDepositEvent,
  extendedWithdrawEvent,
} from "../models/custom/events";

async function catchPigShopEvents(
  escrowContract: OpenedContract<Escrow>,
  tonCenterClient: TonClient,
  tonAPiClient: TonApiClient,
  after_lt?: bigint
) {
  console.log("➡️ starting to get the escrow events");
  fileSystemLogger.log("➡️ starting to get the escrow events");
  console.log("🔍 Listen address:", contractAddresses.escrow.toString());
  fileSystemLogger.log(
    "🔍 Listen address:",
    contractAddresses.escrow.toString()
  );
  console.log("📌 Last known lt:", after_lt?.toString());
  fileSystemLogger.log("📌 Last known lt:", after_lt?.toString());
  fileSystemLogger.log("📌 Last known lt:", after_lt?.toString());

  const txs = await tonAPiClient.blockchain.getBlockchainAccountTransactions(
    contractAddresses.escrow,
    {
      limit: after_lt ? 10 : 1,
      after_lt,
    }
  );

  if (txs && txs.transactions.length === 0) {
    console.log("⚠️ No new transactions found");
    fileSystemLogger.log("⚠️ No new transactions found");
    return after_lt;
  }
  console.log("📦 Transactions fetched:", txs.transactions.length);
  fileSystemLogger.log("📦 Transactions fetched:", txs.transactions.length);

  let events: Array<extendedWithdrawEvent | extendedDepositEvent | undefined> =
    [];

  for (const tx of txs.transactions) {
    console.log("🔁 Processing transaction:", tx.hash);
    fileSystemLogger.log("🔁 Processing transaction:", tx.hash);

    if (!tx.computePhase?.success || !tx.actionPhase?.success || tx.aborted) {
      console.log("🚫 Skipped aborted or failed tx:", tx.hash);
      fileSystemLogger.log("🚫 Skipped aborted or failed tx:", tx.hash);
      continue;
    }

    if (tx.inMsg?.rawBody === undefined) {
      console.log("⚠️ Skipped tx with no body:", tx.hash);
      fileSystemLogger.log("⚠️ Skipped tx with no body:", tx.hash);
      continue;
    }

    for (const msg of tx.outMsgs) {
      console.log(
        "💬 Out message:",
        Object.entries(Escrow.opcodes).find(
          ([key, value]) => BigInt(value) === msg.opCode
        )?.[0]
      );
      fileSystemLogger.log(
        "💬 Out message:",
        Object.entries(Escrow.opcodes).find(
          ([key, value]) => BigInt(value) === msg.opCode
        )?.[0]
      );

      try {
        if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(Escrow.opcodes.WithdrawEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadWithdrawEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected withdraw event ");
          fileSystemLogger.log("✅ Detected withdraw event ");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(Escrow.opcodes.DepositEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadDepositEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected deposit event");
          fileSystemLogger.log("✅ Detected deposit event");
        }
      } catch (e) {
        console.log("❌ Error decoding message:", msg.decodedOpName, e);
        fileSystemLogger.log(
          "❌ Error decoding message:",
          msg.decodedOpName,
          e
        );
        continue;
      }
    }
  }
  console.log("the parsed events are", events);
  fileSystemLogger.log("the parsed events are", events);
  if (!after_lt) {
    const nextLt = txs.transactions[txs.transactions.length - 1].lt;
    console.log(
      "⏭️Not processing the old event and Returning next lt:",
      nextLt.toString()
    );
    fileSystemLogger.log(
      "⏭️ ⏭️Not processing the old event and Returning next lt:",
      nextLt.toString()
    );

    return nextLt;
  }

  for (const event of events) {
    if (event && event.user) {
      console.log("📍 Processing event for user:", event.user.toString());
      fileSystemLogger.log(
        "📍 Processing event for user:",
        event.user.toString()
      );

      const userAddr = event.user.toRawString();
      let user = await getUser(userAddr);

      if (event.$$type === "WithdrawEvent") {
        console.log("🛠️ Handling withdraw event");
        fileSystemLogger.log("🛠️ Handling withdraw event");

        // decreasing the user balance
        await updateUserBalance(
          userAddr,
          Number(BigInt((user.message as Users).balance) - event.amount)
        );

        // adding the transaction to the history
        await addTxHistory({
          tx_hash: event.tx_hash,
          wallet_address: userAddr,
          deposit: false,
          amount: Number(event.amount),
        });
      }

      if (event.$$type === "DepositEvent") {
        console.log("🛠️ Handling deposit event");
        fileSystemLogger.log("🛠️ Handling deposit event");

        // increasing the user balance
        await updateUserBalance(
          userAddr,
          Number(BigInt((user.message as Users).balance) + event.amount)
        );

        // adding the transaction to the history
        await addTxHistory({
          tx_hash: event.tx_hash,
          wallet_address: userAddr,
          deposit: true,
          amount: Number(event.amount),
        });
      }
    } else {
      console.log("⚠️ No event with userAddress was detected");
      fileSystemLogger.log("⚠️ No event with userAddress was detected");
    }
  }

  const nextLt = txs.transactions[txs.transactions.length - 1].lt;
  console.log("⏭️ Returning next lt:", nextLt.toString());
  fileSystemLogger.log("⏭️ Returning next lt:", nextLt.toString());

  return nextLt;
}

export async function listenPigShopForever() {
  console.log("🔁 Starting to listen for PigShop events");
  fileSystemLogger.log("🔁 Starting to listen for PigShop events");
  try {
    let lastLt;

    const tc = getTonCenterClient();
    const tac = getTonApiClient();

    const escrow = tc.open(Escrow.fromAddress(contractAddresses.escrow));

    console.log("🏪 escrow contract opened at:", escrow.address.toString());
    fileSystemLogger.log(
      "🏪 escrow contract opened at:",
      escrow.address.toString()
    );

    while (true) {
      try {
        lastLt = await catchPigShopEvents(escrow, tc, tac, lastLt);

        // waiting for 1 second before checking the next lt
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error in listenPigShopForever:", error);
        fileSystemLogger.error("Error in listenPigShopForever:", error);
        console.log("restarting...");
        fileSystemLogger.log("restarting...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error("Error in listenPigShopForever:", error);
    fileSystemLogger.error("Error in listenPigShopForever:", error);
    console.log("restarting...");
    fileSystemLogger.log("restarting...");
  }
}
