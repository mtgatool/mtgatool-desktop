export default interface LogEntry {
  label: string;
  hash: string;
  timestamp: string;
  arrow: string;
  type: string;
  jsonString?: string;
  json: any;
  size: number;
  position: number;
}

export interface ClientSceneChange {
  fromSceneName: string;
  toSceneName: string;
  initiator: string;
  context: string;
}
