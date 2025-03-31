const fs = require('fs');
const path = require('path');

const esbuild = require('esbuild');

const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

const wrapIIFEInStringPlugin = {
  name: 'wrap-iife-in-string',
  setup(build) {
    // Ensure write is set to false so our plugin will always receive outputFiles
    build.initialOptions.write = false;

    build.onEnd((result) => {
      if (result.errors.length > 0) {
        console.error('Build failed with errors:', result.errors);
        return;
      }

      result.outputFiles.forEach((outputFile) => {
        let content = outputFile.text;

        // Use JSON.stringify to safely encode the content
        const wrappedContent = `/**
 * DO NOT EDIT THIS FILE. IT IS GENERATED ON BUILD. RUN \`yarn generate-lit-actions\` IN THE ROOT DIRECTORY TO UPDATE THIS FILE.
 * @type {string}
 */
const code = ${JSON.stringify(content)};
module.exports = {
  code,
};
`;

        // Ensure the output directory exists
        const outputPath = path.resolve(outputFile.path);
        ensureDirectoryExistence(outputPath);

        // Write the modified content back to the output file
        fs.writeFileSync(outputPath, wrappedContent);
      });
    });
  },
};

const excludeReactNativeDependencies = {
  name: 'exclude-react-native-dependencies',
  setup(build) {
    build.onResolve({ filter: /^react-native-fast-pbkdf2$/ }, args => ({
      path: args.path,
      namespace: 'external-react-native-module',
    }));

    build.onLoad({ filter: /.*/, namespace: 'external-react-native-module' }, () => ({
      contents: 'module.exports = {};',
    }));
  },
};

(async () => {
  await esbuild.build({
    entryPoints: [
      // './src/lib/solana/signTransactionWithSolanaEncryptedKey.js',
      // './src/lib/solana/signMessageWithSolanaEncryptedKey.js',
      // './src/lib/solana/generateEncryptedSolanaPrivateKey.js',
      // './src/lib/ethereum/signTransactionWithEthereumEncryptedKey.js',
      // './src/lib/ethereum/signMessageWithEthereumEncryptedKey.js',
      // './src/lib/ethereum/generateEncryptedEthereumPrivateKey.js',
      // './src/lib/common/exportPrivateKey.js',
      // './src/lib/common/generateTonPrivateKey.js',
      // './src/lib/solana/partialSign.js',
      './src/lib/internal/common/sign-eip7702.js',
    ],
    bundle: true,
    minify: true,
    sourcemap: false,
    treeShaking: true,
    outdir: './src/generated/',
    inject: ['./buffer.shim.js'],
    plugins: [wrapIIFEInStringPlugin, excludeReactNativeDependencies],
    platform: 'browser',
  });
})();
