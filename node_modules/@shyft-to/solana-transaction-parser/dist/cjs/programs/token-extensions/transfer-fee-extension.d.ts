import { TokenInstruction, TransferFeeInstruction } from "@solana/spl-token";
import { AccountMeta, PublicKey, TransactionInstruction } from "@solana/web3.js";
export interface SetTransferFeeInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
    transferFeeBasisPoints: number;
    maximumFee: bigint;
}
export declare const setTransferFeeInstructionData: import("@solana/buffer-layout").Structure<SetTransferFeeInstructionData>;
/** A decoded, valid SetTransferFee instruction */
export interface DecodedSetTransferFeeInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
        transferFeeBasisPoints: number;
        maximumFee: bigint;
    };
}
/**
 * Decode an SetTransferFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeSetTransferFeeInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedSetTransferFeeInstruction;
/** A decoded, valid SetTransferFee instruction */
export interface DecodedSetTransferFeeInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | undefined;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
        transferFeeBasisPoints: number;
        maximumFee: bigint;
    };
}
/**
 * Decode a SetTransferFee instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeSetTransferFeeInstructionUnchecked({ programId, keys: [mint, authority, ...signers], data, }: TransactionInstruction): DecodedSetTransferFeeInstructionUnchecked;
//# sourceMappingURL=transfer-fee-extension.d.ts.map