import {
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useState,
} from "react";
import { animated, useSpring } from "react-spring";

interface AltProps {
  direction: "UP" | "DOWN" | "RIGHT" | "LEFT";
  defaultOpen: boolean;
  width: number;
  height: number;
  xOffset?: number;
  yOffset?: number;
  tip?: boolean;
  doHide: MutableRefObject<() => void>;
  doOpen: MutableRefObject<() => void>;
  positionRef: React.RefObject<HTMLDivElement>;
}

export default function Alt(props: PropsWithChildren<AltProps>) {
  const {
    direction,
    defaultOpen,
    width,
    height,
    xOffset,
    yOffset,
    tip,
    children,
    doHide,
    doOpen,
    positionRef,
  } = props;
  const [open, setOpen] = useState(defaultOpen);

  const hideFn = useCallback(() => {
    setOpen(false);
  }, []);

  const openFn = useCallback(() => {
    setOpen(true);
  }, []);

  doHide.current = hideFn;
  doOpen.current = openFn;

  const springConfig = { mass: 3, tension: 600, friction: 40 };
  const spring = useSpring({
    opacity: open ? 1 : 0,
    transform: `scale(${open ? 1 : 0.9})`,
    config: springConfig,
  });

  let left = (positionRef.current?.offsetLeft || 0) + (xOffset || 0);
  let top = (positionRef.current?.offsetTop || 0) + (yOffset || 0);

  if (direction === "LEFT") {
    top += (positionRef.current?.offsetHeight || 0) / 2 - height / 2;
    left += (positionRef.current?.offsetWidth || 0) + 12;
  }
  if (direction === "RIGHT") {
    top += (positionRef.current?.offsetHeight || 0) / 2 - height / 2;
    left -= width + 12;
  }
  if (direction === "UP") {
    top += (positionRef.current?.offsetHeight || 0) + 12;
    left += (positionRef.current?.offsetWidth || 0) / 2 - width / 2;
  }
  if (direction === "DOWN") {
    top -= height + 12;
    left += (positionRef.current?.offsetWidth || 0) / 2 - width / 2;
  }

  return (
    <animated.div
      className={`alt-base ${tip ? `tip-${direction.toLowerCase()}` : ""}`}
      style={{
        ...spring,
        left,
        top,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {children}
    </animated.div>
  );
}
