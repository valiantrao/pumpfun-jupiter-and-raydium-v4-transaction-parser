"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSetTransferFeeInstructionUnchecked = exports.decodeSetTransferFeeInstruction = exports.setTransferFeeInstructionData = void 0;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const spl_token_1 = require("@solana/spl-token");
exports.setTransferFeeInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)("instruction"),
    (0, buffer_layout_1.u8)("transferFeeInstruction"),
    (0, buffer_layout_1.u16)("transferFeeBasisPoints"),
    (0, buffer_layout_utils_1.u64)("maximumFee"),
]);
/**
 * Decode an SetTransferFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeSetTransferFeeInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new spl_token_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.setTransferFeeInstructionData.span)
        throw new spl_token_1.TokenInvalidInstructionDataError();
    const { keys: { mint, authority, signers }, data, } = decodeSetTransferFeeInstructionUnchecked(instruction);
    if (data.instruction !== spl_token_1.TokenInstruction.TransferFeeExtension || data.transferFeeInstruction !== spl_token_1.TransferFeeInstruction.SetTransferFee)
        throw new spl_token_1.TokenInvalidInstructionTypeError();
    if (!mint)
        throw new spl_token_1.TokenInvalidInstructionKeysError();
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
exports.decodeSetTransferFeeInstruction = decodeSetTransferFeeInstruction;
/**
 * Decode a SetTransferFee instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeSetTransferFeeInstructionUnchecked({ programId, keys: [mint, authority, ...signers], data, }) {
    const { instruction, transferFeeInstruction, transferFeeBasisPoints, maximumFee } = exports.setTransferFeeInstructionData.decode(data);
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
exports.decodeSetTransferFeeInstructionUnchecked = decodeSetTransferFeeInstructionUnchecked;
//# sourceMappingURL=transfer-fee-extension.js.map