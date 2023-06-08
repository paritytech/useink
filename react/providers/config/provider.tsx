import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ChainRPCs, ConfigProps, DEFAULT_CONFIG } from "./model.ts";
import { ConfigContext } from "./context.ts";
import { Chain, ChainId } from "../../../chains/mod.ts";

export interface Props {
  config: ConfigProps;
}

const toInitialRpcs = (c: Chain[], rpcs: ChainRPCs): ChainRPCs =>
  c.reduce(
    (acc, ch) => ({ ...acc, [ch.id]: ch.rpcs?.[0] || "" }),
    {} as Record<ChainId, string>
  );

export const ConfigProvider: React.FC<React.PropsWithChildren<Props>> = ({
  config,
  children,
}) => {
  const defaultChainId = useMemo(() => config.chains[0].id, [config.chains[0]]);
  const [chainRpcs, setChainRpcs] = useState<ChainRPCs>(
    toInitialRpcs(config.chains, {} as ChainRPCs)
  );

  const setChainRpc = useCallback((rpc: string, cid?: ChainId) => {
    const chainIdOrDefault = cid || defaultChainId;
    chainIdOrDefault && setChainRpcs({ ...chainRpcs, [chainIdOrDefault]: rpc });
  }, []);

  const setConnectionType = useCallback((type: string, c?: Chain | "all") => {
    if (!c) {
      config.api = defaultChainId;
      return;
    }
    if (c === "all") {
      config.api = { default: type };
      return;
    }
    config.api[c.id] = type;
  }, []);

  useEffect(() => {
    setChainRpcs(toInitialRpcs(config.chains, chainRpcs));

    if (!config.chains.length) {
      const error = "Chains not configured in Config Provider";
      console.error(error);
      throw Error(error);
    }
  }, [config.chains]);

  return (
    <ConfigContext.Provider
      value={{
        ...DEFAULT_CONFIG,
        ...config,
        setChainRpc,
        setConnectionType,
        chainRpcs,
      }}
      children={children}
    />
  );
};
