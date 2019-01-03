const ethers = require('ethers');

const SENT = "Sent";
const WAITING = "Waiting for nonce";
const NONCE_SPENT = "Nonce already spent";
const ALREADY_SENT = "Transaction already sent";

const executeTransaction = async (z, bundle) => {
  z.console.log('Inputs', bundle.inputData);

  const signedTransaction = bundle.inputData.Transaction;
  const parsed = ethers.utils.parseTransaction(signedTransaction);
  const network = ethers.utils.getNetwork(parsed.chainId);
  const provider = ethers.getDefaultProvider(network);

  const currentNonce = await provider.getTransactionCount(parsed.from);
  const transactionNonce = parsed.nonce;

  if (transactionNonce < currentNonce) {
    return { transaction: signedTransaction, state: NONCE_SPENT} 
  } else if (transactionNonce > currentNonce) {
    return { transaction: signedTransaction, state: WAITING }
  }

  const response = await provider.sendTransaction(signedTransaction);
  const receipt = await response.wait(3);

  receipt.state = SENT;

  return receipt;
};

const Transaction = {
  key: 'transaction',
  noun: 'Transaction',
  display: {
    label: 'Execute Transaction',
    description: 'Executes your transaction'
  },
  operation: {
    inputFields: [
      {key: 'Transaction', required: true, type: 'string', helpText: 'Signed transaction'}
    ],
    perform: executeTransaction,

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      transaction: '0x',
      hash: '0x96f9333d012fb7fa4d60338b590f4006d68f9a573d1780d8c4e8a47520892804',
      to: '0xe4e9dde021ef7dd34b551ec975ef38135ce44ff6',
      from: '0x94f0f15864cbb346469ab5ef1a07a0a5351effd8',
      nonce: 7,
      gasLimit: '40002',
      gasPrice: '1000000000',
      data: '',
      value: '1000000000000000000',
      chainId: 1,
      status: 1,
      state: SENT
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    // outputFields: () => { return []; }
    // Alternatively, a static field definition should be provided, to specify labels for the fields
    outputFields: [
      {key: 'state', label: 'Execution state'},
      {key: 'Transaction', label: 'Signed transaction'},
      {key: 'hash', label: 'Transaction hash'},
      {key: 'to', label: 'Transaction recipient'},
      {key: 'from', label: 'Transaction sender'},
      {key: 'nonce', label: 'Transaction nonce'},
      {key: 'gasLimit', label: 'Gas limit'}
    ]
  }
};

module.exports = Transaction;