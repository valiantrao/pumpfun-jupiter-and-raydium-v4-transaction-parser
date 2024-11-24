
# Solana Transaction Parser

## Description
The **Solana Transaction Parser** to decode and analyze raw Solana transactions. It currently supports parsing transactions for the following programs:
- **Pumpfun**
- **Jupiter**
- **Raydium v4**

## How to Use
It exports a function `decodeTxn` from `index.js` that can be used to decode raw Solana transactions. 

### Function Signature
```javascript
await decodeTxn(rawTransaction): DecodedTransaction;
```

### Example Usage
```javascript
const { decodeTxn } = require('./index.js');

// Example raw transaction input
const rawTransaction = { /* transaction object here */ };

// Decode the transaction
const decodedData = await decodeTxn(rawTransaction);

console.log(decodedData);
```

### Response Format
The `decodeTxn` function returns a decoded transaction object with the following structure:

```json
{
  "instructions": [
    {
      "name": "buy",
      "accounts": [
        {
          "name": "global",
          "isSigner": false,
          "isWritable": false,
          "pubkey": "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"
        },
        ...
      ],
      "programId": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
      "args": {
        "amount": 113675035053,
        "maxSolCost": 30000000
      }
    },
    ...
  ],
  "pump_events": [
    {
      "data": {
        "mint": "DAfVJ14jtfGYJjjD6BBwReyPJiDRWegJt3QhHHxHpump",
        "solAmount": 15000000,
        "tokenAmount": 113675035053,
        "isBuy": true,
        "user": "KhZRiMiCkFUUq2jsz1GSiQsttrfCDKua3NB3viwt5hT",
        "timestamp": 1730451023,
        "virtualSolReserves": 65181379845,
        "virtualTokenReserves": 493852700879719
      },
      "name": "TradeEvent"
    },
    ...
  ],
  "jup_events": [],
  "raydium_log_events": [],
  "sign": "4hpnr2FSD3f26hPwpZrqjDG9GVGBHS3xyNjiSjbPhgnjBBfn97TfHv4g5vitzsB8jo4FdRH1x1sJxcqpxjmVPLCt"
}
```

### Key Fields in the Response:
- **instructions**: Detailed breakdown of transaction instructions, including associated accounts and arguments.
- **pump_events**: Events specific to the Pumpfun protocol, including trade details like `mint`, `solAmount`, and `tokenAmount`.
- **jup_events**: Events related to the Jupiter protocol (currently empty in this example).
- **raydium_log_events**: Events related to the Raydium protocol (currently empty in this example).
- **sign**: A string representation of the transaction signature.

## Supported Protocols
- Pumpfun
- Jupiter
- Raydium v4

Feel free to extend this library to support additional protocols as needed.

TG - @devalexio
