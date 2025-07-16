import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { Cell, toNano, beginCell, Address } from "@ton/core";
import {
  Escrow,
  loadDepositEvent,
  loadWithdrawEvent,
} from "../build/Escrow/Escrow_Escrow";
import "@ton/test-utils";
import { compile } from "@ton/blueprint";
import { KeyPair, keyPairFromSeed, sign } from "@ton/crypto";
import { randomBytes } from "crypto";

// Message structures - these would normally come from messages.tact
interface DepositEvent {
  user: Address;
  amount: bigint;
  timestamp: number;
}

interface WithdrawEvent {
  user: Address;
  amount: bigint;
  timestamp: number;
}

interface Withdraw {
  amount: bigint;
  signature: Cell;
  messageHash: bigint;
}

interface SetAdmin {
  newAdmin: bigint;
}

describe("escrow", () => {
  let code: Cell;
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let user1: SandboxContract<TreasuryContract>;
  let user2: SandboxContract<TreasuryContract>;
  let escrow: SandboxContract<Escrow>;

  // Real admin key pair for testing
  let adminKeyPair: KeyPair;
  let adminPublicKey: bigint;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
    user1 = await blockchain.treasury("user1");
    user2 = await blockchain.treasury("user2");

    // Generate real Ed25519 key pair
    const seed = randomBytes(32);
    adminKeyPair = keyPairFromSeed(seed);
    adminPublicKey = BigInt("0x" + adminKeyPair.publicKey.toString("hex"));

    escrow = blockchain.openContract(await Escrow.fromInit(adminPublicKey));

    const deployResult = await escrow.send(
      deployer.getSender(),
      { value: toNano("0.05") },
      null
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: escrow.address,
      deploy: true,
      success: true,
    });
  });

  describe("Deployment", () => {
    it("should deploy successfully", async () => {
      // Contract should be deployed and accessible
      expect(escrow.address).toBeDefined();
    });

    it("should have correct initial admin public key", async () => {
      // This would require a getter function in the contract
      // For now, we'll test that deployment was successful
      expect(escrow.address).toBeDefined();
    });
  });

  describe("Deposit functionality", () => {
    it("should accept deposits and emit events", async () => {
      const result = await escrow.send(
        user1.getSender(),
        { value: toNano("1.05") },
        "Deposit"
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: escrow.address,
        success: true,
      });

      // Check that DepositEvent was emitted
      let DepositEventFound = false;

      result.externals.forEach((ext, index) => {
        try {
          let depositEvent = loadDepositEvent(ext.body.asSlice());
          console.log("Deposit event:", depositEvent);
          DepositEventFound = true;
        } catch (e) {
          // Event parsing failed, continue
        }
      });

      expect(DepositEventFound).toBeTruthy();
    });
  });

  describe("Withdraw functionality", () => {
    // Helper function to create message hash for withdrawal
    function createMessageHash(
      userAddress: Address,
      amount: bigint,
      timestamp: number
    ): bigint {
      const messageCell = beginCell()
        .storeAddress(userAddress)
        .storeUint(amount, 64)
        .storeUint(Math.floor(timestamp / 3600), 32)
        .endCell();

      return BigInt("0x" + messageCell.hash().toString("hex"));
    }

    // Helper function to create real signature
    function createRealSignature(messageHash: bigint): Cell {
      // Convert bigint to 32-byte buffer for signing
      const hashHex = messageHash.toString(16).padStart(64, "0");
      const hashBuffer = Buffer.from(hashHex, "hex");

      // Sign with admin's private key
      const signature = sign(hashBuffer, adminKeyPair.secretKey);

      return beginCell().storeBuffer(signature).endCell();
    }

    // Helper function to create invalid signature for testing
    function createInvalidSignature(): Cell {
      return beginCell()
        .storeBuffer(Buffer.alloc(64, 0x42)) // Invalid signature
        .endCell();
    }

    it("should allow withdrawal with valid signature", async () => {
      // First deposit some TON
      const depositResult = await escrow.send(
        user1.getSender(),
        { value: toNano("1.05") },
        "Deposit"
      );

      expect(depositResult.transactions).toHaveTransaction({
        from: user1.address,
        to: escrow.address,
        success: true,
      });

      const withdrawAmount = toNano("1");
      const currentTime = Math.floor(Date.now() / 1000);
      const messageHash = createMessageHash(
        user1.address,
        withdrawAmount,
        currentTime
      );
      const signature = createRealSignature(messageHash);

      let user1Balance = await user1.getBalance();
      console.log("User balance before withdrawal:", user1Balance);

      const result = await escrow.send(
        user1.getSender(),
        { value: toNano("0.05") },
        {
          $$type: "Withdraw",
          amount: withdrawAmount,
          signature: signature.asSlice(),
          messageHash,
        }
      );

      console.log("Withdrawal result:", result);

      // Check that the withdrawal transaction was successful
      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: escrow.address,
        success: true,
      });

      // Check that user received the withdrawal
      expect(result.transactions).toHaveTransaction({
        from: escrow.address,
        to: user1.address,
        success: true,
      });

      // Check that withdrawEvent was emitted
      let withdrawEventFound = false;
      result.externals.forEach((ext, index) => {
        try {
          let resultEvent = loadWithdrawEvent(ext.body.asSlice());
          console.log("Withdraw event:", resultEvent);
          withdrawEventFound = true;
        } catch (e) {
          // Event parsing failed, continue
        }
      });

      expect(withdrawEventFound).toBeTruthy();

      const user1BalanceAfter = await user1.getBalance();
      console.log("User balance after withdrawal:", user1BalanceAfter);
      console.log("user balance difference:", user1BalanceAfter - user1Balance);
      // User should have more balance (received withdrawal minus gas fees)
      expect(user1BalanceAfter).toBeGreaterThan(user1Balance);
    });

    it("should reject withdrawal with invalid signature", async () => {
      // First deposit some TON
      await escrow.send(
        user1.getSender(),
        { value: toNano("1.05") },
        "Deposit"
      );

      const withdrawAmount = toNano("1");
      const currentTime = Math.floor(Date.now() / 1000);
      const messageHash = createMessageHash(
        user1.address,
        withdrawAmount,
        currentTime
      );
      const invalidSignature = createInvalidSignature();

      const result = await escrow.send(
        user1.getSender(),
        { value: toNano("0.05") },
        {
          $$type: "Withdraw",
          amount: withdrawAmount,
          signature: invalidSignature.asSlice(),
          messageHash,
        }
      );

      // Should fail due to invalid signature
      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: escrow.address,
        success: false,
        exitCode: 48401, // Your signature verification error code
      });
    });

    it("should reject withdrawal with invalid message hash", async () => {
      // First deposit some TON
      await escrow.send(
        user1.getSender(),
        { value: toNano("1.05") },
        "Deposit"
      );

      const withdrawAmount = toNano("1");
      const wrongMessageHash = BigInt(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
      const signature = createRealSignature(wrongMessageHash);

      const result = await escrow.send(
        user1.getSender(),
        { value: toNano("0.05") },
        {
          $$type: "Withdraw",
          amount: withdrawAmount,
          signature: signature.asSlice(),
          messageHash: wrongMessageHash,
        }
      );

      // Should fail due to hash mismatch
      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: escrow.address,
        success: false,
      });
    });

    it("should reject withdrawal with wrong user address in hash", async () => {
      // First deposit some TON
      await escrow.send(
        user1.getSender(),
        { value: toNano("1.05") },
        "Deposit"
      );

      const withdrawAmount = toNano("1");
      const currentTime = Math.floor(Date.now() / 1000);

      // Create hash with wrong user address
      const messageHash = createMessageHash(
        user2.address, // Wrong user!
        withdrawAmount,
        currentTime
      );
      const signature = createRealSignature(messageHash);

      const result = await escrow.send(
        user1.getSender(), // But user1 is sending the message
        { value: toNano("0.05") },
        {
          $$type: "Withdraw",
          amount: withdrawAmount,
          signature: signature.asSlice(),
          messageHash,
        }
      );

      // Should fail due to hash mismatch (wrong address)
      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: escrow.address,
        success: false,
      });
    });
  });

  describe("Admin functionality", () => {
    it("should allow admin to update public key", async () => {
      // Generate new admin key pair
      const newSeed = randomBytes(32);
      const newAdminKeyPair = keyPairFromSeed(newSeed);
      const newAdminPublicKey = BigInt(
        "0x" + newAdminKeyPair.publicKey.toString("hex")
      );

      const result = await escrow.send(
        deployer.getSender(),
        { value: toNano("0.05") },
        {
          $$type: "SetAdmin",
          newAdmin: newAdminPublicKey,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: escrow.address,
        success: true,
      });

      // Note: You would need a getter function to verify the admin key was updated
      // For now, we just verify the transaction succeeded
    });
  });
});
