import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { getPkpSessionSigs } from 'local-tests/setup/session-sigs/get-pkp-session-sigs';
import { TinnyEnvironment } from 'local-tests/setup/tinny-environment';

/**
 * Test Commands:
 * ✅ NETWORK=datil-dev yarn test:local --filter=testPkpEthersWithPkpSessionSigsToSignMessage
 * ✅ NETWORK=datil-test yarn test:local --filter=testPkpEthersWithPkpSessionSigsToSignMessage
 * ✅ NETWORK=custom yarn test:local --filter=testPkpEthersWithPkpSessionSigsToSignMessage
 */
export const testPkpEthersWithPkpSessionSigsToSignMessage = async (
  devEnv: TinnyEnvironment
) => {
  const alice = await devEnv.createRandomPerson();
  const pkpSessionSigs = await getPkpSessionSigs(devEnv, alice);

  const pkpEthersWallet = new PKPEthersWallet({
    litNodeClient: devEnv.litNodeClient,
    pkpPubKey: alice.pkp.publicKey,
    controllerSessionSigs: pkpSessionSigs,
  });

  await pkpEthersWallet.init();

  // -- test signMessage
  try {
    const signature = await pkpEthersWallet.signMessage(alice.loveLetter);
    console.log('✅ signature:', signature);
  } catch (e) {
    throw new Error('❌ Error: ' + e.message);
  } finally {
    devEnv.releasePrivateKeyFromUser(alice);
  }
};
