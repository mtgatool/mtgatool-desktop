/* eslint-disable no-restricted-globals */
export default function reduxAction(type: string, arg: any) {
  self.postMessage({ type: "REDUX_ACTION", arg: { type, arg } });
}
