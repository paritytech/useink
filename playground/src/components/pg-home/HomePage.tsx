import Link from 'next/link';
import { useEffect, useState } from 'react';
/* eslint-disable @next/next/no-img-element */
import {
  VerificationState,
  useBalance,
  useBlockHeader,
  useBlockHeaders,
  useCall,
  useCallSubscription,
  useChainRpc,
  useChainRpcList,
  useContract,
  useDryRun,
  useEventSubscription,
  useEvents,
  useInstalledWallets,
  useMessageSigner,
  useSignatureVerifier,
  useTimestampDate,
  useTimestampNow,
  useTokenSymbol,
  useTx,
  useTxPaymentInfo,
  useUninstalledWallets,
  useWallet,
} from 'useink';
import { ChainId } from 'useink/chains';
import { useNotifications, useTxNotifications } from 'useink/notifications';
import {
  RustResult,
  isBroadcast,
  isFinalized,
  isInBlock,
  isPendingSignature,
  pickDecoded,
  pickDecodedError,
  pickResultErr,
  pickResultOk,
  pickTxInfo,
  planckToDecimalFormatted,
  shouldDisable,
} from 'useink/utils';
import metadata from '../../metadata/playground.json';
import { Notifications } from '../Notifications';

const CONTRACTS_ROCOCO_ADDRESS =
  '5G31GiBqWPFCm8S9cknY7UWAPA8SwNJJdoG4RrmtVDQyrk7Y';

const SHIBUYA_CONTRACT_ADDRESS =
  /* cSpell:disable */
  'XtH77i6CYHSSg7tFerUMCSWifBcAz2gewDXeyQNCbgRXHs8';

interface Happy {
  mood: string;
}
interface BadMood {
  BadMood: { mood: string };
}
// RustResult<T, E> is a convenience type to define { Ok?: T, Err?: E }, returned by calls
// to contracts that return a Result<T, E>
type MoodResult = RustResult<Happy, BadMood>;

