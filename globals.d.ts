import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum: typeof ethers.providers.ExternalProvider;
  }
}
