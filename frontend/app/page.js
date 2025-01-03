'use client';
import NotConnected from "@/components/shared/NotConnected";
import Admin from "@/components/shared/Admin";
import ForSale from "@/components/shared/ForSale";
import { useAccount, useReadContract } from "wagmi";
import { nftContractAddress, nftContractAbi } from "@/constants";

export default function Home() {

  const { isConnected, address: userAddress } = useAccount()
  
  const { data: owner } = useReadContract({
    address: nftContractAddress,
    abi: nftContractAbi,
    functionName: 'owner',
  })

  return (
     <>
        {
          isConnected ? (
            userAddress == owner ? (
              <Admin/>
            ) : (
              <ForSale/> 
            )
          ) : (
            <NotConnected />
          )
        }
    </>
  );
}
