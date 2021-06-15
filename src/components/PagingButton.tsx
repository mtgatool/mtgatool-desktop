/* eslint-disable react/jsx-props-no-spreading */
interface PagingButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  selected?: boolean;
}

export default function PagingButton(props: PagingButtonProps) {
  const { className, disabled, selected } = props;
  return (
    <button
      {...props}
      type="button"
      className={`${className ?? ""} ${
        disabled ? "paging-button-disabled" : "paging-button"
      } ${selected ? "paging-active" : ""}`}
    />
  );
}
