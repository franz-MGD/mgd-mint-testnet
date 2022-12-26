import { ethers } from 'ethers';
import { MGDAbi__factory } from '../types/ethers-contracts';

const RPC_HOST = process.env.NEXT_PUBLIC_ALCHEMY_GOERLI_HTTPS ?? '';
const MGD_ADDRESS = '0x12358F6c3aD851FDd83116023804149fbcd3B613';

export const useContract = (
  factory: typeof MGDAbi__factory,
  address: string
) => {
  if (typeof window !== 'undefined') {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    return factory.connect(address, signer);
  } else {
    const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
    return factory.connect(address, provider.getSigner());
  }
};

export const useMGDContract = () => useContract(MGDAbi__factory, MGD_ADDRESS);
