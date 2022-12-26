import Head from 'next/head';
import { Inter } from '@next/font/google';
import { Grid, Cell } from 'baseui/layout-grid';
import { useStyletron } from 'baseui';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, KIND as ButtonKind } from 'baseui/button';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
  SIZE,
  ROLE,
} from 'baseui/modal';
import { FormControl } from 'baseui/form-control';
import { FileUploader } from 'baseui/file-uploader';
import { Input } from 'baseui/input';
import { Textarea } from 'baseui/textarea';
import { ethers } from 'ethers';
import {
  uploadFileToWebStorage,
  mint,
  MintArtwork,
  Artwork,
  getMintedArtworks,
} from '../utils/methods/mint';
import { useMGDContract } from '../hooks/useContract';
import { Card, StyledBody } from 'baseui/card';
import { DisplayMedium } from 'baseui/typography';

const inter = Inter({ subsets: ['latin'] });

interface MintDetails {
  image?: string;
  name?: string;
  description?: string;
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<Array<File>>([]);
  const [value, setValue] = useState<MintDetails>({
    image: '',
    name: '',
    description: '',
  });
  const [artworks, setArtworks] = useState<Array<Artwork>>([]);

  const MGDContract = useMGDContract();

  const [css] = useStyletron();

  const _mint = async () => {
    let provider;
    try {
      if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
      } else {
        // eslint-disable-next-line quotes
        console.error("You don't have a metaMask installed");
      }
      // MetaMask requires requesting permission to connect users accounts
      await provider?.send('eth_requestAccounts', []);
      const signer = provider?.getSigner();
      // signer?.sendTransaction({
      //   to: '0x505F10f15aB5040c07A404aA8C45Be6484Ba97F4',
      //   value: ethers.utils.parseEther('0.001'),
      // });
      console.log(value);
      let currentAccount;
      await signer
        ?.getAddress()
        .then((res) => (currentAccount = res))
        .catch((error) => console.error('Error getting address: ', error));
      if (!!currentAccount) {
        await mint(await MGDContract, currentAccount, value as MintArtwork);
      }
    } catch (error: any) {
      if (error.code === 4001) {
        console.error('Please connect to MetaMask');
      } else {
        // eslint-disable-next-line quotes
        console.error("Couldn't connect wallet: ", error);
      }
    }
  };

  const getArtworks = useCallback(async () => {
    let provider;
    try {
      if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
      } else {
        // eslint-disable-next-line quotes
        console.error("You don't have a metaMask installed");
      }
      // MetaMask requires requesting permission to connect users accounts
      await provider?.send('eth_requestAccounts', []);
      const signer = provider?.getSigner();
      const account = await signer?.getAddress();
      if (!!account) {
        const allArtworks = await getMintedArtworks(await MGDContract);
        if (!allArtworks) console.error('Failed to get minted artworks');
        setArtworks(allArtworks ?? []);
      } else {
        console.error('Please connect to MetaMask, no account detected');
      }
    } catch (error) {
      console.error(error);
    }
  }, [MGDContract]);

  useEffect(() => {
    getArtworks();
  }, [getArtworks]);

  return (
    <>
      <Head>
        <title>MGD Mint | Example</title>
        <meta name='description' content='Generated by create next app' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <Grid>
          <Cell span={[4, 8, 12]}>
            <Inner>
              <Button
                onClick={() => setIsOpen(true)}
                overrides={{
                  BaseButton: {
                    style: {
                      width: '100%',
                    },
                  },
                }}
              >
                Mint Artwork
              </Button>
              <MintDetailsModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
                value={value}
                setValue={setValue}
                _mint={_mint}
              />
              <Box>
                {artworks.length > 0 ? (
                  artworks.map((artwork) => (
                    <Card
                      key={artwork.index}
                      overrides={{
                        Root: {
                          style: { width: '100%', marginBottom: '.5rem' },
                        },
                      }}
                      headerImage={artwork.image}
                      title={artwork.name}
                    >
                      <StyledBody>{artwork.description}</StyledBody>
                    </Card>
                  ))
                ) : (
                  <div
                    className={css({
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: '5rem',
                    })}
                  >
                    <DisplayMedium>No minted artworks.</DisplayMedium>
                  </div>
                )}
              </Box>
            </Inner>
          </Cell>
        </Grid>
      </main>
    </>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const [css] = useStyletron();
  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // background: theme.colors.accent200,
        // color: theme.colors.accent700,
        padding: '.25rem 20rem .25rem 20rem',
      })}
    >
      {children}
    </div>
  );
}

