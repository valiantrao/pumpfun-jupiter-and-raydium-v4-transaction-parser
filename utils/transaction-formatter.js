const { ConfirmedTransactionMeta, Message, MessageV0, PublicKey, VersionedMessage, VersionedTransactionResponse, TransactionInstruction } = require('@solana/web3.js');
const { utils } = require('@project-serum/anchor');
const base58 = require('bs58');

class TransactionFormatter {
  formTransactionFromJson(data, time) {
    const rawTx = data.transaction;

    const slot = data.slot;
    const version = rawTx.transaction.message.versioned ? 0 : 'legacy';

    const meta = this.formMeta(rawTx.meta);
    const signatures = rawTx.transaction.signatures.map((s) => utils.bytes.bs58.encode(s));

    const message = this.formTxnMessage(rawTx.transaction.message);

    return {
      slot,
      version,
      blockTime: time,
      meta,
      transaction: {
        signatures,
        message,
      },
    };
  }

  formTxnMessage(message) {
    if (!message.versioned) {
      return new Message({
        header: {
          numRequiredSignatures: message.header.numRequiredSignatures,
          numReadonlySignedAccounts: message.header.numReadonlySignedAccounts,
          numReadonlyUnsignedAccounts: message.header.numReadonlyUnsignedAccounts,
        },
        recentBlockhash: utils.bytes.bs58.encode(Buffer.from(message.recentBlockhash, 'base64')),
        accountKeys: message.accountKeys?.map((d) => Buffer.from(d, 'base64')),
        instructions: message.instructions.map(({ data, programIdIndex, accounts }) => ({
          programIdIndex: programIdIndex,
          accounts: [...accounts] || [],
          data: utils.bytes.bs58.encode(Buffer.from(data || '', 'base64')),
        })),
      });
    } else {
      return new MessageV0({
        header: {
          numRequiredSignatures: message.header.numRequiredSignatures,
          numReadonlySignedAccounts: message.header.numReadonlySignedAccounts,
          numReadonlyUnsignedAccounts: message.header.numReadonlyUnsignedAccounts,
        },
        recentBlockhash: utils.bytes.bs58.encode(Buffer.from(message.recentBlockhash, 'base64')),
        staticAccountKeys: message.accountKeys.map((k) => new PublicKey(Buffer.from(k, 'base64'))),
        compiledInstructions: message.instructions.map(({ programIdIndex, accounts, data }) => ({
          programIdIndex: programIdIndex,
          accountKeyIndexes: [...accounts] || [],
          data: Uint8Array.from(Buffer.from(data || '', 'base64')),
        })),
        addressTableLookups:
          message.addressTableLookups?.map(({ accountKey, writableIndexes, readonlyIndexes }) => ({
            writableIndexes: writableIndexes || [],
            readonlyIndexes: readonlyIndexes || [],
            accountKey: new PublicKey(Buffer.from(accountKey, 'base64')),
          })) || [],
      });
    }
  }

  formMeta(meta) {
    return {
      err: meta.errorInfo ? { err: meta.errorInfo } : null,
      fee: meta.fee,
      preBalances: meta.preBalances,
      postBalances: meta.postBalances,
      preTokenBalances: meta.preTokenBalances || [],
      postTokenBalances: meta.postTokenBalances || [],
      logMessages: meta.logMessages || [],
      loadedAddresses:
        meta.loadedWritableAddresses || meta.loadedReadonlyAddresses
          ? {
              writable: meta.loadedWritableAddresses?.map((address) => new PublicKey(Buffer.from(address, 'base64'))) || [],
              readonly: meta.loadedReadonlyAddresses?.map((address) => new PublicKey(Buffer.from(address, 'base64'))) || [],
            }
          : undefined,
      innerInstructions:
        meta.innerInstructions?.map((i) => ({
          index: i.index || 0,
          instructions: i.instructions.map((instruction) => ({
            programIdIndex: instruction.programIdIndex,
            accounts: instruction.accounts || [],
            data: utils.bytes.bs58.encode(Buffer.from(instruction.data || '', 'base64')),
          })),
        })) || [],
    };
  }

