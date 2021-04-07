import {
  useCallback,
  useState,
  PropsWithChildren,
  CSSProperties,
  MutableRefObject,
} from "react";

import { animated, useSpring } from "react-spring";

type PopupComponentProps = PropsWithChildren<{
  open: boolean;
  width: string;
  height: string;
  style?: CSSProperties;
  openFnRef: MutableRefObject<() => void>;
  closeFnRef: MutableRefObject<() => void>;
  persistent?: boolean;
  onClose?: () => void;
}>;

export default function PopupComponent(props: PopupComponentProps) {
  const {
    width,
    height,
    style,
    open,
    children,
    openFnRef,
    closeFnRef,
    persistent,
    onClose,
  } = props;
  const [state, setState] = useState<{ display: boolean; open: boolean }>({
    display: open,
    open,
  });

  const update = useCallback(() => {
    if (!state.open && state.display == true) {
      if (onClose) onClose();
      setState({ ...state, display: false });
    }
  }, [onClose, state]);

  const doOpen = useCallback(() => {
    setState({ open: true, display: true });
  }, []);

  const beginClose = useCallback(() => {
    setState({ open: false, display: true });
  }, []);

  openFnRef.current = doOpen;
  closeFnRef.current = beginClose;

  const springConfig = { mass: 3, tension: 1000, friction: 100 };
  const alphaSpring = useSpring({
    opacity: state.open ? 1 : 0,
    config: springConfig,
    onRest: update,
  }) as any;

  const scaleSpring = useSpring({
    transform: `scale(${state.open ? 1 : 0.8})`,
    config: springConfig,
  }) as any;

  return state.display ? (
    <animated.div
      style={alphaSpring}
      className="popup-container"
      onClick={persistent ? undefined : beginClose}
    >
      <animated.div
        className="popup-box"
        style={{
          ...scaleSpring,
          ...style,
          width,
          height,
        }}
        onClick={(e): void => {
          e.stopPropagation();
        }}
      >
        {children}
      </animated.div>
    </animated.div>
  ) : (
    <></>
  );
}
