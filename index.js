const { PublicKey, VersionedTransactionResponse, Connection } = require('@solana/web3.js');
const { Idl } = require('@project-serum/anchor');
const { SolanaParser } = require('@shyft-to/solana-transaction-parser');
const TransactionFormatter = require('./utils/transaction-formatter').TransactionFormatter;
const jupiterV6Idl = require('./idls/jupiter_v6_0.1.0.json');
const pumpFunIdl = require('./idls/pump_0.1.0.json');
const raydiumAmmIdl = require('./idls/raydium_amm.json');
const raydiumAmmV3Idl = require('./idls/raydium_amm_v3.json');
const { RaydiumAmmParser } = require('./parsers/raydium-amm-parser');
const { PUMP_FUN_PROGRAM, RAYDIUM_LP_V4, PUMP_FUN_RAY_MIGRATION, JUPITER_PROGRAM, RAYDIUM_CLMM, TOKEN_PROGRAM_ID } = require('./src/const');
const { LogsParser } = require('./parsers/logs-parser');
const SolanaEventParser = require('./utils/event-parser').SolanaEventParser;
const bnLayoutFormatter = require('./utils/bn-layout-formatter').bnLayoutFormatter;

const TXN_FORMATTER = new TransactionFormatter();

const HELIUS_API_KEY = '';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const raydiumAmmParser = new RaydiumAmmParser();
const LOGS_PARSER = new LogsParser();

// -- Ix parsers --
const JUPITER_IX_PARSER = new SolanaParser([]);
const PUMP_FUN_IX_PARSER = new SolanaParser([]);
const RAYDIUM_V4_IX_PARSER = new SolanaParser([]);
const RAYDIUM_CLMM_IX_PARSER = new SolanaParser([]);
const SPL_IXX_PARSER = new SolanaParser([]);

JUPITER_IX_PARSER.addParserFromIdl(JUPITER_PROGRAM.toBase58(), jupiterV6Idl);
PUMP_FUN_IX_PARSER.addParserFromIdl(PUMP_FUN_PROGRAM.toBase58(), pumpFunIdl);
RAYDIUM_V4_IX_PARSER.addParser(RAYDIUM_LP_V4, raydiumAmmParser.parseInstruction.bind(raydiumAmmParser));
RAYDIUM_CLMM_IX_PARSER.addParserFromIdl(RAYDIUM_CLMM.toBase58(), raydiumAmmIdl);
RAYDIUM_CLMM_IX_PARSER.addParserFromIdl(RAYDIUM_CLMM.toBase58(), raydiumAmmV3Idl);
// IX_PARSER.addParserFromIdl(RAYDIUM_LP_V4.toBase58(), raydiumAmmIdl);
// IX_PARSER.addParserFromIdl(RAYDIUM_LP_V4.toBase58(), raydiumAmmV3Idl);

// -- Event parsers --
const JUPITER_EVENT_PARSER = new SolanaEventParser([], console);
const PUMP_FUN_EVENT_PARSER = new SolanaEventParser([], console);
const RAYDIUM_EVENT_PARSER = new SolanaEventParser([], console);
JUPITER_EVENT_PARSER.addParserFromIdl(JUPITER_PROGRAM.toBase58(), jupiterV6Idl);
PUMP_FUN_EVENT_PARSER.addParserFromIdl(PUMP_FUN_PROGRAM.toBase58(), pumpFunIdl);
//EVENT_PARSER.addParserFromIdl(RAYDIUM_LP_V4.toBase58(), raydiumAmmIdl);
//EVENT_PARSER.addParserFromIdl(RAYDIUM_LP_V4.toBase58(), raydiumAmmV3Idl);

