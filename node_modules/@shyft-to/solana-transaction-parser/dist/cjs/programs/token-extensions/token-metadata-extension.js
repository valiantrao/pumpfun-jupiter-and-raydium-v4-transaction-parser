"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitLayout = exports.updateAuthorityLayout = exports.removeKeyLayout = exports.updateMetadataLayout = exports.metadataLayout = void 0;
const codecs_data_structures_1 = require("@solana/codecs-data-structures");
const codecs_1 = require("@solana/codecs");
const codecs_strings_1 = require("@solana/codecs-strings");
exports.metadataLayout = (0, codecs_data_structures_1.getStructCodec)([
    ["instruction", (0, codecs_data_structures_1.getBytesCodec)({ size: 8 })],
    ["name", (0, codecs_strings_1.getStringCodec)()],
    ["symbol", (0, codecs_strings_1.getStringCodec)()],
    ["uri", (0, codecs_strings_1.getStringCodec)()],
    ["additionalMetadata", (0, codecs_data_structures_1.getArrayCodec)((0, codecs_data_structures_1.getTupleCodec)([(0, codecs_strings_1.getStringCodec)(), (0, codecs_strings_1.getStringCodec)()]))],
]);
const getFieldCodec = () => [
    ["Name", (0, codecs_data_structures_1.getUnitCodec)()],
    ["Symbol", (0, codecs_data_structures_1.getUnitCodec)()],
    ["Uri", (0, codecs_data_structures_1.getUnitCodec)()],
    ["Key", (0, codecs_data_structures_1.getStructCodec)([["value", (0, codecs_data_structures_1.getTupleCodec)([(0, codecs_strings_1.getStringCodec)()])]])],
];
exports.updateMetadataLayout = (0, codecs_data_structures_1.getStructCodec)([
    ["instruction", (0, codecs_data_structures_1.getBytesCodec)({ size: 8 })],
    ["field", (0, codecs_data_structures_1.getDataEnumCodec)(getFieldCodec())],
    ["value", (0, codecs_strings_1.getStringCodec)()],
]);
exports.removeKeyLayout = (0, codecs_data_structures_1.getStructCodec)([
    ["idempotent", (0, codecs_data_structures_1.getBooleanCodec)()],
    ["key", (0, codecs_strings_1.getStringCodec)()],
]);
exports.updateAuthorityLayout = (0, codecs_data_structures_1.getStructCodec)([["newAuthority", (0, codecs_data_structures_1.getBytesCodec)({ size: 32 })]]);
exports.emitLayout = (0, codecs_data_structures_1.getStructCodec)([
    ["start", (0, codecs_1.getOptionCodec)((0, codecs_1.getU64Codec)())],
    ["end", (0, codecs_1.getOptionCodec)((0, codecs_1.getU64Codec)())],
]);
//# sourceMappingURL=token-metadata-extension.js.map