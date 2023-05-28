import { ChainId } from '../../../chains/mod.ts';
import { IApiProvider, IApiProviders } from './model.ts';

interface AddApiProvider {
  type: 'ADD_API_PROVIDER' | 'ADD_SMOLDOT_PROVIDER'
  chainId: ChainId;
  apiProvider: IApiProvider;
}

type Action = AddApiProvider;

export function apiProvidersReducer(
  state: IApiProviders,
  action: Action,
): IApiProviders {
  switch (action.type) {
    case 'ADD_API_PROVIDER':
      return {
        ...state,
        [action.chainId]: action.apiProvider,
      };

      case 'ADD_SMOLDOT_PROVIDER':
        return {
          ...state,
          [action.chainId]: action.apiProvider,
        };
  }
}
