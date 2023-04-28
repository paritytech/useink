import React from 'react'
import { EventsContext } from './context.ts'
import { AddEventPayload, DEFAULT_EVENTS, RemoveEventPayload } from './model.ts'
import { useIsMounted } from '../../hooks/useIsMounted.ts'
import { eventsReducer } from './reducer.ts'
import { pseudoRandomId } from '../../utils'

// @internal
export const EventsProvider: React.FC<React.PropsWithChildren<any>> = ({
  children,
}) => {
  const [events, dispatch] = React.useReducer(eventsReducer, DEFAULT_EVENTS)
  const isMounted = useIsMounted()

  const addEvent = React.useCallback(
    ({ event, address }: AddEventPayload) => {
      if (isMounted()) {
        dispatch({
          type: 'ADD_EVENT',
          address,
          event: { ...event, id: pseudoRandomId(), createdAt: Date.now() },
        })
      }
    },
    [dispatch],
  )

  const removeEvent = React.useCallback(
    ({ eventId, address }: RemoveEventPayload) => {
      if (isMounted()) {
        dispatch({
          type: 'REMOVE_EVENT',
          address,
          eventId,
        })
      }
    },
    [dispatch],
  )

  return (
    <EventsContext.Provider
      value={{ addEvent, events, removeEvent }}
      children={children}
    />
  )
}