export const HomePage: React.FC = () => {
  const { account, accounts, setAccount, connect, disconnect } = useWallet();
  const block = useBlockHeader(); // with no arguments it defaults to the first item in the chains config
  const astarBlockNumber = useBlockHeader('astar');
  const allChainBlockHeaders = useBlockHeaders();
  const balance = useBalance(account);
  const cRococoContract = useContract(CONTRACTS_ROCOCO_ADDRESS, metadata);
  const { rpcs, setChainRpc } = useChainRpcList('astar');
  const astarRpc = useChainRpc('astar');
  const get = useCall<boolean>(cRococoContract, 'get');
  const signer = useMessageSigner();
  const signatureVerifier = useSignatureVerifier();
  const [messageToSign, setMessageToSign] = useState(
    'Sign this message, or change me and then sign!',
  );
  const getSubcription = useCallSubscription<boolean>(
    cRococoContract,
    'get',
    [],
    { defaultCaller: true },
  );
  const flipTx = useTx(cRococoContract, 'flip');
  const flipDryRun = useDryRun<boolean>(cRococoContract, 'flip');
  const flipPaymentInfo = useTxPaymentInfo(cRococoContract, 'flip');
  const panic = useCall<boolean>(cRococoContract, 'panic');
  const assertBoom = useCall<boolean>(cRococoContract, 'assertBoom');
  const mood = useCall<MoodResult>(cRococoContract, 'mood');
  const phalaTimestamp = useTimestampNow('phala');
  const phalaDate = useTimestampDate('phala');
  const shibuyaContract = useContract(
    SHIBUYA_CONTRACT_ADDRESS,
    metadata,
    'shibuya-testnet',
  );
  const shibuyaSymbol = useTokenSymbol('shibuya-testnet');
  const rocSymbol = useTokenSymbol('rococo-contracts-testnet');
  const shibuyaFlipTx = useTx(shibuyaContract, 'flip');
  useTxNotifications(shibuyaFlipTx); // Add a notification on tx status changes
  const shibuyaGetSubcription = useCallSubscription<boolean>(
    shibuyaContract,
    'get',
  );
  const { addNotification } = useNotifications();
  useEventSubscription(cRococoContract);
  const { events } = useEvents(cRococoContract?.contract?.address);
  const option = useCall<Happy | null>(cRococoContract, 'option');

  // Use helper functions to quickly pick values from a Result<T, E>
  // Instead of doing something like this:
  // mood?.result?.ok ? mood.result.value.decoded : undefined
  const goodMood = pickResultOk(mood.result);
  const badMood = pickResultErr(mood.result);

  useEffect(() => {
    // Customize messages
    if (isPendingSignature(flipTx)) {
      addNotification({
        type: flipTx.status,
        message: 'Please sign the transaction in your wallet',
      });
    }

    if (isBroadcast(flipTx)) {
      addNotification({
        type: flipTx.status,
        message: 'Flip transaction has been broadcast!',
      });
    }

    if (isInBlock(flipTx)) {
      addNotification({
        type: flipTx.status,
        message: 'Transaction is in the block.',
      });
    }

    if (isFinalized(flipTx)) {
      addNotification({
        type: flipTx.status,
        message: 'The transaction has been finalized.',
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipTx.status]);

  useEffect(() => {
    account &&
      addNotification({
        type: 'WalletConnected',
        message: `Connected to ${account.name || account.address}`,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const installedWallets = useInstalledWallets();
  const uninstalledWallets = useUninstalledWallets();

  if (!cRococoContract?.contract) {
    return (
      <div className="justify-center h-screen flex items-center w-full">
        <h1 className="text-3xl font-bold">Loading contract...</h1>
      </div>
    );
  }

  return (
    <section className="w-full mx-auto">
      <Notifications />
      <div className="max-w-3xl w-full mx-auto py-16 px-4">
        <h1 className="text-5xl font-bold text-blue-500">
          useink Kitchen Sink
        </h1>
        <h2 className="text-2xl text-blue-500 mb-16">
          See the contract definitions{' '}
          <a
            className="underline hover:opacity-80 transition duration-75"
            href="https://github.com/paritytech/useink-kitchen-sink/blob/master/lib.rs"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
          .
        </h2>

        <div className="mt-8">
          {!account && (
            <ul className="flex flex-col gap-4">
              {installedWallets.length > 0 ? (
                <>
                  <h2 className="text-xl font-bold">Connect a Wallet</h2>
                  <h3 className="text-md">Installed Wallets</h3>
                  {installedWallets.map((w) => (
                    <li key={w.title}>
                      <button
                        type="button"
                        onClick={() => connect(w.extensionName)}
                        className="flex items-center w-full rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
                      >
                        <img
                          className="w-12 mr-2"
                          src={w.logo.src}
                          alt={w.logo.alt}
                        />
                        Connect to {w.title}
                      </button>
                    </li>
                  ))}
                </>
              ) : (
                <h2 className="text-xl font-bold">
                  You don&apos;t have any wallets installed...
                </h2>
              )}

              {uninstalledWallets.length > 0 && (
                <>
                  <h3 className="text-md">Uninstalled Wallets</h3>

                  {uninstalledWallets.map((w) => (
                    <li key={w.title}>
                      <a
                        href={w.installUrl}
                        rel="noreferrer"
                        target="_blank"
                        className="flex items-center w-full rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
                      >
                        <img
                          className="w-12 mr-2"
                          src={w.logo.src}
                          alt={w.logo.alt}
                        />
                        Install {w.title}
                      </a>
                    </li>
                  ))}
                </>
              )}
            </ul>
          )}
          <ul className="list-none flex flex-col gap-12 mt-8">
            {account && (
              <>
                <li>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
                  >
                    Disconnect
                  </button>
                </li>

                <li>
                  <b>You are connected as:</b>
                  <span className="ml-4 dark:bg-slate-600 bg-slate-200 rounded-lg py-2 px-2">
                    {account?.name || account?.address}
                  </span>
                </li>

                {accounts?.map(
                  (acc) =>
                    account !== acc && (
                      <li key={acc.address} className="flex flex-col">
                        <b>Connect to {acc.name ? acc.name : 'wallet'}</b>
                        <button
                          type="button"
                          onClick={() => setAccount(acc)}
                          className="rounded-2xl text-white px-4 py-2 mt-2 bg-blue-500 hover:bg-blue-600 transition duration-75"
                        >
                          {acc.address}
                        </button>
                      </li>
                    ),
                )}

                <li>
                  <b>Your Free Balance:</b>
                  <span className="ml-4 dark:bg-slate-600 bg-slate-200 rounded-lg py-2 px-2">
                    {planckToDecimalFormatted(balance?.freeBalance, {
                      significantFigures: 4,
                      api: cRococoContract.contract.api,
                    })}
                  </span>
                </li>
              </>
            )}

            <li>
              <b>Contracts Rococo Current Block:</b>
              <span className="ml-4 dark:bg-slate-600 bg-slate-200 rounded-lg py-2 px-2">
                {block?.blockNumber === undefined
                  ? '--'
                  : block.blockNumber.toLocaleString()}
              </span>
            </li>

            <li>
              <b>Astar Current Block:</b>
              <span className="ml-4 dark:bg-slate-600 bg-slate-200 rounded-lg py-2 px-2">
                {astarBlockNumber?.blockNumber === undefined
                  ? '--'
                  : astarBlockNumber.blockNumber.toLocaleString()}
              </span>
            </li>

            <li>
              <b>Change a chain&apos;s active RPC url: (e.g. Astar)</b>
              <ul className="px-0 m-0 mt-6 gap-4 grid grid-cols-2 items-center">
                {rpcs.map((rpc) => (
                  <li key={rpc} className="p-0">
                    <button
                      type="button"
                      className="rounded-2xl w-full text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
                      disabled={rpc === astarRpc}
                      onClick={() => setChainRpc(rpc, 'astar')}
                    >
                      {rpc}
                    </button>
                  </li>
                ))}
              </ul>
            </li>

            <li>
              <b>
                Get all blocks from configured chains using:{' '}
                <code className="p-2 rounded-md bg-slate-500">
                  useBlockHeaders()
                </code>
              </b>
              <ul className="px-0 m-0 mt-6 gap-4 flex items-center flex-col md:flex-row">
                {(Object.keys(allChainBlockHeaders) as ChainId[]).map(
                  (chainId) => (
                    <li key={chainId} className="p-0">
                      <span>
                        <b>{chainId}:</b>{' '}
                        {allChainBlockHeaders[
                          chainId
                        ]?.blockNumber?.toLocaleString() || '--'}{' '}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </li>

            <li>
              <b>
                Phala&apos;s current timestamp:{' '}
                <code className="p-1 rounded-md bg-slate-500">
                  {phalaTimestamp}
                </code>
              </b>

              <p className="text-sm">
                Phala&apos;s last block time: {phalaDate?.toLocaleTimeString()}
              </p>
            </li>

            <li className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => get.send([], { defaultCaller: true })}
                disabled={get.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                Call get()
              </button>

              <h3 className="text-xl">
                Value: {pickDecoded(get.result)?.toString() || '--'}
              </h3>
            </li>

            <li className="flex items-center gap-4">
              <h3 className="text-xl">
                get() will update on new blocks:{' '}
                {pickDecoded(getSubcription.result)?.toString() || '--'}
              </h3>
            </li>

            <li className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => flipTx.signAndSend()}
                disabled={shouldDisable(flipTx) || !account}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {shouldDisable(flipTx) ? 'Flipping' : 'Flip!'}
              </button>

              <h3 className="text-xl">
                <b>Status:</b> {flipTx.status}
              </h3>

              <h3 className="text-xl">
                <b>Events:</b>
                <ul className="ml-4">
                  {events.map((event) => (
                    <li key={event.id} className="text-md mb-4">
                      <b>{event.name}</b> - flipper: {event.args?.[0] as string}
                      , value: {event.args?.[1]?.toString()}
                    </li>
                  ))}
                </ul>
              </h3>

              <button
                type="button"
                onClick={() => flipTx.resetState()}
                disabled={
                  shouldDisable(flipTx) ||
                  ['InBlock', 'None'].includes(flipTx.status)
                }
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                Reset state
              </button>
            </li>

            <li className="flex flex-col gap-4">
              <h3 className="text-xl">
                Call a contract on another chain. e.g. &quot;Shibuya&quot;
              </h3>

              <h3 className="text-xl">
                Shibuya Flipped:{' '}
                {pickDecoded(shibuyaGetSubcription.result)?.toString() || '--'}
              </h3>

              <button
                type="button"
                onClick={() => shibuyaFlipTx.signAndSend()}
                disabled={shouldDisable(shibuyaFlipTx) || !account}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {shouldDisable(shibuyaFlipTx)
                  ? 'Flipping Shibuya Contract'
                  : 'Flip Shibuya Contract!'}
              </button>

              <h3 className="text-xl">
                <b>Status:</b> {shibuyaFlipTx.status}
              </h3>

              <button
                type="button"
                onClick={() => shibuyaFlipTx.resetState()}
                disabled={
                  shouldDisable(shibuyaFlipTx) ||
                  ['InBlock', 'None'].includes(shibuyaFlipTx.status)
                }
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                Reset state
              </button>
            </li>

            <li className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => flipDryRun.send([], { defaultCaller: true })}
                disabled={flipDryRun.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {flipDryRun.isSubmitting ? 'Flipping' : 'Flip as Dry Run!'}
              </button>

              <h3 className="text-xl">
                <b>Gas Required:</b>{' '}
                {planckToDecimalFormatted(
                  pickTxInfo(flipDryRun.result)?.partialFee,
                  { api: cRococoContract.contract.api },
                )}

                {pickDecodedError(flipDryRun, cRococoContract, {}, '--')}
              </h3>
            </li>

            <li className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() =>
                  flipPaymentInfo.send([], { defaultCaller: true })
                }
                disabled={flipPaymentInfo.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {flipPaymentInfo.isSubmitting
                  ? 'Getting payment info...'
                  : 'Get payment info for flip'}
              </button>

              <h3 className="text-xl">
                <b>Partial Fee (a.k.a. Gas Required):</b>{' '}
                {planckToDecimalFormatted(flipPaymentInfo.result?.partialFee, {
                  api: cRococoContract.contract.api,
                })}
              </h3>
            </li>

            <li className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => panic.send([], { defaultCaller: true })}
                disabled={panic.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                Call panic()
              </button>

              <h3 className="text-xl">
                {pickDecodedError(
                  panic,
                  cRococoContract,
                  {
                    ContractTrapped:
                      'This is a custom message. There was a panic in the contract!',
                  },
                  'this is a default error message',
                )}
              </h3>
            </li>

            <li className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => assertBoom.send([], { defaultCaller: true })}
                disabled={assertBoom.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                Call assertBoom()
              </button>

              <h3 className="text-xl">
                {pickDecodedError(
                  assertBoom,
                  cRococoContract,
                  {
                    ContractTrapped:
                      'This is a custom message. The assertion failed!',
                  },
                  '--',
                )}
              </h3>
            </li>

            <li className="flex flex-col gap-4">
              <h3 className="text-xl">
                Handle Results. An even number will return an Ok Result, and an
                odd number will return an Error
              </h3>
              <button
                type="button"
                onClick={() => mood.send([0], { defaultCaller: true })}
                disabled={mood.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {mood.isSubmitting ? 'Getting mood...' : 'Get Ok Result'}
              </button>

              <button
                type="button"
                onClick={() => mood.send([1], { defaultCaller: true })}
                disabled={mood.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {mood.isSubmitting ? 'Getting mood...' : 'Get Err Result'}
              </button>

              <h3 className="text-xl">
                Mood: {!goodMood && !badMood && '--'}
                {goodMood?.mood}
                {badMood?.BadMood.mood}
              </h3>
            </li>

            <li className="flex flex-col gap-4">
              <h3 className="text-xl">
                Handle Options. An even number will return a Some(Happy), and an
                odd number will return None
              </h3>
              <button
                type="button"
                onClick={() => option.send([0], { defaultCaller: true })}
                disabled={option.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {option.isSubmitting
                  ? 'Getting option result...'
                  : 'Get Some(Happy) result'}
              </button>

              <button
                type="button"
                onClick={() => option.send([1], { defaultCaller: true })}
                disabled={option.isSubmitting}
                className="rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 hover:disabled:bg-blue-300 transition duration-75"
              >
                {option.isSubmitting
                  ? 'Getting option result...'
                  : 'Get Option None Response'}
              </button>

              <h3 className="text-xl">
                Option: {!option.result && '--'}
                {JSON.stringify(pickDecoded(option.result))}
              </h3>
            </li>

            <li>
              <h3 className="text-xl">
                Rococo Contracts Token Symbol: <b>{rocSymbol}</b>
              </h3>

              <h3 className="text-xl">
                Shibuya Token Symbol: <b>{shibuyaSymbol}</b>
              </h3>
            </li>

            <li>
              <h3 className="text-xl">Sign a message, and Verify it</h3>
              <input
                className="w-full p-3 mt-3 rounded-md text-brand-800 font-semibold"
                value={messageToSign}
                onChange={(e) => setMessageToSign(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  signatureVerifier.result !== VerificationState.Unchecked &&
                    signatureVerifier.resetState();

                  signer.sign(messageToSign);
                }}
                className="mt-3 w-full rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
              >
                Sign Message
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessageToSign('');
                  signer.resetState();
                }}
                className="mt-3 w-full rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
              >
                Reset State
              </button>

              {signer.signature && account?.address && (
                <div className="mt-3">
                  <textarea
                    className="text-sm text-black min-h-[80px] w-full rounded-md p-3"
                    value={signer.signature}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      signatureVerifier.verify(
                        messageToSign,
                        signer.signature || '',
                        account?.address,
                      );
                    }}
                    className="mt-3 w-full rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
                  >
                    Verify Signature
                  </button>

                  <button
                    type="button"
                    disabled={
                      signatureVerifier.result === VerificationState.Unchecked
                    }
                    onClick={() => {
                      signatureVerifier.resetState();
                    }}
                    className="mt-3 w-full disabled:bg-blue-50/50 rounded-2xl text-white px-6 py-4 bg-blue-500 hover:bg-blue-600 transition duration-75"
                  >
                    Reset Verification State
                  </button>

                  <p className="text-sm mt-3">
                    Verification Status: {signatureVerifier.result}
                  </p>
                </div>
              )}

              {signer.error && (
                <p className="text-sm text-error-500 mt-3">{signer.error}</p>
              )}
            </li>

            <li>
              <h3 className="text-xl">Deploy a Contract</h3>
              <Link
                className="text-brand-200 hover:text-brand-300 transition duration-75 underline"
                href="/deploy"
              >
                See a Deploy Example
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
