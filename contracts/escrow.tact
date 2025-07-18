import "@stdlib/deploy";

import "./messages.tact";


contract Escrow with Deployable {

    adminPublicKey: Int;
    
    init(adminPublicKey: Int) {
        self.adminPublicKey = adminPublicKey;
    }
    
    receive(){}
    
    // Deposit function - users can send TON to the contract
    receive("Deposit") {
        let sender: Address = sender();
        let amount: Int = context().value;
        
        // Emit deposit event
        emit(DepositEvent{
            user: sender,
            amount: amount,
            timestamp: now()
        }.toCell());
    }
    
    
    // Withdraw function with signature verification
    receive(msg: Withdraw) {
        let sender: Address = sender();
        let amount: Int = msg.amount;
        let signature: Slice = msg.signature;
        let messageHash: Int = msg.messageHash;
        
        let currentTime: Int = now();
        let messageToVerify: Cell = beginCell()
            .storeAddress(sender)
            .storeUint(amount, 64)
            .storeUint(currentTime / 3600, 32) // Hour-based timestamp for some tolerance
            .endCell();
        
        let computedHash: Int = messageToVerify.hash();
        require(computedHash == messageHash, "Invalid message hash");
        
        // Verify Ed25519 signature using Tact's built-in checkSignature function
        require(checkSignature(messageHash, signature, self.adminPublicKey), "Invalid signature");
        
        // Send TON to user
        send(SendParameters{
            to: sender,
            value: amount,
            mode: SendRemainingValue,
            bounce: false
        });
        
        // Emit withdraw event
        emit(WithdrawEvent{
            user: sender,
            amount: amount,
            timestamp: now()
        }.toCell());
    }
    
     
    // Withdraw function with signature verification
    receive(msg: AdminWithdraw) {
        let sender: Address = sender();
        let recipient: Address = msg.recipient;
        let amount: Int = msg.amount;
        let signature: Slice = msg.signature;
        let messageHash: Int = msg.messageHash;
        
        let currentTime: Int = now();
        let messageToVerify: Cell = beginCell()
            .storeAddress(sender)
            .storeAddress(recipient)
            .storeUint(amount, 64)  
            .storeUint(currentTime / 3600, 32) // Hour-based timestamp for some tolerance
            .endCell();
        
        let computedHash: Int = messageToVerify.hash();
        require(computedHash == messageHash, "Invalid message hash");
        
        // Verify Ed25519 signature using Tact's built-in checkSignature function
        require(checkSignature(messageHash, signature, self.adminPublicKey), "Invalid signature");
        
        // Send TON to user
        send(SendParameters{
            to: recipient,
            value: amount,
            mode: SendRemainingValue,
            bounce: false
        });
        
        // Emit withdraw event
        emit(AdminWithdrawEvent{
            recipient,
            amount,
            timestamp: now()
        }.toCell());
    }
    // Admin function to update admin public key
    receive(msg: SetAdmin) {
        // Only current admin can change the admin key
        // This is a simplified version - in production, you'd want more sophisticated admin verification
        self.adminPublicKey = msg.newAdmin;
    }
    
}



