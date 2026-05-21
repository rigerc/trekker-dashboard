'use client';

import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  delay?: number;
  moveTolerance?: number;
  onLongPress: () => void;
}

const DEFAULT_LONG_PRESS_DELAY_MS = 500;
const DEFAULT_MOVE_TOLERANCE_PX = 8;

function hapticAcknowledgement() {
  window.navigator.vibrate?.(6);
}

function hapticConfirm() {
  window.navigator.vibrate?.([8, 30, 12]);
}

function hapticCancel() {
  window.navigator.vibrate?.(4);
}

export function useLongPress({
  delay = DEFAULT_LONG_PRESS_DELAY_MS,
  moveTolerance = DEFAULT_MOVE_TOLERANCE_PX,
  onLongPress,
}: UseLongPressOptions) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPointRef.current = null;
    setIsPressing(false);
  }, []);

  function handlePointerDown(event: React.PointerEvent) {
    if (event.pointerType !== 'touch') return;

    firedRef.current = false;
    setIsPressing(true);
    hapticAcknowledgement();
    startPointRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      hapticConfirm();
      onLongPress();
    }, delay);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!startPointRef.current) return;

    const deltaX = Math.abs(event.clientX - startPointRef.current.x);
    const deltaY = Math.abs(event.clientY - startPointRef.current.y);
    if (deltaX > moveTolerance || deltaY > moveTolerance) {
      hapticCancel();
      clearLongPress();
    }
  }

  function handlePointerEnd() {
    if (timerRef.current && !firedRef.current) {
      hapticCancel();
    }
    clearLongPress();
  }

  function shouldSuppressClick() {
    const shouldSuppress = firedRef.current;
    firedRef.current = false;
    return shouldSuppress;
  }

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerCancel: handlePointerEnd,
    onPointerUp: handlePointerEnd,
    shouldSuppressClick,
    isPressing,
  };
}
