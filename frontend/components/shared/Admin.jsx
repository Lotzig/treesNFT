'use client';
import { useState, useEffect } from "react";

// Pour le layout
import { useToast } from "../ui/use-toast"; // Toast Shadcn/ui

//Contract access
import { useReadContract, useAccount } from "wagmi";
import { mkpContractAddress, mkpContractAbi } from "@/constants";

// Child components
import TreeNFT from "./TreeNFT";


const Admin = () => {

  const { toast } = useToast() // Toast Shadcn/ui
  const { address } = useAccount();

  const { data: FetchedItems, error: FetchedItemsError, isPending: FetchedItemsIsPending, refetch } = useReadContract({
    address: mkpContractAddress,
    abi: mkpContractAbi,
    account: address,
    functionName: 'fetchAllItems',
  })
  
  useEffect(() => {
    // Si erreur récupération des TreeNFTs
    if(FetchedItemsError) {
      toast({
          title: "Transaction error",
          description: errorConfirmation.shortMessage, 
          variant: "destructive",
          status: "error",
          duration: 4000,
          isClosable: true,
      });
    }
  }, [FetchedItemsError])



  return (
    <>
      <div className="text-4xl">ADMINISTRATION</div>

      <h2 className="mt-6 mb-4 text-3xl">TreeNFT whole collection</h2>
      <div className="flex flex-col w-full">
          {FetchedItemsIsPending ? 
            ( <div>Loading...</div>
            ) : 
            ( FetchedItems.length > 0 && FetchedItems.map((treeNFT) => {
                return (
                  <TreeNFT treeNFT={treeNFT} key={crypto.randomUUID()} />
                )  
              })
            )
          }  
      </div>
    </>
  )
}

export default Admin