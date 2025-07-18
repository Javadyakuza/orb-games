import { toNano } from "@ton/core";
import { Escrow } from "../build/Escrow/Escrow_Escrow";
import { NetworkProvider } from "@ton/blueprint";
import { getAdminWallet } from "@/server/services/helpers";
import { getTonCenterClient } from "@/server/middleware/tonClient";

export async function run(provider: NetworkProvider) {
  // deploy the contract
  const escrow = provider.open(await Escrow.fromInit(BigInt(0)));

  await escrow.send(
    provider.sender(),
    {
      value: toNano("0.05"),
    },
    null
  );

  await provider.waitForDeploy(escrow.address);

  // set the admin wallet
  let admin_wallet = await getAdminWallet(getTonCenterClient());

  const publicKeyHex = admin_wallet.publicKey.toString("hex");

  const publicKeyBigInt = BigInt("0x" + publicKeyHex);

  await escrow.send(
    provider.sender(), // provided in cli input
    {
      value: toNano("0.05"),
    },
    {
      $$type: "SetAdmin",
      newAdmin: BigInt("0x" + publicKeyBigInt),
    }
  );
}
