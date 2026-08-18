export default interface LogEntry {
  label: string;
  hash: string;
  timestamp: string;
  arrow: string;
  type: string;
  /**
   * The entry's raw JSON text, exactly as it appears in the log.
   *
   * This is the field the decoder actually sets (`text: jsonString` in
   * arena-log-decoder). `jsonString` below is declared but never populated —
   * see the note there.
   */
  text?: string;
  /**
   * @deprecated Never set. The decoder emits `text`; anything reading this
   * gets undefined, which is why the summarised-GRE guard in GreToClient has
   * been dead for as long as it has existed.
   */
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
