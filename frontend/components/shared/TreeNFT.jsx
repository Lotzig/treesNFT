import Image from 'next/image'
import Accueil from '@/images/Accueil.jpg'

const TreeNFT = ({ treeNFT }) => {

  return (
    <>
    {
      <div className="flex flex-none items-center font-bold pb-10">
          <Image
                  src={Accueil}
                  alt="TreesNFT"
                  width={500} 
                  height={500}
          />

          <div className="pl-10">
            <ul>
              <li>Item Id : {treeNFT.itemId.toString()}</li>
              <li>Token Id : {treeNFT.tokenId.toString()}</li>
              <li>Price : {treeNFT.price.toString()}</li>
              <li>Seller : {treeNFT.seller}</li>
              <li>Owner : {treeNFT.owner}</li>
              <li>For Sale : {treeNFT.forSale.toString()}</li>
              <li>Species : </li>
              <li>Planting Date : </li>
              <li>Location : </li>
              <li>Location Owner Name : </li>
              <li>Location Owner Address : </li>
            </ul>
          </div>
      </div>
    }
    </>
  )
}

export default TreeNFT
