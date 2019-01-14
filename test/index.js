const assert = require("assert");
const zapier = require("zapier-platform-core");

// Use this to make test calls into your app:
const App = require("../index");
const appTester = zapier.createAppTester(App);

describe("My App", () => {
  it("should throw when not compatible transaction", async () => {
    const bundle = {
      inputData: {
        Transaction: "0xbadtransaction"
      }
    };

    await assert.rejects(
      appTester(App.creates.transaction.operation.perform, bundle),
      Error.NOT_COMPATIBLE
    );
  });
  it("should humanize the results", async () => {
    const bundle = {
      inputData: {
        Transaction:
          "0xf86b578509502f900082520894eac4cf1e68f0d81b1abbce4152f2ef73b3f8f6ee872386f26fc100008078a0a7ede4b9016c810864f286d40e7a99eaf9bf2905fc6c65a1b3ee2dc8b4cb518aa06bb07576aa1759f838f4522b77e8b7dc20090d340bdc3d67a94ccc66f1aa4e69"
      },
      meta: {}
    };

    const result = await appTester(
      App.creates.transaction.operation.perform,
      bundle
    );

    assert.equal(result.gasLimit, 21000);
    assert.equal(result.gasPrice, 40000000000);
    assert.equal(result.value, 10000000000000000);
  });

  it("should trim transaction", async () => {
    const bundle = {
      inputData: {
        Transaction:
          " 0xf86b578509502f900082520894eac4cf1e68f0d81b1abbce4152f2ef73b3f8f6ee872386f26fc100008078a0a7ede4b9016c810864f286d40e7a99eaf9bf2905fc6c65a1b3ee2dc8b4cb518aa06bb07576aa1759f838f4522b77e8b7dc20090d340bdc3d67a94ccc66f1aa4e69      "
      },
      meta: {}
    };

    assert.ok(
      await appTester(App.creates.transaction.operation.perform, bundle)
    );
  });
});
