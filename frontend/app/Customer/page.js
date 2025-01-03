'use client';
import { useState, useEffect } from "react";
import Link from 'next/link';

// Pour le layout
import { useToast } from "@/components/ui/use-toast"; // Toast Shadcn/ui

//Contract access
import { useReadContract, useAccount } from "wagmi";
import { mkpContractAddress, mkpContractAbi } from "@/constants";

// Child components
import TreeNFT from "@/components/shared/TreeNFT";


export default function Customer() {

    const { toast } = useToast() // Toast Shadcn/ui
    const { address } = useAccount()
   
    // Get customer TreeNFTs
    const { data: fetchedCustomerTreeNFTs, error: fetchedCustomerTreeNFTsError, isPending: fetchedCustomerTreeNFTsIsPending
          , refetch: refetchCustomerTreeNFTs } = useReadContract({
      address: mkpContractAddress,
      abi: mkpContractAbi,
      account: address,
      functionName: 'fetchUserItems',
      args: [ address ],
    });
  
    
    useEffect(() => {
      // Si erreur chargement des TreeNFTs
      if(fetchedCustomerTreeNFTsError) {
        toast({
            title: "TreeNFTs loading error",
            description: fetchedCustomerTreeNFTsError.shortMessage, 
            variant: "destructive",
            status: "error",
            duration: 4000,
            isClosable: true,
        });
      }
    }, [fetchedCustomerTreeNFTsError])
  

    
    return (
        <>
            <div className="flex">
                <div className="text-4xl pr-20">MY TreeNFT</div>
                <Link className="text-3xl text-blue-600 underline" href="/">Go to the Marketplace</Link>
            </div>

            <h2 className="mt-6 mb-4 text-3xl">My TreeNFT collection</h2>
            <div className="flex flex-col w-full">
                {fetchedCustomerTreeNFTsIsPending ? 
                    ( <div>Loading...</div>
                    ) : 
                    ( fetchedCustomerTreeNFTs?.length > 0 && fetchedCustomerTreeNFTs.map((treeNFT) => {
                        return (
                        <div className="flex">
                            <TreeNFT treeNFT={treeNFT} key={crypto.randomUUID()} />
                        </div>
                        )  
                    })
                    )
                }  
            </div>
        </>
    );
  }
