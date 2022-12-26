import { ethers } from 'ethers';
import { MGDAbi__factory } from '../types/ethers-contracts';

const RPC_HOST = process.env.NEXT_PUBLIC_INFURA_GOERLI_HTTPS ?? '';
const MGD_ADDRESS = '0x4cd3044861776f10dFBA1c0EA892fb18a1D6Bf1E';

export const useContract = (
  factory: typeof MGDAbi__factory,
  address: string
) => {
  const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
  return factory.connect(address, provider.getSigner());
};

export const useMGDContract = () => useContract(MGDAbi__factory, MGD_ADDRESS);
