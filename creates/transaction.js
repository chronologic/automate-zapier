const ethers = require("ethers");

const MINED = "Mined";
const WAITING = "Waiting for nonce";
const NONCE_SPENT = "Nonce already spent";

const executeTransaction = async (z, bundle) => {
  z.console.log("Inputs", bundle.inputData);

  const signedTransaction = bundle.inputData.Transaction;
  const parsed = ethers.utils.parseTransaction(signedTransaction);
  const network = ethers.utils.getNetwork(parsed.chainId);
  const provider = ethers.getDefaultProvider(network);

  const currentNonce = await provider.getTransactionCount(parsed.from);
  const transactionNonce = parsed.nonce;

  let state = MINED;
  let result = parsed;

  if (transactionNonce < currentNonce) {
    state = NONCE_SPENT;
  } else if (transactionNonce > currentNonce) {
    state = WAITING;
  } else {
    const response = await provider.sendTransaction(signedTransaction);

    result = await response.wait(3);
    state = MINED;
  }

  return { ...result, state };
};

const Transaction = {
  key: "transaction",
  noun: "Transaction",
  display: {
    label: "Execute Ethereum Transaction",
    description: "Executes your signed Ethereum transaction using one of the public nodes."
  },
  operation: {
    inputFields: [
      {
        key: "Transaction",
        required: true,
        type: "string",
        helpText: "Signed Ethereum transaction. Automate expects correctly signed Ethereum transaction, please use one of the available Ethereum wallets for e.g https://www.myetherwallet.com/#offline-transaction "
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
      state: MINED
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
