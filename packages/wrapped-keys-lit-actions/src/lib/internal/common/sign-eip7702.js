import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { entryPoint07Address } from 'viem/account-abstraction';
import { createSmartAccountClient, deepHexlify } from 'permissionless';
import { removeSaltFromDecryptedKey } from '../utils';

(async () => {
  console.time('sendBatchTransaction');

  let decryptedPrivateKey;
  try {
    decryptedPrivateKey = await Lit.Actions.decryptToSingleNode({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      chain: 'ethereum',
      authSig: null,
    });
  } catch (err) {
    const errorMessage =
      'Error: When decrypting to a single node- ' + err.message;
    Lit.Actions.setResponse({ response: errorMessage });
    return;
  }

  if (!decryptedPrivateKey) {
    // Exit the nodes which don't have the decryptedData
    return;
  }

  try {
    const privateKey = removeSaltFromDecryptedKey(decryptedPrivateKey);
    const pimlicoUrl = `https://api.pimlico.io/v2/${chainConfig.id}/rpc?apikey=${pimlicoApiKey}`;

    // Create wallet client
    console.time('createWalletClient');
    const walletClient = createWalletClient({
      account: privateKeyToAccount(privateKey),
      chain: chainConfig,
      transport: http(),
    });
    console.timeEnd('createWalletClient');

    // Create public client
    console.time('createPublicClient');
    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(),
    });
    console.timeEnd('createPublicClient');

    // Create pimlico client
    console.time('createPimlicoClient');
    const pimlicoClient = createPimlicoClient({
      transport: http(pimlicoUrl),
    });
    console.timeEnd('createPimlicoClient');

    // Create smart account
    console.time('toSimpleSmartAccount');
    const smartAccount = await toSimpleSmartAccount({
      address: walletClient.account.address,
      client: publicClient,
      owner: walletClient.account,
    });
    console.timeEnd('toSimpleSmartAccount');

    // Create smart account client
    console.time('createSmartAccountClient');
    const smartAccountClient = createSmartAccountClient({
      account: smartAccount,
      bundlerTransport: http(pimlicoUrl),
    });
    console.timeEnd('createSmartAccountClient');

    const SIMPLE_7702_ACCOUNT_IMPLEMENTATION = simpleAccountImplementation;

    // Fill out initial values.
    let userOperation = {};
    userOperation.sender = walletClient.account.address;

    const [nonce, callData, signature, gasInfo] = await Promise.all([
      smartAccount.getNonce(),
      smartAccount.encodeCalls(transactionArray),
      smartAccount.getStubSignature(userOperation),
      pimlicoClient.getUserOperationGasPrice(),
    ]);

    userOperation.nonce = nonce;
    userOperation.callData = callData;
    userOperation.signature = signature;

    userOperation = {
      ...userOperation,
      ...gasInfo.fast,
      eip7702Auth: {
        contractAddress: SIMPLE_7702_ACCOUNT_IMPLEMENTATION,
        chainId: chainConfig.id,
        nonce: 0,
        r: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        s: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        v: 1n,
        yParity: 1,
      },
    };

    // Helper to convert hex to bigint where needed
    const convertHexToBigInt = (obj) => {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('0x')) {
          // Convert hex strings to bigint for gas properties
          if (
            [
              'callGasLimit',
              'verificationGasLimit',
              'preVerificationGas',
            ].includes(key)
          ) {
            result[key] = BigInt(value);
          } else {
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    // Fill out stub paymaster data.
    console.time('getPaymasterStubData');
    const stub = await pimlicoClient.getPaymasterStubData({
      ...userOperation,
      chainId: chainConfig.id,
      entryPointAddress: entryPoint07Address,
    });
    console.timeEnd('getPaymasterStubData');

    userOperation = { ...userOperation, ...stub };

    // Sign authorization
    console.time('signAuthorization');
    const signedAuthorization = await walletClient.signAuthorization({
      contractAddress: SIMPLE_7702_ACCOUNT_IMPLEMENTATION,
      delegate: true,
    });
    console.timeEnd('signAuthorization');

    // Estimate gas
    console.time('Estimate gas');
    const gasEstimates = await smartAccountClient.request({
      method: 'eth_estimateUserOperationGas',
      params: [
        deepHexlify({ ...userOperation, eip7702Auth: signedAuthorization }),
        entryPoint07Address,
      ],
    });
    console.timeEnd('Estimate gas');

    userOperation = {
      ...userOperation,
      ...convertHexToBigInt(gasEstimates),
    };

    // Get sponsor fields.
    console.time('getPaymasterData');
    const sponsorFields = await pimlicoClient.getPaymasterData({
      ...userOperation,
      chainId: chainConfig.id,
      entryPointAddress: entryPoint07Address,
    });
    console.timeEnd('getPaymasterData');

    userOperation = {
      ...userOperation,
      ...convertHexToBigInt(sponsorFields),
    };

    // Sign user operation.
    console.time('signUserOperation');
    userOperation.signature = await smartAccount.signUserOperation(userOperation);
    console.timeEnd('signUserOperation');

    // Send user operation
    console.time('Send user operation');
    const hash = await smartAccountClient.request({
      method: 'eth_sendUserOperation',
      params: [
        deepHexlify({ ...userOperation, eip7702Auth: signedAuthorization }),
        entryPoint07Address,
      ],
    });
    console.timeEnd('Send user operation');

    // Wait for user operation receipt
    console.time('Wait for user operation receipt');
    const { receipt } = await smartAccountClient.waitForUserOperationReceipt({ hash });
    
    console.timeEnd('Wait for user operation receipt');

    console.timeEnd('sendBatchTransaction');

    console.log(
      `UserOperation included: https://sepolia.etherscan.io/tx/${receipt.transactionHash}`
    );

    Lit.Actions.setResponse({ response: receipt.transactionHash });
  } catch (error) {
    console.log('Error', error);
    Lit.Actions.setResponse({ response: error.message });
  }
})();
