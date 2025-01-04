'use client'

import { useEffect, useState } from 'react';
import { useReadContract, useAccount } from "wagmi";
import { nftContractAddress, nftContractAbi } from "@/constants";
import Image from 'next/image'
import Accueil from '@/images/Accueil.jpg'
import { PinataSDK } from "pinata-web3";
import { useToast } from "../ui/use-toast"; // Toast Shadcn/ui


const TreeNFT = ({ treeNFT }) => {

  // Get passed TreeNFT token URI
  //-----------------------------
  const { userAddress } = useAccount()
  const { toast } = useToast() // Toast Shadcn/ui
  const [tokenURI, setTokenURI] = useState(null);

  // Get TreeNFT token URI from NFT contract
  const { data: treeNftTokenUri, error: treeNftTokenUriError, isPending: treeNftTokenUriPending
        , refetch: refetchTreeNftTokenUri } = useReadContract({
    address: nftContractAddress,
    abi: nftContractAbi,
    account: userAddress,
    functionName: 'tokenURI',
    args: [ treeNFT.tokenId ],
  })

  useEffect(() => {
    // Si erreur récup URI
    if(treeNftTokenUriError) {
      toast({
          title: "TreeNFT token URI fetching error",
          description: treeNftTokenUriError.shortMessage, 
          variant: "destructive",
          status: "error",
          duration: 4000,
          isClosable: true,
      });
    }

    // Si succès récup URI
    if(treeNftTokenUri) {
      setTokenURI(treeNftTokenUri)
    }
   
  }, [treeNftTokenUriError, treeNftTokenUri ])


  // Get passed TreeNFT IPFS metadata
  //----------------------------------
  const [json, setJson] = useState();
  const [image, setImage] = useState();
  const [metadataError, setMetadataError] = useState();
  const [test, setTest] = useState();
  const [metadataRetrieved, setmetadataRetrieved] = useState(false);

  useEffect(() => {

    const fetchTreeNFTMetadata = async () => {

      try {
        const pinata = new PinataSDK({
          pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
          pinataGateway: process.env.NEXT_PUBLIC_PINATA_GETWAY,
        });

        // Get json data from token URI
        const jsonData = await pinata.gateways.get(treeNftTokenUri);
        setJson(jsonData);
console.log("Log jsonData")
console.log(jsonData)

        // Get TreeNFT image from retrieved json attribute
        const img = await pinata.gateways.get(jsonData.data.image);
        setImage(URL.createObjectURL(img.data));

console.log("Log img")
console.log(img)
console.log("Log URL.createObjectURL(img.data)")
console.log(URL.createObjectURL(img.data))

      } catch (err) {
        console.error(err);
        setMetadataError(err);
      }
    };

    if (! metadataRetrieved && treeNftTokenUri) {

      fetchTreeNFTMetadata();
      setmetadataRetrieved(true)

    }

  }, [treeNftTokenUri]);


  useEffect(() => {

    // Si erreur récup metadata
    if(metadataError) {
      toast({
        title: "TreeNFT metadata fetching error",
        description: metadataError.shortMessage, 
        variant: "destructive",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
   
  }, [ metadataError ])


  useEffect(() => {
    console.log("État json mis à jour :", json);
  }, [json]);


  return (
    <>
    {
      <div className="flex flex-none items-center font-bold pb-10">

          {image ? (
              <Image
                      src={image}
                      alt="TreesNFT image"
                      width={500} 
                      height={500}
              />
              ) : (
                <p>Image uploading...</p>
            )
          }

          <div className="pl-10">
            <ul>
              <li>Item Id : {treeNFT.itemId.toString()}</li>
              <li>Token Id : {treeNFT.tokenId.toString()}</li>
              <li>Price : {treeNFT.price.toString()}</li>
              <li>Seller : {treeNFT.seller}</li>
              <li>Owner : {treeNFT.owner}</li>
              <li>For Sale : {treeNFT.forSale.toString()}</li>
              <li>Species : {json ? (json.data.attributes[0].value):("")}</li>
              <li>Planting Date : {json ? (json.data.attributes[2].value):("")}</li>
              <li>Location : {json ? (json.data.attributes[3].value):("")}</li>
              <li>Location Owner Name : {json ? (json.data.attributes[4].value):("")}</li>
              <li>Location Owner Address : {json ? (json.data.attributes[5].value):("")}</li>
            </ul>
          </div>
      </div>
    }
    </>
  )
}

export default TreeNFT
