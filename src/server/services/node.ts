import { OpenedContract } from "@ton/core";
import { fileSystemLogger } from "./helpers";
import { TonClient, WalletContractV5R1 } from "@ton/ton";
import { Escrow } from "../../../build/Escrow/Escrow_Escrow";
import { contractAddresses } from "../models/constants";
import { TonApiClient } from "@ton-api/client";
import { getTonApiClient, getTonCenterClient } from "../middleware/tonClient";

async function catchPigShopEvents(
  adminWallet: OpenedContract<WalletContractV5R1>,
  PigShopContract: OpenedContract<Escrow>,
  tonCenterClient: TonClient,
  tonAPiClient: TonApiClient,
  after_lt?: bigint
) {
  console.log("➡️ Starting to catch PigShop events");
  fileSystemLogger.log("➡️ Starting to catch PigShop events");
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

  let events: Array<
    | extendedPigUpgradeEvent
    | extendedPigApprovalEvent
    | extendedPigCreationEvent
    | extendedWithdrawFromPigEvent
    | undefined
  > = [];

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
        Object.entries({ ...PigCollection.opcodes, ...PigShop.opcodes }).find(
          ([key, value]) => BigInt(value) === msg.opCode
        )?.[0]
      );
      fileSystemLogger.log(
        "💬 Out message:",
        Object.entries({ ...PigCollection.opcodes, ...PigShop.opcodes }).find(
          ([key, value]) => BigInt(value) === msg.opCode
        )?.[0]
      );

      try {
        if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.UpgradePig) &&
          msg.rawBody
        ) {
          events.push({
            ...loadUpgradePig(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected UpgradePig event");
          fileSystemLogger.log("✅ Detected UpgradePig event");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.PigApprovalEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadPigApprovalEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected PigApprovalEvent");
          fileSystemLogger.log("✅ Detected PigApprovalEvent");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.WithdrawFromPigEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadWithdrawFromPigEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected WithdrawFromPigEvent");
          fileSystemLogger.log("✅ Detected WithdrawFromPigEvent");
        } else if (
          msg.msgType === "ext_out_msg" &&
          msg.opCode === BigInt(PigShop.opcodes.PigCreationEvent) &&
          msg.rawBody
        ) {
          events.push({
            ...loadPigCreationEvent(msg.rawBody?.asSlice()),
            tx_hash: tx.hash,
          });
          console.log("✅ Detected PigCreationEvent");
          fileSystemLogger.log("✅ Detected PigCreationEvent");
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
    if (event && event.userAddress) {
      console.log(
        "📍 Processing event for user:",
        event.userAddress.toString()
      );
      fileSystemLogger.log(
        "📍 Processing event for user:",
        event.userAddress.toString()
      );

      const userAddr = event.userAddress.toRawString();
      let user = await getUser(userAddr);
      const pig_data = await getPigs(userAddr);
      console.log("🐷 Pig data loaded:", pig_data);
      fileSystemLogger.log("🐷 Pig data loaded:", pig_data);

      const bh = await findUsersBountyHunters(userAddr, pig_data.new_pig_level);
      console.log("🏹 Bounty hunters fetched:", bh);
      fileSystemLogger.log("🏹 Bounty hunters fetched:", bh);

      if (event.$$type === "UpgradePig") {
        console.log("🛠️ Handling UpgradePig event");
        fileSystemLogger.log("🛠️ Handling UpgradePig event");

        const isDup = await isDuplicatePurchase(
          userAddr,
          pig_data.new_pig_level
        );
        console.log("🔁 Is duplicate purchase?", isDup);
        fileSystemLogger.log("🔁 Is duplicate purchase?", isDup);

        if (!isDup) {
          console.log(
            "⁉️ UpgradePig tx initiated check for potential user tree update ..."
          );
          fileSystemLogger.log(
            "⁉️ UpgradePig tx initiated check for potential user tree update ..."
          );

          const bh = await findUsersBountyHunters(
            userAddr,
            pig_data.new_pig_level
          );

          const tx_id = TxId.create(userAddr, pig_data.new_pig_level);

          console.log("🚀 Sending pig approval message");
          fileSystemLogger.log("🚀 Sending pig approval message");
          await sendPigApproval(
            await BountyHuntersForPigApproval(bh),
            adminWallet,
            PigShopContract,
            pig_data.address,
            userAddr
          );

          await initTxHistory({
            tx_id,
            tx_hash: event.tx_hash,
            wallet_address: userAddr,
            request_status: "PigUpgradePending",
            upgraded_pig_level: pig_data.new_pig_level,
          });

          console.log("📜 Tx history initialized for UpgradePig");
          fileSystemLogger.log("📜 Tx history initialized for UpgradePig");
        }
      }

      if (event.$$type === "PigApprovalEvent") {
        console.log("✅ Approval received for:", userAddr);
        fileSystemLogger.log("✅ Approval received for:", userAddr);

        event.referrer = Dictionary.empty<Address, bigint>().set(
          event.referrerNftAddress,
          event.referrerAmount
        );

        console.log("👔 Updated the referrer amount for:", event.referrer);
        fileSystemLogger.log(
          "👔 Updated the referrer amount for:",
          event.referrer
        );

        //-----------------------------------------
        // update the bounty hunter balances (piggy_bank_balance on the users table)
        //-----------------------------------------

        await updateBountyHuntersBalances({
          referrer: event.referrer,
          users: event.userBountyHunters,
          admins: event.adminsShares,
        });

        //-----------------------------------------
        // update the user pig (current_pig on the users table)
        //-----------------------------------------
        await upgradeUserPig(userAddr);

        //-----------------------------------------
        // update the transaction history (tx_history table)
        //-----------------------------------------
        await updateTxHistory({
          tx_id: TxId.create(userAddr, pig_data.new_pig_level),
          tx_hash: event.tx_hash,
          wallet_address: userAddr,
          request_status: "PigPurchaseApproved",
          upgraded_pig_level: pig_data.new_pig_level,
        });

        //-----------------------------------------
        // update the referrals rewards history (rewards_history table)
        //-----------------------------------------
        const updateRes = await updateReferralsRewardsHistory(event);
        console.log("📦 Referral reward update:", updateRes);
        fileSystemLogger.log("📦 Referral reward update:", updateRes);

        if (!updateRes)
          throw new Error("Failed to update referrals rewards history!");
      }

      if (event.$$type === "PigCreationEvent") {
        console.log("🐣 Handling PigCreationEvent");
        fileSystemLogger.log("🐣 Handling PigCreationEvent");
        //-----------------------------------------
        // get the parent pig in ternary tree
        //-----------------------------------------
        let parent_id: number | undefined;
        const parentPigTreeIndex = (event.nftIndex - 1n) / 3n;
        if (parentPigTreeIndex > 0n) {
          const parentPigAddress =
            await PigCollectionContract.getGetNftAddressByIndex(
              parentPigTreeIndex
            );
          parent_id =
            (
              (await getUserByPigAddress(parentPigAddress.toRawString())) ||
              (await getGenesisUser())
            )?.id ?? 1;
        } else {
          // 0 is root/genesis
          parent_id = (await getGenesisUser())?.id ?? 1;
        }
        //-----------------------------------------
        // update the user pig address (pig_address on the users table) and parent_id
        //-----------------------------------------
        await upgradeUserPigAddressAndParentId(
          userAddr,
          event.nft.toRawString(),
          parent_id
        );
        console.log("✅ User pig address and parent_id upgraded");
        fileSystemLogger.log("✅ User pig address and parent_id upgraded");
      }

      if (event.$$type === "WithdrawFromPigEvent") {
        console.log("🏧 Handling WithdrawFromPigEvent");
        fileSystemLogger.log("🏧 Handling WithdrawFromPigEvent");
        //-----------------------------------------
        // update the user piggy bank balance (piggy_bank_balance on the users table)
        //-----------------------------------------

        await updateUserPiggyBankBalance(
          userAddr,
          event.nft.toRawString(),
          event.amount
        );
        console.log("💰 User piggy bank balance updated");
        fileSystemLogger.log("💰 User piggy bank balance updated");
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
    const adminWallet = await getAdminWallet(tc);

    console.log("👛 Admin wallet loaded:", adminWallet.address.toString());
    fileSystemLogger.log(
      "👛 Admin wallet loaded:",
      adminWallet.address.toString()
    );

    const pigShop = tc.open(Escrow.fromAddress(contractAddresses.escrow));
    const pigCollection = tc.open(
      PigCollection.fromAddress(contractAddresses.escrow)
    );

    console.log("🏪 PigShop contract opened at:", pigShop.address.toString());
    fileSystemLogger.log(
      "🏪 PigShop contract opened at:",
      pigShop.address.toString()
    );

    while (true) {
      try {
        lastLt = await catchPigShopEvents(
          adminWallet,
          pigShop,
          pigCollection,
          tc,
          tac,
          lastLt
        );

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
