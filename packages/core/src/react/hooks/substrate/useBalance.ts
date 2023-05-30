import { useEffect, useState } from "react";
import { useApi } from "../substrate/useApi.ts";
import { useBlockHeader } from "./useBlockHeader.ts";
import { ChainId } from "../../../chains/index";
import { useChain } from "../index";
import { DeriveBalancesAccount, WithAddress } from "../../../core/index";
import { getBalance } from "../../../core/index";

export const useBalance = (
  account: WithAddress | undefined,
  chainId?: ChainId
): DeriveBalancesAccount | undefined => {
  const [balance, setBalance] = useState<DeriveBalancesAccount>();
  const { blockNumber } = useBlockHeader(chainId) || {};
  const chainConfig = useChain(chainId);
  const chain = useApi(chainConfig?.id);

  useEffect(() => {
    if (!chain?.api || !account || !account.address) return;
    getBalance(chain.api, account).then(setBalance).catch(console.error);
  }, [blockNumber, account]);

  return balance;
};
