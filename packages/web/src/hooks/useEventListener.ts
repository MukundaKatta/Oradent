import { useEffect, useRef, RefObject } from 'react';

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

export function useEventListener<K extends keyof EventMap>(
  eventName: K,
  handler: (event: EventMap[K]) => void,
  element?: RefObject<HTMLElement | null>
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element?.current ?? window;

    const eventListener = (event: Event) => {
      savedHandler.current(event as EventMap[K]);
    };

    targetElement.addEventListener(eventName, eventListener);

    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
