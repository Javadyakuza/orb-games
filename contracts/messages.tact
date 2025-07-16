// Events
message DepositEvent {
    user: Address;
    amount: Int;
    timestamp: Int;
}

message WithdrawEvent {
    user: Address;
    amount: Int;
    timestamp: Int;
}

// // Messages
// message Deposit {
//     amount: Int;
// }

message Withdraw {
    amount: Int;
    signature: Slice;
    messageHash: Int;
}

message SetAdmin {
    newAdmin: Int; // Public key as Int
}