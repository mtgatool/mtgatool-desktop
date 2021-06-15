/* eslint-disable react/jsx-props-no-spreading */

export default function InputContainer(
  props: React.PropsWithChildren<any>
): JSX.Element {
  const { className, children } = props;
  return (
    <div {...props} className={`${className ?? ""} input-container`}>
      {children}
    </div>
  );
}
