'use client';
import { useState, useEffect } from "react";
// Pour le layout
import { useToast } from "../ui/use-toast"; // Toast Shadcn/ui
import { Button } from "../ui/button"; // Bouton Shadcn/ui
import { Input } from "../ui/input"; // Input Shadcn/ui

//Contract access
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { mkpContractAddress, mkpContractAbi, nftContractAddress } from "@/constants";

// Child components
import TreeNFT from "./TreeNFT";


const ForSale = () => {

  const { address } = useAccount()
  const { toast } = useToast() // Toast Shadcn/ui
  const { data: hash, error, isPending: setIsPending, writeContract } = useWriteContract({
    mutation: {
      // onSuccess: () => {

      // },
      // onError: (error) => {

      // }
    }
  })

 
  // Get for sale TreeNFTs
  const { data: fetchedForSaleTreeNFTs, error: fetchedForSaleTreeNFTsError, isPending: fetchedForSaleTreeNFTsIsPending
        , refetch: refetchForSaleTreeNFTs } = useReadContract({
    address: mkpContractAddress,
    abi: mkpContractAbi,
    functionName: 'fetchItemsForSale',
  })

  const { isLoading: isConfirming, isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
    hash // le hash de la transaction, récupéré par le useWriteContract de Wagmi
  })

  const [tokenTreeKey, setTokenTreeKey] = useState(0);
  const [price, setPrice] = useState(0);
  
  useEffect(() => {
    // Si erreur chargement des TreeNFTs
    if(fetchedForSaleTreeNFTsError) {
      toast({
          title: "For sale TreeNFTs loading error",
          description: fetchedForSaleTreeNFTsError.shortMessage, 
          variant: "destructive",
          status: "error",
          duration: 4000,
          isClosable: true,
      });
    }


    // Si succès purchaseItem
    if(isSuccess) {
      toast({
        title: "Transaction success",
        description: "Transaction succeeded",
        className: "bg-lime-200",
        isClosable: true,
      })
      refetchForSaleTreeNFTs()
    }
   
    // Erreur transaction purchaseItem
    if(errorConfirmation) {
      toast({
          title: "Transaction error",
          description: errorConfirmation.shortMessage, 
          variant: "destructive",
          status: "error",
          duration: 4000,
          isClosable: true,
      });
    }

    // Si erreur avant transaction purchaseItem
    if(error) {
      toast({
          title: "Error",
          description: error.shortMessage,
          variant: "destructive", 
          status: "error",
          duration: 4000,
          isClosable: true,
      });
    }
  }, [fetchedForSaleTreeNFTsError, isSuccess, errorConfirmation, error])

  const purchaseItem = async(itemId, price) => {
    writeContract({
      address: mkpContractAddress,
      abi: mkpContractAbi,
      functionName: 'purchaseItem',
      args: [ nftContractAddress, itemId ],
      value: BigInt(price)
    })
  }  



  return (
    <>
      <div className="text-4xl">MARKET</div>

      <h2 className="mt-6 mb-4 text-3xl">Available TreeNFT collection</h2>
      <div className="flex flex-col w-full">
          {fetchedForSaleTreeNFTsIsPending ? 
            ( <div>Loading...</div>
            ) : 
            ( fetchedForSaleTreeNFTs?.length > 0 && fetchedForSaleTreeNFTs.map((treeNFT) => {
                return (
                  <div className="flex">
                    <TreeNFT treeNFT={treeNFT} key={crypto.randomUUID()} />
                    <Button variant="outline" disabled={setIsPending} onClick={() => purchaseItem(treeNFT.itemId, treeNFT.price)} className="text-lg">Purchase</Button>
                  </div>
                )  
              })
            )
          }  
      </div>

    </>
  )
}

export default ForSale