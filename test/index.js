const assert = require("assert");
const zapier = require("zapier-platform-core");

// Use this to make test calls into your app:
const App = require("../index");
const appTester = zapier.createAppTester(App);
const { ErrorMessage } = require("../creates/transaction");

describe("My App", () => {
  it("should throw when not compatible transaction", async () => {
    const bundle = {
      inputData: {
        Transaction: "0xbadtransaction"
      }
    };

    await assert.rejects(
      appTester(App.creates.transaction.operation.perform, bundle),
      ErrorMessage.NOT_COMPATIBLE
    );
  });
  it("should humanize the results", async () => {
    const bundle = {
      inputData: {
        Transaction:
          "0xf86c808509502f900082520894fad1c1406bfee6e3a3d2e7c0258c804407b501fc880de0b6b3a76400008078a02ec015e47e5ef0b91efccb6a0d27e8533f61e20cb5f54b0ef5c365ed7592fe9ea011e2a257795e54a662524ef11b33984c07de8ca8fdacc3de2a2a232be7541a74"
      },
      meta: {
        frontend: true
      }
    };

    const result = await appTester(
      App.creates.transaction.operation.perform,
      bundle
    );

    assert.equal(result.gasLimit, 21000);
    assert.equal(result.gasPrice, 40000000000);
    assert.equal(result.value, 1000000000000000000);
    assert.equal(result.humanReadableValue, 1);
  });

  it("should decode erc20 transfer", async () => {
    const bundle = {
      inputData: {
        Transaction:
          "0xf8aa808509502f9000830249f0945a6b5c6387196bd4ea264f627792af9d0909687680b844a9059cbb000000000000000000000000fad1c1406bfee6e3a3d2e7c0258c804407b501fc0000000000000000000000000000000000000000000000008ac7230489e8000077a03585f9b7b748ff0daa39bebf9cb0b2a001b9de29f6447e6b03a6bbc1869de32da00b9c754d577367eeec91af46db9d2dd9a3b13ae5a0ee0da65ebb34c597dcadfe"
      },
      meta: {
        frontend: true
      }
    };

    const result = await appTester(
      App.creates.transaction.operation.perform,
      bundle
    );

    assert.equal(result.gasLimit, 150000);
    assert.equal(result.gasPrice, 40000000000);
    assert.equal(result.value, 0);
    assert.equal(result.humanReadableValue, 0);
    assert.equal(result.tokenName, "DAY");
    assert.equal(result.tokenAmount, 10*(10**18));
    assert.equal(result.tokenRecipient, "0xFAd1c1406BFee6E3A3D2E7c0258c804407B501Fc");
  }).timeout(5000);

  it("should trim transaction", async () => {
    const bundle = {
      inputData: {
        Transaction:
          " 0xf86c808509502f900082520894fad1c1406bfee6e3a3d2e7c0258c804407b501fc880de0b6b3a76400008078a02ec015e47e5ef0b91efccb6a0d27e8533f61e20cb5f54b0ef5c365ed7592fe9ea011e2a257795e54a662524ef11b33984c07de8ca8fdacc3de2a2a232be7541a74      "
      },
      meta: {
        frontend: true
      }
    };

    assert.ok(
      await appTester(App.creates.transaction.operation.perform, bundle)
    );
  });
});
