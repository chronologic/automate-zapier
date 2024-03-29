const ethers = require("ethers");
const utils = require("ethers/utils");
const ERC20 = require("./erc20");
const KeenTracking = require('keen-tracking');

const keenClient = new KeenTracking({
  projectId: '5c656583c9e77c000121bc36',
  writeKey: 'CC8B6ACCBF5F7205E90631F5233910F66BA6AD342B524DD90EAD72863B0167B7D261B62C2C553DBDAB5FF5C102CF5E32EA9D902C5A94B1E0F891DF21DBEC5D64C6B376FB3D6CF938B6EC9F66646FE2404B399EC51D1707610AE6C5F29CCA3B5D'
});

const STATE = {
  MINED: "MINED",
  NONCE_TOO_HIGH: "NONCE_TOO_HIGH",
  TEST: "TEST"
};

const ErrorMessage = {
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
  humanReadableValue: "",
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
    let raw;
    try {
      raw = JSON.parse(tx);
    } catch(e) {
      throw new Error(ErrorMessage.NOT_COMPATIBLE);
    }
    if (raw.nonce) {
      throw new Error(ErrorMessage.RAW);
    }
  }

  if (!parsed.from) {
    throw new Error(ErrorMessage.UNSIGNED);
  }
  try {
    ethers.utils.getNetwork(parsed.chainId);
  } catch (err) {
    throw new Error(ErrorMessage.NOT_SUPPORTED);
  }

  return parsed;
};

const humanize = result => {
  result.humanReadableValue = utils.formatEther(result.value);
  
  for (const key in result) {
    if (result[key] instanceof ethers.utils.BigNumber) {
      result[key] = result[key].toString();
    }
  }
};

const tryDecodeTokenTransfer = async (parsed) => {
  let res = {};

  try {
    const token = new ethers.Contract(
      parsed.to,
      ERC20,
      ethers.getDefaultProvider(ethers.utils.getNetwork(parsed.chainId))
    );

    const name = await token.name();
    const decimals = await token.decimals();
    
    const callDataParameters = '0x' + parsed.data.substring(10);
    const params = ethers.utils.defaultAbiCoder.decode(
      ['address', 'uint256'],
      callDataParameters
    );

    res = {
      tokenName: name,
      tokenRecipient: params[0],
      tokenAmount: params[1],
      tokenHumanReadableAmount: utils.formatUnits(params[1], decimals) 
    }
  } catch (e) {}

  return res;
}

const executeTransaction = async (z, bundle) => {
  z.console.log("Inputs", bundle.inputData);

  const signedTransaction = bundle.inputData.Transaction;
  const parsed = validateTransaction(signedTransaction);
  const network = ethers.utils.getNetwork(parsed.chainId);
  const provider = ethers.getDefaultProvider(network);

  const senderNonce = await provider.getTransactionCount(parsed.from);
  const tokenInfo = await tryDecodeTokenTransfer(parsed);

  let state = STATE.MINED;
  let executionResult = { ...proto, ...parsed, ...tokenInfo };

  if (bundle.meta.frontend) {
    state = STATE.TEST;
  } else if (parsed.nonce > senderNonce) {
    state = STATE.NONCE_TOO_HIGH;
  } else if (parsed.nonce === senderNonce) {
    const response = await provider.sendTransaction(signedTransaction);

    executionResult = await response.wait(3);
  }

  humanize(executionResult);

  const result =  { ...executionResult, state, senderNonce };

  keenClient.recordEvent("execution", result);

  return result;
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
      humanReadableValue:  "1",
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

module.exports = { Transaction, ErrorMessage };
