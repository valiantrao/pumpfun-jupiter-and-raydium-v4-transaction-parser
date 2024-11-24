// const { ParsedInstruction, parseLogs } = require('@shyft-to/solana-transaction-parser');
// const { Idl } = require('@project-serum/anchor');
// const { RaydiumAmmParser } = require('../raydium-amm-parser');
// const { RaydiumAmmLogsParser } = require('./raydium-amm-logs-parser');

let RaydiumAmmParser;
let RaydiumAmmLogsParser;

function getRaydiumAmmParser() {
  if (!RaydiumAmmParser) {
    RaydiumAmmParser = require('../raydium-amm-parser');
  }
  return RaydiumAmmParser;
}

function getRaydiumAmmLogsParser() {
  if (!RaydiumAmmLogsParser) {
    RaydiumAmmLogsParser = require('./raydium-amm-logs-parser');
  }
  return RaydiumAmmLogsParser;
}

const { ParsedInstruction, parseLogs } = require('@shyft-to/solana-transaction-parser');
const { Idl } = require('@project-serum/anchor');

const RAYDIUM_AMM_PROGRAM_ID = getRaydiumAmmParser().RaydiumAmmParser.PROGRAM_ID.toBase58();

class LogsParser {
  constructor() {
    this.raydiumAmmLogsParser = new (getRaydiumAmmLogsParser().RaydiumAmmLogsParser)();
  }
  parse(actions, logMessages) {
    if (!this.isValidIx(actions)) {
      return [];
    }

    const logs = parseLogs(logMessages);

    return actions
      .map((action, index) => {
        if ('info' in action) {
          return;
        } else {
          const programId = action.programId.toBase58();
          switch (programId) {
            case RAYDIUM_AMM_PROGRAM_ID: {
              return this.raydiumAmmLogsParser.parse(action, logs[index]);
            }
            default:
              return;
          }
        }
      })
      .filter((log) => Boolean(log));
  }

  isValidIx(actions) {
    return actions.some((action) => action.programId.toBase58() === RAYDIUM_AMM_PROGRAM_ID);
  }
}

module.exports = {
  LogsParser,
};
