const ethers = require("ethers");

const STATE = {
  MINED: "MINED",
  NONCE_TOO_HIGH: "NONCE_TOO_HIGH",
  TEST: "TEST"
};

const validateTransaction = tx => {
  let parsed;
  try {
    parsed = ethers.utils.parseTransaction(tx);
  } catch(err) {
    throw new Error("Not compatible Ethereum transaction");
  }
  
  if (!parsed.from) {
    throw new Error("Transaction not signed");
  }
  try {
    ethers.utils.getNetwork(parsed.chainId)
  } catch(err) {
    throw new Error("Unsupported network id = " + parsed.chainId)
  }

  return parsed;
};

const humanize = result => {
  for(const key in result) {
    if (result[key] instanceof ethers.utils.BigNumber) {
      result[key] = result[key].toString();
    }
  }
}

const executeTransaction = async (z, bundle) => {
  z.console.log("Inputs", bundle.inputData);

  const signedTransaction = bundle.inputData.Transaction;
  const parsed = validateTransaction(signedTransaction);
  const network = ethers.utils.getNetwork(parsed.chainId);
  const provider = ethers.getDefaultProvider(network);

  const senderNonce = await provider.getTransactionCount(parsed.from);

  let state = STATE.MINED;
  let result = parsed;

  if (bundle.meta.frontend) {
    state = STATE.TEST;
  } else if (parsed.nonce > senderNonce) {
    state = STATE.NONCE_TOO_HIGH;
  } else if (parsed.nonce === senderNonce) {
    const response = await provider.sendTransaction(signedTransaction);

    result = await response.wait(3);
  }

  humanize(result);

  return { ...result, state, senderNonce };
};

const Transaction = {
  key: "transaction",
  noun: "Transaction",
  display: {
    label: "Execute Ethereum Transaction",
    description:
      "Executes your signed Ethereum transaction using one of the public nodes."
  },
  operation: {
    inputFields: [
      {
        key: "Transaction",
        required: true,
        type: "string",
        helpText:
          "Signed Ethereum transaction. Automate expects correctly signed Ethereum transaction, please use one of the available Ethereum wallets for e.g `https://www.myetherwallet.com/#offline-transaction`"
      }
    ],
    perform: executeTransaction,
    sample: {
      transaction: "0x",
      hash:
        "0x96f9333d012fb7fa4d60338b590f4006d68f9a573d1780d8c4e8a47520892804",
      to: "0xe4e9dde021ef7dd34b551ec975ef38135ce44ff6",
      from: "0x94f0f15864cbb346469ab5ef1a07a0a5351effd8",
      nonce: 7,
      gasLimit: "40002",
      gasPrice: "1000000000",
      data: "",
      value: "1000000000000000000",
      chainId: 1,
      status: 1,
      state: STATE.MINED
    },
    outputFields: [
      { key: "state", label: "Execution state" },
      { key: "Transaction", label: "Signed transaction" },
      { key: "hash", label: "Transaction hash" },
      { key: "to", label: "Transaction recipient" },
      { key: "from", label: "Transaction sender" },
      { key: "nonce", label: "Transaction nonce" },
      { key: "gasLimit", label: "Gas limit" }
    ]
  }
};

module.exports = Transaction;
