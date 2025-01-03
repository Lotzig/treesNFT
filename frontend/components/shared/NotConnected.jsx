import Image from 'next/image'
import Accueil from '@/images/Accueil.jpg'

const NotConnected = () => {
  return (
    <>
      <div className="flex flex-col space-y-4 items-center">
        <Image
          src={Accueil}
          alt="TreesNFT"
          //width={500} 
          //height={500}
        />
      
        <div className="bg-lime-600 text-2xl text-white p-5">Connect your wallet to purchase TreeNFTs !</div>

      </div>

    </>
  )
}

export default NotConnected
