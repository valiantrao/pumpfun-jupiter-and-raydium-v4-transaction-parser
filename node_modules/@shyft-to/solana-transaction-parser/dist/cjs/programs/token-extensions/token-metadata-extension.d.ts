export declare const metadataLayout: import("@solana/codecs").VariableSizeCodec<{
    instruction: Uint8Array;
    symbol: string;
    name: string;
    uri: string;
    additionalMetadata: [string, string][];
}, {
    instruction: Uint8Array;
    symbol: string;
    name: string;
    uri: string;
    additionalMetadata: [string, string][];
} & {
    instruction: Uint8Array;
    symbol: string;
    name: string;
    uri: string;
    additionalMetadata: [string, string][];
}>;
export declare const updateMetadataLayout: import("@solana/codecs").VariableSizeCodec<{
    instruction: Uint8Array;
    value: string;
    field: (object & {
        __kind: "Name";
    }) | (object & {
        __kind: "Uri";
    }) | (object & {
        __kind: "Symbol";
    }) | ({
        value: [string];
    } & {
        __kind: "Key";
    });
}, {
    instruction: Uint8Array;
    value: string;
    field: (object & {
        __kind: "Name";
    } & {
        __kind: "Name";
    }) | (object & {
        __kind: "Uri";
    } & {
        __kind: "Uri";
    }) | (object & {
        __kind: "Symbol";
    } & {
        __kind: "Symbol";
    }) | ({
        value: any;
    } & {
        value: [string];
    } & {
        __kind: "Key";
    } & {
        __kind: "Key";
    });
} & {
    instruction: Uint8Array;
    value: string;
    field: (object & {
        __kind: "Name";
    }) | (object & {
        __kind: "Uri";
    }) | (object & {
        __kind: "Symbol";
    }) | ({
        value: [string];
    } & {
        __kind: "Key";
    });
}>;
export declare const removeKeyLayout: import("@solana/codecs").VariableSizeCodec<{
    idempotent: boolean;
    key: string;
}, {
    idempotent: boolean;
    key: string;
} & {
    idempotent: boolean;
    key: string;
}>;
export declare const updateAuthorityLayout: import("@solana/codecs").FixedSizeCodec<{
    newAuthority: Uint8Array;
}, {
    newAuthority: Uint8Array;
} & {
    newAuthority: Uint8Array;
}>;
export declare const emitLayout: import("@solana/codecs").VariableSizeCodec<{
    start: import("@solana/codecs").OptionOrNullable<number | bigint>;
    end: import("@solana/codecs").OptionOrNullable<number | bigint>;
}, {
    start: import("@solana/codecs").Option<bigint>;
    end: import("@solana/codecs").Option<bigint>;
} & {
    start: import("@solana/codecs").OptionOrNullable<number | bigint>;
    end: import("@solana/codecs").OptionOrNullable<number | bigint>;
}>;
//# sourceMappingURL=token-metadata-extension.d.ts.map