function Box({ children }: { children: ReactNode }) {
  const [css] = useStyletron();
  return (
    <div
      className={css({
        marginTop: '2.5rem',
      })}
    >
      {children}
    </div>
  );
}

type MintDetailsModalProps = {
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  uploadedFile: File[] | undefined;
  setUploadedFile: Dispatch<SetStateAction<File[]>>;
  value: MintDetails | undefined;
  setValue: Dispatch<SetStateAction<MintDetails>>;
  _mint: () => Promise<void>;
};

function MintDetailsModal({
  isOpen,
  setIsOpen,
  uploadedFile,
  setUploadedFile,
  value,
  setValue,
  _mint,
}: MintDetailsModalProps) {
  return (
    <Modal
      onClose={() => setIsOpen(false)}
      closeable
      isOpen={isOpen}
      animate
      autoFocus
      size={SIZE.auto}
      role={ROLE.dialog}
    >
      <ModalHeader>Mint new artwork</ModalHeader>
      <ModalBody>
        <FormControl
          label={() => 'Image, Video, Audio, or 3D Model'}
          caption={() =>
            'File types supported: JPG, PNG, GIF, SVG, MP4, WEBM, MP3, WAV, OGG, GLB, GLTF. Max size: 100 MB'
          }
        >
          <UploadFile
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            setValue={setValue}
          />
        </FormControl>
        <FormControl label={() => 'Name'}>
          <Input
            value={value?.name}
            onChange={(e) =>
              setValue({ ...value, name: e.target.value } as MintDetails)
            }
            placeholder='Artwork name'
            clearOnEscape
          />
        </FormControl>
        <FormControl
          label={() => 'Description'}
          caption={() =>
            // eslint-disable-next-line quotes
            "The description will be included on the item's detail page underneath its image."
          }
        >
          <Textarea
            value={value?.description}
            onChange={(e) =>
              setValue({ ...value, description: e.target.value } as MintDetails)
            }
            placeholder='Provide a detailed description of your artwork'
            clearOnEscape
          />
        </FormControl>
      </ModalBody>
      <ModalFooter>
        <ModalButton
          kind={ButtonKind.tertiary}
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </ModalButton>
        <ModalButton onClick={() => _mint()}>Mint</ModalButton>
      </ModalFooter>
    </Modal>
  );
}

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval(callback: any, delay: number | null) {
  const savedCallback = useRef(() => {});
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  // Set up the interval.
  useEffect((): any => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
// useFakeProgress is an elaborate way to show a fake file transfer for illustrative purposes. You
// don't need this is your application. Use metadata from your upload destination if it's available,
// or don't provide progress.
function useFakeProgress(): [number, () => void, () => void] {
  const [fakeProgress, setFakeProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  function stopFakeProgress() {
    setIsActive(false);
    setFakeProgress(0);
  }
  function startFakeProgress() {
    setIsActive(true);
  }
  useInterval(
    () => {
      if (fakeProgress >= 100) {
        stopFakeProgress();
      } else {
        setFakeProgress(fakeProgress + 10);
      }
    },
    isActive ? 500 : null
  );
  return [fakeProgress, startFakeProgress, stopFakeProgress];
}

type UploadFile = {
  uploadedFile: File[] | undefined;
  setUploadedFile: Dispatch<SetStateAction<File[]>>;
  setValue: Dispatch<SetStateAction<MintDetails>>;
};

function UploadFile({ uploadedFile, setUploadedFile, setValue }: UploadFile) {
  const [progressAmount, startFakeProgress, stopFakeProgress] =
    useFakeProgress();
  return (
    <FileUploader
      onCancel={stopFakeProgress}
      onDrop={(acceptedFiles, rejectedFiles) => {
        // handle file upload...
        console.log(acceptedFiles);
        // set uploaded file
        if (!!acceptedFiles) {
          setUploadedFile(acceptedFiles);
        }
        console.log(uploadedFile);
        // upload to web3Storage
        uploadedFile &&
          uploadedFile.length > 0 &&
          uploadFileToWebStorage(uploadedFile)
            .then((res) =>
              setValue((prevState) => ({ ...prevState, image: res }))
            )
            .catch((error) => console.error('Failed to upload: ', error));
        rejectedFiles.length > 0 &&
          console.error('RejectedFiles: ', rejectedFiles);
        startFakeProgress();
      }}
      // progressAmount is a number from 0 - 100 which indicates the percent of file transfer completed
      progressAmount={progressAmount}
      progressMessage={
        progressAmount ? `Uploading... ${progressAmount}% of 100%` : ''
      }
    />
  );
}
