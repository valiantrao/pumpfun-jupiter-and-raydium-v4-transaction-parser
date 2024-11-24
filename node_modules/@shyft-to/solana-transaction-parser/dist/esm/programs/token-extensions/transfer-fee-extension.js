import { struct, u16, u8 } from "@solana/buffer-layout";
import { u64 } from "@solana/buffer-layout-utils";
import { TokenInstruction, TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, TransferFeeInstruction, } from "@solana/spl-token";
export const setTransferFeeInstructionData = struct([
    u8("instruction"),
    u8("transferFeeInstruction"),
    u16("transferFeeBasisPoints"),
    u64("maximumFee"),
]);
/**
 * Decode an SetTransferFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeSetTransferFeeInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== setTransferFeeInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint, authority, signers }, data, } = decodeSetTransferFeeInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension || data.transferFeeInstruction !== TransferFeeInstruction.SetTransferFee)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
            authority,
            signers: signers ? signers : null,
        },
        data,
    };
}
/**
 * Decode a SetTransferFee instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeSetTransferFeeInstructionUnchecked({ programId, keys: [mint, authority, ...signers], data, }) {
    const { instruction, transferFeeInstruction, transferFeeBasisPoints, maximumFee } = setTransferFeeInstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
            authority,
            signers,
        },
        data: {
            instruction,
            transferFeeInstruction,
            transferFeeBasisPoints,
            maximumFee,
        },
    };
}
//# sourceMappingURL=transfer-fee-extension.js.map