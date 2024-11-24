"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountDataSizeLayout = void 0;
const codecs_data_structures_1 = require("@solana/codecs-data-structures");
const codecs_1 = require("@solana/codecs");
exports.getAccountDataSizeLayout = (0, codecs_data_structures_1.getStructCodec)([
    ["instruction", (0, codecs_1.getU8Codec)()],
    ["extensions", (0, codecs_data_structures_1.getArrayCodec)((0, codecs_1.getU8Codec)(), { size: 1 })],
]);
//# sourceMappingURL=get-account-data-size-eztension.js.map