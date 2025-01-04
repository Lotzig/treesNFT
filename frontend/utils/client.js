import { createPublicClient, http } from "viem";
import {  hardhat, sepolia } from 'viem/chains';
const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || "";

// // Déploiement local
// export const publicClient = createPublicClient({
//     chain: hardhat,
//     transport: http(),
// })

//Déploiement Sepolia
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC),
})