async function subscribeCommand() {
  const trx = '23L4DVz8G8bVW5FZ1H3A1bMhfjKY2yv1UVi3XzhPZqXjgbXhzsztKxPxVzXGpLqpD5zuELoDm5231fC8pXRwxDiW';
  //poolCoinTokenAccount for sol account
  //ammTargetOrders for token account

  const data = await connection.getTransaction(trx, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  //console.log(JSON.stringify(data));
  if (data?.transaction) {
    // const txn = TXN_FORMATTER.formTransactionFromJson(data, Date.now());

    const logs = data.meta.logMessages || [];

    const { readonly, writable } = data.meta.loadedAddresses;

    const accountKeys = [...(data.transaction.message?.accountKeys || data.transaction.message?.staticAccountKeys), ...writable, ...readonly];
    const trader = accountKeys[0];

    const includesLog = (keyword) => logs.some((log) => log.includes(keyword));
    const includesAddress = (address) => accountKeys.some((key) => key == address || key == new PublicKey(address));
    let parsedTxn = decodeTxn(data);
    // if (includesLog(JUPITER_PROGRAM)) {
    //   console.log('jupiter');
    //   parsedTxn = decodePumpFunTxn(data);
    // } else if (includesAddress(PUMP_FUN_PROGRAM)) {
    //   console.log('Pump');
    //   parsedTxn = decodePumpFunTxn(data);
    // } else if (includesAddress(RAYDIUM_LP_V4) && includesLog('initialize2')) {
    //   console.log('raydium initialize2');
    //   parsedTxn = decodeRaydiumTrxWithLogs(data);
    // } else if (includesLog(JUPITER_PROGRAM)) {
    // }

    if (!parsedTxn) return;

    console.log(JSON.stringify(parsedTxn));

    //console.log(new Date(), ':', `New transaction https://translator.shyft.to/tx/${data.transaction.signatures[0]} \n`, JSON.stringify(parsedTxn, null, 2) + '\n');
  }
}

// subscribeCommand();

async function decodeTxn(transaction) {
  const logs = transaction.meta.logMessages || [];
  let readonly = [];
  let writable = [];

  const loadedAddresses = transaction.meta.loadedAddresses;

  const signature = transaction.transaction.signatures[0];

  if (loadedAddresses) {
    readonly = loadedAddresses.readonly;
    writable = loadedAddresses.writable;
  }

  const accountKeys = [...(transaction.transaction.message?.accountKeys || transaction.transaction.message?.staticAccountKeys), ...writable, ...readonly];
  const trader = accountKeys[0];

  const includesLog = (keyword) => logs.some((log) => log.includes(keyword));
  const includesAddress = (address) => accountKeys.some((key) => key == address || key == new PublicKey(address));

  let parsedTxn = [];
  let decodedIxs = [];
  let pump_events = [];
  let jup_events = [];
  let raydium_log_events = [];

  const allIxs = await TXN_FORMATTER.flattenTransactionResponse(transaction);
  allIxs.forEach((ix) => {
    if (!(ix.programId instanceof PublicKey)) {
      ix.programId = new PublicKey(ix.programId);
    }
  });
  const raydiumV4Ixs = allIxs.filter((ix) => ix.programId.equals(RAYDIUM_LP_V4));
  const raydiumClmmIxs = allIxs.filter((ix) => ix.programId.equals(RAYDIUM_CLMM));
  const jupiterIxs = allIxs.filter((ix) => ix.programId.equals(JUPITER_PROGRAM));
  const pumpfunIxs = allIxs.filter((ix) => ix.programId.equals(PUMP_FUN_PROGRAM));
  const splTokenIxs = allIxs.filter((ix) => ix.programId.equals(TOKEN_PROGRAM_ID));

  if (raydiumV4Ixs.length) {
    //console.log('Raydium v4 ixs found');
    decodedIxs.push(...raydiumV4Ixs.map((ix) => RAYDIUM_V4_IX_PARSER.parseInstruction(ix)));
    parsedTxn = RAYDIUM_V4_IX_PARSER.parseTransactionWithInnerInstructions(transaction);
    raydium_log_events = LOGS_PARSER.parse(parsedTxn, transaction.meta.logMessages);
  }
  if (raydiumClmmIxs.length) {
    //console.log('Raydium clmm ixs found');
    decodedIxs.push(...raydiumClmmIxs.map((ix) => RAYDIUM_CLMM_IX_PARSER.parseInstruction(ix)));
    parsedTxn = RAYDIUM_CLMM_IX_PARSER.parseTransactionWithInnerInstructions(transaction);
    //raydium_log_events = LOGS_PARSER.parse(parsedTxn, transaction.meta.logMessages);
  }
  if (pumpfunIxs.length) {
    //console.log('Pumpfun ixs found');
    decodedIxs.push(...pumpfunIxs.map((ix) => PUMP_FUN_IX_PARSER.parseInstruction(ix)));
    parsedTxn = PUMP_FUN_IX_PARSER.parseTransactionWithInnerInstructions(transaction);
    pump_events = PUMP_FUN_EVENT_PARSER.parseEvent(transaction);
  }
  if (jupiterIxs.length) {
    //console.log('Jupiter ixs found');
    //decodedIxs.push(...jupiterIxs.map((ix) => JUPITER_IX_PARSER.parseInstruction(ix)));
    //parsedTxn = JUPITER_IX_PARSER.parseTransactionWithInnerInstructions(transaction);
    //jup_events = JUPITER_EVENT_PARSER.parseEvent(transaction);
  }
  if (splTokenIxs.length) {
    //console.log('spl token ixs found');
    decodedIxs.push(...splTokenIxs.map((ix) => SPL_IXX_PARSER.parseInstruction(ix)));
  }

  // console.log(parsedTxn);

  const result = { instructions: decodedIxs, pump_events, jup_events, raydium_log_events };
  bnLayoutFormatter(result);
  // console.log(JSON.stringify({ result, signature }));
  return result;
}

function decodeJupiterTxn(tx) {
  if (tx.meta?.err) return;

  const TXN_FORMATTER = new TransactionFormatter();

  const PROGRAM_ID = new PublicKey(JUPITER_PROGRAM);

  const IX_PARSER = new SolanaParser([]);
  IX_PARSER.addParserFromIdl(PROGRAM_ID.toBase58(), jupiterV6Idl);

  const EVENT_PARSER = new SolanaEventParser([], console);

  EVENT_PARSER.addParserFromIdl(PROGRAM_ID.toBase58(), jupiterV6Idl);

  const paredIxs = IX_PARSER.parseTransactionData(tx.transaction.message, tx.meta.loadedAddresses);

  const programIxs = paredIxs.filter((ix) => ix.programId.equals(PROGRAM_ID));

  if (programIxs.length === 0) return;
  const events = EVENT_PARSER.parseEvent(tx);
  const result = { instructions: programIxs, events };
  bnLayoutFormatter(result);
  return result;
}

function decodePumpFunTxn(tx) {
  //   console.log(tx);

  if (tx.meta?.err) return;

  const PUMP_FUN_IX_PARSER = new SolanaParser([]);
  PUMP_FUN_IX_PARSER.addParserFromIdl(PUMP_FUN_PROGRAM_ID.toBase58(), pumpFunIdl);
  const PUMP_FUN_EVENT_PARSER = new SolanaEventParser([], console);
  PUMP_FUN_EVENT_PARSER.addParserFromIdl(PUMP_FUN_PROGRAM_ID.toBase58(), pumpFunIdl);

  //   const parsedIxs = PUMP_FUN_IX_PARSER.parseTransactionData(tx.transaction.message, tx.meta.loadedAddresses);

  const parsedIxs = PUMP_FUN_IX_PARSER.parseTransactionWithInnerInstructions(tx);
  const pumpFunIxs = parsedIxs.filter((ix) => ix.programId.equals(PUMP_FUN_PROGRAM_ID));
  console.log('::::::::::');
  const jupiterIxs = parsedIxs.filter((ix) => ix.programId.equals(new PublicKey(JUPITER_PROGRAM)));

  console.log(JSON.stringify(parsedIxs));

  //   console.log(pumpFunIxs);

  if (pumpFunIxs.length === 0) {
    console.log('Pumpfun ixs not found');
    return;
  }

  if (jupiterIxs.length > 0) {
    console.log('Jupiter Ixs found');
    PUMP_FUN_EVENT_PARSER.addParserFromIdl(JUPITER_PROGRAM, jupiterV6Idl);
  }
  const events = PUMP_FUN_EVENT_PARSER.parseEvent(tx);
  const result = { instructions: pumpFunIxs, events };
  bnLayoutFormatter(result);
  return result;
}

function decodeRaydiumTrx(tx) {
  if (tx.meta?.err) return;

  const RAYDIUM_PUBLIC_KEY = RaydiumAmmParser.PROGRAM_ID;
  const TXN_FORMATTER = new TransactionFormatter();
  const raydiumAmmParser = new RaydiumAmmParser();
  const IX_PARSER = new SolanaParser([]);
  IX_PARSER.addParser(RaydiumAmmParser.PROGRAM_ID, raydiumAmmParser.parseInstruction.bind(raydiumAmmParser));
  const LOGS_PARSER = new LogsParser();

  const parsedIxs = IX_PARSER.parseTransactionWithInnerInstructions(tx);

  const programIxs = parsedIxs.filter((ix) => ix.programId.equals(RAYDIUM_PUBLIC_KEY));

  if (programIxs.length === 0) return;
  const events = EVENT_PARSER.parseEvent(tx);
  const result = { instructions: programIxs, events };
  bnLayoutFormatter(result);
  return result;
}

function decodeRaydiumTrxWithLogs(tx) {
  if (tx.meta?.err) return;

  const RAYDIUM_PUBLIC_KEY = RaydiumAmmParser.PROGRAM_ID;
  const TXN_FORMATTER = new TransactionFormatter();
  const raydiumAmmParser = new RaydiumAmmParser();
  const IX_PARSER = new SolanaParser([]);
  IX_PARSER.addParser(RaydiumAmmParser.PROGRAM_ID, raydiumAmmParser.parseInstruction.bind(raydiumAmmParser));
  const LOGS_PARSER = new LogsParser();

  const parsedIxs = IX_PARSER.parseTransactionWithInnerInstructions(tx);

  const programIxs = parsedIxs.filter((ix) => ix.programId.equals(RAYDIUM_PUBLIC_KEY));

  if (programIxs.length === 0) return;
  const LogsEvent = LOGS_PARSER.parse(parsedIxs, tx.meta.logMessages);
  const result = { instructions: parsedIxs, events: LogsEvent };
  bnLayoutFormatter(result);
  return result;
}

function decodeRaydiumPoolCreation(tx) {
  if (tx.meta?.err) return;

  const TXN_FORMATTER = new TransactionFormatter();
  const RAYDIUM_PARSER = new RaydiumAmmParser();
  const RAYDIUM_PUBLIC_KEY = RaydiumAmmParser.PROGRAM_ID;

  const allIxs = TXN_FORMATTER.flattenTransactionResponse(tx);

  const raydiumIxs = allIxs.filter((ix) => ix.programId.equals(RAYDIUM_PUBLIC_KEY));

  const decodedIxs = raydiumIxs.map((ix) => RAYDIUM_PARSER.parseInstruction(ix));

  return decodedIxs;
}

module.exports = {
  decodeTxn,
};
