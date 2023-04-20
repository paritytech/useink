import { Header } from "@polkadot/types/interfaces";
import { ChainId } from "useink/chains";

export interface BlockHeader {
  blockNumber: number | undefined;
  header: Header | undefined;
}

export type ChainBlockHeaders = Partial<Record<ChainId, BlockHeader>>;

export const BLOCK_HEADER_DEFAULTS: ChainBlockHeaders = {};