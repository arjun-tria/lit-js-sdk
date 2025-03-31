import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { code as broadcastEip7702TransactionCode } from './src/generated/sign-eip7702';

async function execute() {

    const litNodeClient = new LitNodeClientNodeJs({
        alertWhenUnauthorized: false,
        litNetwork: "datil",
        rpcUrl: process.env.LIT_PRIVATE_RPC,
        debug: true
    });

    const sessionSig = {};

    await litNodeClient.connect();

    const txParams = [
        {
            "to": "0x2723A2756ecb99b3B50f239782876fB595728AC0",
            "value": "100000000000000"
        },
        {
            "to": "0x2723A2756ecb99b3B50f239782876fB595728AC0",
            "value": "200000000000000"
        }
    ]

    const chainConfig = {
        id: 11_155_111,
        name: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: {
                http: ['https://sepolia.drpc.org'],
            },
        },
    }

    const SIMPLE_7702_ACCOUNT_IMPLEMENTATION = '0x0E2DAdd8081919CD0534c4144A74204f2dB229ec';
    const pimlicoApiKey = 'pim_bdsKFsn3mcYovDPUNqMn7U';

    try {
        const result = await litNodeClient.executeJs({
            code: broadcastEip7702TransactionCode,
            sessionSigs: sessionSig,
            jsParams: {
                transactionArray: txParams,
                chainConfig,
                pimlicoApiKey,
                simpleAccountImplementation: SIMPLE_7702_ACCOUNT_IMPLEMENTATION,
            },
        });
        console.log(result);
    } catch (e) {
        console.log(e);
    }
}

execute();