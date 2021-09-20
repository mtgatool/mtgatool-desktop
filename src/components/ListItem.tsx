import { PropsWithChildren, useCallback } from "react";
import { useDispatch } from "react-redux";

import { ReactComponent as ArchiveIcon } from "../assets/images/svg/archive.svg";
import { getCardArtCrop } from "../utils/getCardArtCrop";

interface ListItemProps extends JSX.ElementChildrenAttribute {
  click?: () => void;
}

export function ListItem(props: PropsWithChildren<ListItemProps>): JSX.Element {
  const { click, children } = props;
  return (
    <div
      onClick={click}
      className={`list-item-container${!click ? "-nohover" : ""}`}
    >
      {children}
    </div>
  );
}

interface HoverTileProps {
  grpId: number;
}

export function HoverTile(
  props: PropsWithChildren<HoverTileProps>
): JSX.Element {
  const { grpId, children } = props;

  return (
    <div
      className="list-item-image"
      style={{ backgroundImage: `url(${getCardArtCrop(grpId)})` }}
    >
      {children}
    </div>
  );
}

interface ColumnProps extends JSX.ElementChildrenAttribute {
  style?: React.CSSProperties;
  className?: string;
}

export function Column(props: PropsWithChildren<ColumnProps>): JSX.Element {
  const { style, className, children } = props;

  return (
    <div
      style={{ ...style, flexDirection: "column" }}
      className={className || ""}
    >
      {children}
    </div>
  );
}

interface FlexProps extends JSX.ElementChildrenAttribute {
  title?: string;
  style?: React.CSSProperties;
  innerClass?: string;
}

export function FlexTop(props: PropsWithChildren<FlexProps>): JSX.Element {
  const { style, innerClass, children, title } = props;

  return (
    <div style={style} className="flex-top">
      {innerClass ? (
        <div title={title} className={innerClass}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export const FlexBottom = FlexTop;

interface ArchiveButtonProps {
  archiveCallback: (id: string) => void;
  dataId: string;
}

export function ArchiveButton(props: ArchiveButtonProps): JSX.Element {
  const { archiveCallback, dataId } = props;
  const dispatcher = useDispatch();
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      archiveCallback(dataId);
    },
    [archiveCallback, dataId, dispatcher]
  );

  return (
    <div
      onClick={onClick}
      className="list-item-archive"
      title="delete permanently"
    >
      <ArchiveIcon
        style={{
          margin: "auto",
          fill: `var(--color-icon)`,
        }}
      />
    </div>
  );
}
