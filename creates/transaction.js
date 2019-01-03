// We recommend writing your creates separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: 'transaction',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Transaction',
  display: {
    label: 'Execute Transaction',
    description: 'Executes your transaction'
  },

  // `operation` is where the business logic goes.
  operation: {
    inputFields: [
      {key: 'Transaction', required: true, type: 'string', helpText: 'Signed transaction'}
    ],
    perform: (z, bundle) => {
      z.console.log('Inputs', bundle.inputData);

      return {txHash: '0x1234txhash'};
    },

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      tx: '0x1234'
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    // outputFields: () => { return []; }
    // Alternatively, a static field definition should be provided, to specify labels for the fields
    outputFields: [
      {key: 'Transaction', label: 'Signed transaction'}
    ]
  }
};