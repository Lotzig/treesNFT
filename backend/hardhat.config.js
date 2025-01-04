require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomicfoundation/hardhat-verify");
require('hardhat-docgen');

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "7cdf0643b1d593a5fe60616efa17ed31aaaa715d71fe31fcc4d1368b397badf0";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  // Spécifie le réseau par défaut pour Hardhat, qui est défini sur "hardhat".
  defaultNetwork: "hardhat",
  // Définit les configurations pour différents réseaux. Dans cet exemple, 
  // il y a un réseau "sepolia" (chaine de blocs fictive) et un réseau "localhost"
  // pour le développement en local.
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111,
      blockConfirmations: 6,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  // Active le rapporteur de gaz (gas reporter) pour afficher les coûts de gaz 
  // lors des déploiements et des transactions.
  gasReporter: {
    enabled: true,
  }, 
  // /!\  Permet de configurer la vérifications sur Etherscan
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
   // /!\ 
  // Configure les compilateurs Solidity utilisés par Hardhat. 
  solidity: {
    compilers: [
      {
        version: "0.8.26",
      },
    ],
  },
  // For hardhat-docgen documentation generator
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  },
};

