const Client = require('@triton-one/yellowstone-grpc').default;
const { CommitmentLevel } = require('@triton-one/yellowstone-grpc');
const { PublicKey, VersionedTransactionResponse, Connection } = require('@solana/web3.js');
const { Idl } = require('@project-serum/anchor');
const { SolanaParser } = require('@shyft-to/solana-transaction-parser');
const TransactionFormatter = require('./utils/transaction-formatter').TransactionFormatter;
const jupiterV6Idl = require('./idls/jupiter_v6_0.1.0.json');
const pumpFunIdl = require('./idls/pump_0.1.0.json');
const raydiumAmmIdl = require('./idls/raydium_amm.json');
const raydiumAmmV3Idl = require('./idls/raydium_amm_v3.json');
const { RaydiumAmmParser } = require('./parsers/raydium-amm-parser');
const { PUMP_FUN_PROGRAM, RAYDIUM_LP_V4, PUMP_FUN_RAY_MIGRATION, JUPITER_PROGRAM, RAYDIUM_CLMM } = require('./src/const');
const { LogsParser } = require('./parsers/logs-parser');
const { decodeTxn } = require('.');
const SolanaEventParser = require('./utils/event-parser').SolanaEventParser;
const bnLayoutFormatter = require('./utils/bn-layout-formatter').bnLayoutFormatter;

const TXN_FORMATTER = new TransactionFormatter();
const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const PUMP_FUN_IX_PARSER = new SolanaParser([]);
PUMP_FUN_IX_PARSER.addParserFromIdl(PUMP_FUN_PROGRAM_ID.toBase58(), pumpFunIdl);
const PUMP_FUN_EVENT_PARSER = new SolanaEventParser([], console);
PUMP_FUN_EVENT_PARSER.addParserFromIdl(PUMP_FUN_PROGRAM_ID.toBase58(), pumpFunIdl);

async function handleStream(client, args) {
  // Subscribe for events
  const stream = await client.subscribe();

  // Create `error` / `end` handler
  const streamClosed = new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      console.log('ERROR', error);
      reject(error);
      stream.end();
    });
    stream.on('end', () => {
      resolve();
    });
    stream.on('close', () => {
      resolve();
    });
  });

  // Handle updates
  stream.on('data', (data) => {
    if (data?.transaction) {
      const txn = TXN_FORMATTER.formTransactionFromJson(data.transaction, Date.now());
      const parsedTxn = decodeTxn(txn);

      console.log(JSON.stringify(parsedTxn));
      x;
    }
  });

  // Send subscribe request
  await new Promise((resolve, reject) => {
    stream.write(args, (err) => {
      if (err === null || err === undefined) {
        resolve();
      } else {
        reject(err);
      }
    });
  }).catch((reason) => {
    console.error(reason);
    throw reason;
  });

  await streamClosed;
}

async function subscribeCommand(client, args) {
  while (true) {
    try {
      await handleStream(client, args);
    } catch (error) {
      console.error('Stream error, restarting in 1 second...', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

const client = new Client('https://grpc.va.shyft.to', 'dae2d4ca-d1c6-4ca4-9198-4cd4b9d4cae2', undefined);
const req = {
  accounts: {},
  slots: {},
  transactions: {
    pumpFun: {
      vote: false,
      failed: false,
      signature: undefined,
      accountInclude: [PUMP_FUN_PROGRAM_ID.toBase58()],
      accountExclude: [],
      accountRequired: [],
    },
  },
  transactionsStatus: {},
  entry: {},
  blocks: {},
  blocksMeta: {},
  accountsDataSlice: [],
  ping: undefined,
  commitment: CommitmentLevel.CONFIRMED,
};

subscribeCommand(client, req);

function decodePumpFunTxn(tx) {
  if (tx.meta?.err) return;

  const paredIxs = PUMP_FUN_IX_PARSER.parseTransactionData(tx.transaction.message, tx.meta.loadedAddresses);

  const pumpFunIxs = paredIxs.filter((ix) => ix.programId.equals(PUMP_FUN_PROGRAM_ID));

  if (pumpFunIxs.length === 0) return;
  const events = PUMP_FUN_EVENT_PARSER.parseEvent(tx);
  const result = { instructions: pumpFunIxs, events };
  bnLayoutFormatter(result);
  return result;
}
