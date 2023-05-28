import React, { useEffect, useReducer } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { ScProvider } from "@polkadot/rpc-provider/substrate-connect";
import * as Sc from "@substrate/connect";
import { useChains } from "../../hooks/mod.ts";
import { APIContext } from "./context.ts";
import { apiProvidersReducer } from "./reducer.ts";
import { useConfig } from "../../mod.ts";
import { Chain, ChainId } from "../../../chains/mod.ts";

export const APIProvider: React.FC<React.PropsWithChildren<any>> = ({
  children,
}) => {
  const chains = useChains();
  const { chainRpcs } = useConfig();
  const [apis, dispatch] = useReducer(apiProvidersReducer, {});

  const addApiProvider = (chain: Chain) => {
    const provider = new WsProvider(chainRpcs[chain.id] || chain.rpcs[0]);

    ApiPromise.create({ provider }).then((api) => {
      dispatch({
        type: "ADD_API_PROVIDER",
        chainId: chain.id,
        apiProvider: { api, provider },
      });
    });
  };

  const addSmoldotProvider = async (chain: Chain) => {
    const provider = new ScProvider(Sc, chain.id);
    await provider.connect();
    const api = await ApiPromise.create({ provider });

    ApiPromise.create({ provider }).then((api) => {
      dispatch({
        type: "ADD_SMOLDOT_PROVIDER",
        chainId: chain.id,
        apiProvider: { api, provider },
      });
    });
  };

  useEffect(() => {
    chains.forEach((chain) => {
      addApiProvider(chain);
      addSmoldotProvider(chain);
    });
  }, [chains, chainRpcs]);

  return <APIContext.Provider value={{ apis }} children={children} />;
};
