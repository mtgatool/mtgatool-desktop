export default function reduxAction(type: string, arg: any) {
  window.postMessage({ type: "REDUX_ACTION", arg: { type, arg } });
}