  parseTransactionAccounts(message, loadedAddresses) {
    const accounts = message.accountKeys || message.staticAccountKeys;
    const readonlySignedAccountsCount = message.header.numReadonlySignedAccounts;
    const readonlyUnsignedAccountsCount = message.header.numReadonlyUnsignedAccounts;
    const requiredSignaturesAccountsCount = message.header.numRequiredSignatures;
    const totalAccounts = accounts.length;
    let parsedAccounts = accounts.map((account, idx) => {
      const isWritable = idx < requiredSignaturesAccountsCount - readonlySignedAccountsCount || (idx >= requiredSignaturesAccountsCount && idx < totalAccounts - readonlyUnsignedAccountsCount);

      return {
        isSigner: idx < requiredSignaturesAccountsCount,
        isWritable,
        pubkey: new PublicKey(account),
      };
    });
    const [ALTWritable, ALTReadOnly] = message.version === 'legacy' ? [[], []] : loadedAddresses ? [loadedAddresses.writable, loadedAddresses.readonly] : [[], []]; // message.getAccountKeys({ accountKeysFromLookups: loadedAddresses }).keySegments().slice(1); // omit static keys
    if (ALTWritable)
      parsedAccounts = [
        ...parsedAccounts,
        ...ALTWritable.map((pubkey) => ({
          isSigner: false,
          isWritable: true,
          pubkey,
        })),
      ];
    if (ALTReadOnly)
      parsedAccounts = [
        ...parsedAccounts,
        ...ALTReadOnly.map((pubkey) => ({
          isSigner: false,
          isWritable: false,
          pubkey,
        })),
      ];

    return parsedAccounts;
  }

  compiledInstructionToInstruction(compiledInstruction, parsedAccounts) {
    if (typeof compiledInstruction.data === 'string') {
      const ci = compiledInstruction;
      return new TransactionInstruction({
        data: Buffer.from(base58.decode(ci.data)),
        programId: parsedAccounts[ci.programIdIndex].pubkey,
        keys: ci.accounts.map((accountIdx) => parsedAccounts[accountIdx]),
      });
    } else {
      const ci = compiledInstruction;

      return new TransactionInstruction({
        data: Buffer.from(ci.data),
        programId: parsedAccounts[ci.programIdIndex].pubkey,
        keys: ci.accountKeyIndexes.map((accountIndex) => {
          if (accountIndex >= parsedAccounts.length)
            throw new Error(
              `Trying to resolve account at index ${accountIndex} while parsedAccounts is only ${parsedAccounts.length}. \
              Looks like you're trying to parse versioned transaction, make sure that LoadedAddresses are passed to the \
              parseTransactionAccounts function`,
            );

          return parsedAccounts[accountIndex];
        }),
      });
    }
  }

  async flattenTransactionResponse(transaction) {
    // console.log(JSON.stringify(transaction));
    const result = [];
    if (transaction === null || transaction === undefined) return [];
    const txInstructions = transaction.transaction.message.compiledInstructions || transaction.transaction.message.instructions;
    const accountsMeta = this.parseTransactionAccounts(transaction.transaction.message, transaction.meta?.loadedAddresses);

    const orderedCII = (transaction?.meta?.innerInstructions || []).sort((a, b) => a.index - b.index);
    const totalCalls = (transaction.meta?.innerInstructions || []).reduce((accumulator, cii) => accumulator + cii.instructions.length, 0) + txInstructions.length;
    let lastPushedIx = -1;
    let callIndex = -1;
    for (const CII of orderedCII) {
      // push original instructions until we meet CPI
      while (lastPushedIx !== CII.index) {
        lastPushedIx += 1;
        callIndex += 1;
        result.push(this.compiledInstructionToInstruction(txInstructions[lastPushedIx], accountsMeta));
      }
      for (const CIIEntry of CII.instructions) {
        result.push(this.compiledInstructionToInstruction(CIIEntry, accountsMeta));
        callIndex += 1;
      }
    }
    while (callIndex < totalCalls - 1) {
      lastPushedIx += 1;
      callIndex += 1;
      result.push(this.compiledInstructionToInstruction(txInstructions[lastPushedIx], accountsMeta));
    }
    return result;
  }
}

module.exports = {
  TransactionFormatter,
};
