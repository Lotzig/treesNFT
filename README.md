
![Accueil](https://github.com/user-attachments/assets/94c185b0-e713-4ad1-b309-4131e68156da)

## [La DApp en ligne](https://trees-9vmrzzm7g-jf-briches-projects.vercel.app)

## Installation

- Cloner le projet
- Dans le répertoire backend, installer les dépendances du projet Hardhat
```bash
npm install
```
- Dans le répertoire frontend, installer les dépendances du projet Next.JS
```bash
npm install
```
## Fonctionalités :
- Affichage de tous les TreeNFT (pour l’administrateur) : en vente, pas en vente, que le propriétaire soit l’administrateur ou un client,

- Affichage du market place avec tous les TreeNFT disponibles à la vente (DApp et clients). Un bouton permettra à l’utilisateur connecté d’acheter un TreeNFT de son choix, qu’il appartienne à la DApp ou à un autre client qui l’a mis en vente

- Affichage du compte client avec ses TreeNFT

## Architecture
![image](https://github.com/user-attachments/assets/7ad900d7-3368-45b0-bd63-2036a9c75ac9)

### Backend

#### Smart contract TreeNFT :

Il crée les tokens TreeNFT et les approuve pour le contrat Market Place,
Ressources utilisées : Openzeppelin ERC721URIStorage, Ownable, Counters.sol

#### Smart contrat TreeNFTMarket :

Il gère les informations de la place de marché.
Ressources utilisées : TreeNFT, Openzeppelin ERC721 (pour interface TreeNFT), Ownable, Strings, ReentrancyGuard, Counters.sol


##### Fonctionnalités :

- Définir les frais de vente (owner)
- Créer un article à partir d’un TreeNFT créé dans le contrat TreeNFT et le mettre à la vente (owner)
- Acheter un TreeNFT
- Mettre un TreeNFT à la vente
- Retirer un TreeNFT de la vente
- Récupérer la collection de TreeNFT
- Récupérer les TreeNFT en vente
- Récupérer les TreeNFT d’un client

## Frontend

### Page d'accueil
![image](https://github.com/user-attachments/assets/9ba9c4cd-874b-47da-bed4-aac6c40277be)

La connexion au wallet via le bouton « Connecter le portefeuille » va router soit vers la page d’administration des TreeNFT si owner du contrat, soit vers le Marketplace si utilisateur.

### Page d'Administration
![image](https://github.com/user-attachments/assets/115300b3-83ec-4e22-93f4-d44ed7d99e3e)

Elle affiche tous les TreeNFT, qu’ils appartiennent à la Marketplace ou a des utilisateurs, qu’ils soient en vente ou pas.

Les TreeNFT sont affichés avec leur photo et leurs attributs, stockés dans les fichiers JSON ou dans le contrat TreesNFTMarket. 

Le contrat TreeNFT permet de récupérer un CID stocké dans le tokenURI. Le CID donne accès au fichier JSON du NFT qui donne accès aux attributs et au CID de l’image. La lecture du contrat se fait avec le hook Wagmi useReadContract.

Le JSON et l’image sont stockés sur IPFS via Pinata Cloud et récupérés grâce au Pinata SDK implémenté dans l’application.

### Page Marketplace
![image](https://github.com/user-attachments/assets/4c8a2272-33dc-4a4e-8f6c-f301f0b28254)

Elle affiche les TreeNFT en vente et pour chacun un bouton « Purchase » permettant d’acheter le TreeNFT.

Un lien « Go to my TreeNFTs » permet d’aller sur la page « My TreeNFT » (voir plus loin).

La récupération des informations est réalisée de la même manière que pour la page d’administration.

L’achat se fait grâce au contrat TreeNFTMarket (purchaseItem) et l’écriture dans le contrat depuis le front est réalisée avec le hook Wagmi useWriteContract.

### Page My TreesNFT
![image](https://github.com/user-attachments/assets/fa7000ab-828a-44a3-a3e3-926cd3311e9f)

Elle affiche les TreeNFT de l’utilisateur connecté.

Un lien « Go to the MarketPlace » permet de revenir sur la page « MARKETPLACE » (voir plus haut).

La récupération des informations est réalisée de la même manière que pour la page d’administration et la page Marketplace.

