import {
  PropsWithChildren,
  MutableRefObject,
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

  const springConfig = { mass: 3, tension: 800, friction: 50 };
  const spring = useSpring({
    opacity: open ? 1 : 0,
    transform: `scale(${open ? 1 : 0.8})`,
    config: springConfig,
  });

  let left = (positionRef.current?.offsetLeft || 0) + (xOffset || 0);
  let top = (positionRef.current?.offsetTop || 0) + (yOffset || 0);

  if (direction === "LEFT") {
    left += (positionRef.current?.offsetWidth || 0) + 8;
  }
  if (direction === "RIGHT") {
    left -= width - 8;
  }
  if (direction === "DOWN") {
    top += (positionRef.current?.offsetHeight || 0) + 8;
  }
  if (direction === "UP") {
    top -= height - 8;
  }

  return (
    <animated.div
      className="alt-base"
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
