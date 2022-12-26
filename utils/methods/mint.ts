import { create } from 'ipfs-http-client';
import { Web3Storage } from 'web3.storage';
import type { MGDAbi } from '../../types/ethers-contracts';
import axios from 'axios';
import { BigNumber, ethers } from 'ethers';

// Initialize IPFS
const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID ?? '';
const INFURA_SECRET_KEY = process.env.NEXT_PUBLIC_INFURA_SECRET_KEY ?? '';
const auth =
  'Basic ' +
  Buffer.from(INFURA_ID + ':' + INFURA_SECRET_KEY).toString('base64');
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

export interface MintArtwork {
  image: string;
  name: string;
  description: string;
}

/** @dev mint artwork */
export const mint = async (
  contract: MGDAbi,
  account: string,
  data: MintArtwork
) => {
  const { description, image, name } = data;
  const notValid = Object.values(data).filter((item) => item).length === 0;

  if (notValid)
    console.error(`Error ${typeof mint} mint: Missing or no data provided`);
  if (!account) console.error(`Error ${typeof mint} mint: No account provided`);

  // convert NFT metadata to JSON format
  const _data = JSON.stringify({ image, name, description });

  try {
    // save metadata to ipfs
    const added = await client.add(_data);
    // IPFS url for uploaded metadata - https://infura-ipfs.io/ipfs/
    const metadataUri = `https://saii.infura-ipfs.io/ipfs/${added.path}`;

    await contract.mint(
      'MGD',
      metadataUri,
      account,
      account,
      account,
      1,
      100000,
      false
    );
  } catch (error) {
    console.error(`Error ${typeof mint} mint: `, error);
  }
};

/** returns an IPFS gateway URL for the given CID and path */
export const makeGatewayURL = (cid: string, path: string) => {
  return `https://${cid}.ipfs.w3s.link/${encodeURIComponent(path)}`;
};

/** @dev uploads a file to IPFS via web3.storage */
export const uploadFileToWebStorage = async (file: File[]) => {
  // Construct with token and endpoint
  const token = process.env.NEXT_PUBLIC_STORAGE_API_KEY ?? '';

  if (!token) {
    throw new Error(
      'A token is needed. You can create one on https://web3.storage'
    );
  }
  const client = new Web3Storage({ token });

  if (!file)
    console.error(
      `Error ${typeof uploadFileToWebStorage} uploadFileToWebStorage: No file provided`
    );
  // Pack files into a CAR and send to web3.storage
  console.log('Uploading file to web3Storage...');
  const cid = await client.put(file); // Promise<CIDString>
  console.log('Content added with CID: ', cid);

  const imageUrl = makeGatewayURL(cid, file[0].name);
  if (!imageUrl) {
    console.error(
      `Error ${typeof uploadFileToWebStorage} uploadFileToWebStorage: Failed to upload to web3Storage`
    );
  }

  return imageUrl;

  // Fetch and verify files from web3.storage
  // const res = await client.get(cid); // Promise<Web3Response | null>
  // console.log(res, res.okay, res.status, res?.statusText)
  // console.log(`Got a response! [${res?.status}] ${res?.statusText}`);
  // if (!res?.ok) {
  //   throw new Error(
  //     `failed to get ${cid} - [${res?.status}] ${res?.statusText}`
  //   );
  // }

  // unpack File objects from the response
  // const files = (await res?.files()) || []; // Promise<Web3File[]>
  // console.log('latest upload: ', files[0]?.cid);

  // for await (const entry of res.unixFsIterator()) {
  //   console.log(
  //     `got unixfs of type ${entry.type}. cid: ${entry.cid} path: ${entry.path}`
  //   );
  //   // entry.content() returns another async iterator for the chunked file contents
  //   for await (const chunk of entry.content()) {
  //     console.log(`got a chunk of ${chunk.size} bytes of data`);
  //   }
  // }

  // if (files[0]?.cid) {
  //   return `https://infura-ipfs.io/ipfs/${files[0].cid}`;
  // } else {
  //   console.error(
  //     `Error ${typeof uploadFileToWebStorage} uploadFileToWebStorage: Failed to fetch latest upload`
  //   );
  // }
};

/** @dev Get the metedata for an NFT from IPFS */
export const fetchNftMeta = async (ipfsUrl: string) => {
  try {
    if (!ipfsUrl) {
      throw new Error('No ipfs url provided');
    }
    const meta = await axios.get(ipfsUrl);

    return meta;
  } catch (error) {
    console.error(`Error ${typeof fetchNftMeta} fetchNftMeta: `, error);
  }
};

export interface Artwork {
  index: number;
  name: string;
  image: string;
  description: string;
}

export const getMintedArtworks = async (contract: MGDAbi) => {
  try {
    const artworks: Array<Artwork> = [];
    const _artworksLength = (await contract.tokenCount())._hex;
    const artworksLength = parseInt(_artworksLength);
    for (let i = 1; i < artworksLength + 1; i++) {
      const artwork = new Promise<Artwork>(async (resolve) => {
        const res = await contract.metadata(i);
        const meta = await fetchNftMeta(res[0]);
        resolve({
          index: i,
          name: meta?.data.name,
          image: meta?.data.image,
          description: meta?.data.description,
        });
      });
      artworks.unshift(await artwork);
    }
    return Promise.all(artworks);
  } catch (error) {
    console.error(
      `Error ${typeof getMintedArtworks} getMintedArtworks: `,
      error
    );
  }
};
