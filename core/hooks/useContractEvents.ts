import { Abi } from '@polkadot/api-contract';
import { Bytes } from '@polkadot/types';
import { useContext, useEffect } from 'react';
import { FIVE_SECONDS, HALF_A_SECOND } from '../constants.ts';
import {
  ContractEvent,
  ContractEventsContext,
} from '../providers/contractEvents/mod.ts';
import { getExpiredItem } from '../utils/getExpiredItem.ts';
import { useApi } from './useApi.ts';
import { useBlockHeader } from './substrate/useBlockHeader.ts';
import { useConfig } from './useConfig.ts';
import { useInterval } from './useInterval.ts';

export const useContractEvents = (
  address: string,
  abi: Abi,
): ContractEvent[] => {
  const { events, addContractEvent, removeContractEvent } = useContext(
    ContractEventsContext,
  );
  const { api } = useApi();
  const { blockNumber, header } = useBlockHeader();
  const C = useConfig();

  const eventsForAddress = events[address] || [];

  useEffect(() => {
    address &&
      abi &&
      api &&
      header?.hash &&
      api.at(header?.hash).then((apiAt) => {
        apiAt?.query?.system?.events &&
          apiAt.query.system.events((encodedEvent: any[]) => {
            encodedEvent.forEach(({ event }) => {
              if (
                api.events.contracts?.ContractEmitted &&
                api.events.contracts.ContractEmitted.is(event)
              ) {
                const [contractAddress, contractEvent] = event.data;
                if (
                  address && contractAddress &&
                  contractAddress.toString().toLowerCase() ===
                    address.toLowerCase()
                ) {
                  try {
                    const decodedEvent = abi.decodeEvent(
                      contractEvent as Bytes,
                    );

                    const eventItem = {
                      address,
                      event: {
                        name: decodedEvent.event.identifier,
                        args: decodedEvent.args.map((v) => v.toHuman()),
                      },
                    };

                    addContractEvent(eventItem);
                  } catch (e) {
                    console.error(e);
                  }
                }
              }
            });
          });
      });
  }, [api, blockNumber]);

  useInterval(() => {
    const expiredEvents = getExpiredItem<ContractEvent>(
      eventsForAddress,
      C.notifications?.expiration || FIVE_SECONDS,
    );
    for (const contractEvent of expiredEvents) {
      removeContractEvent({ eventId: contractEvent.id, address });
    }
  }, C.notifications?.checkInterval || HALF_A_SECOND);

  return eventsForAddress;
};
