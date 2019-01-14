const ethers = require("ethers");

const STATE = {
  MINED: "MINED",
  NONCE_TOO_HIGH: "NONCE_TOO_HIGH",
  TEST: "TEST"
};

const Error = {
  NOT_COMPATIBLE: "This transaction seems to be not compatible with Ethereum transaction, please make sure you signed and copied it correctly so it looks like 0xf86c588509502f...",
  RAW: "This transaction looks like RAW unsigned transaction, please make sure you signed and copied it correctly so it looks like 0xf86c588509502f...",
  UNSIGNED: "The transaction format looks good but it seems to be unsigned, please make sure you signed and copied it correctly so it looks like 0xf86c588509502f...",
  NOT_SUPPORTED: "The network id you set is unfortunately not yet supported by Automate. The list of supported chains is Ethereum Mainnet, Ropsten, Kovan, Rinkeby."
}

const proto = {
  hash: "",
  to: "",
  from: "",
  nonce: "",
  gasLimit: "",
  gasPrice: "",
  data: "",
  value: "",
  chainId: 1,
  status: 1,
  contractAddress: "",
  transactionIndex: 0,
  root: "",
  gasUsed: 0,
  logsBloom: "",
  blockHash: "",
  transactionHash: "",
  logs: [{ transactionHash: "", logIndex: 0, topics: ["", ""] }],
  blockNumber: 0,
  confirmations: 0,
  cumulativeGasUsed: 0,
  byzantium: true,
  state: STATE.TEST
};

const validateTransaction = tx => {
  let parsed;
  try {
    tx = tx.trim();
    parsed = ethers.utils.parseTransaction(tx);
  } catch (err) {
    const raw = JSON.parse(tx);
    if (raw.nonce) {
      throw new Error(Error.RAW);
    }
    throw new Error(Error.NOT_COMPATIBLE);
  }

  if (!parsed.from) {
    throw new Error(Error.UNSIGNED);
  }
  try {
    ethers.utils.getNetwork(parsed.chainId);
  } catch (err) {
    throw new Error(Error.NOT_SUPPORTED);
  }

  return parsed;
};

const humanize = result => {
  for (const key in result) {
    if (result[key] instanceof ethers.utils.BigNumber) {
      result[key] = result[key].toString();
    }
  }
};

const executeTransaction = async (z, bundle) => {
  z.console.log("Inputs", bundle.inputData);

  const signedTransaction = bundle.inputData.Transaction;
  const parsed = validateTransaction(signedTransaction);
  const network = ethers.utils.getNetwork(parsed.chainId);
  const provider = ethers.getDefaultProvider(network);

  const senderNonce = await provider.getTransactionCount(parsed.from);

  let state = STATE.MINED;
  let result = { ...proto, ...parsed };

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
          "Signed Ethereum transaction. Automate expects correctly signed Ethereum transaction, please read our tutorial on how to do that `https://blog.chronologic.network/automate-meets-zapier-acd09d31c166`"
      }
    ],
    perform: executeTransaction,
    sample: {
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
      contractAddress: "0x1234",
      transactionIndex: 140,
      root: "0x4567",
      gasUsed: 100000,
      logsBloom: "0x223231231",
      blockHash:
        "0x40bc237b3902b94ae7e2d7fc3eed17c6e08ccb4e6a72797b3715a2ec24773506",
      transactionHash:
        "0x96f9333d012fb7fa4d60338b590f4006d68f9a573d1780d8c4e8a47520892804",
      logs: [
        {
          transactionHash:
            "0x96f9333d012fb7fa4d60338b590f4006d68f9a573d1780d8c4e8a47520892804",
          logIndex: 0,
          topics: ["0x1234", "0x2423"]
        }
      ],
      blockNumber: 100000,
      confirmations: 3,
      cumulativeGasUsed: 1000000,
      byzantium: true,
      state: STATE.MINED
    }
  }
};

module.exports = Transaction;
