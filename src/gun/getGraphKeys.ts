/**
 * Retuns an array of the keys available inside the given Gun graph.
 * @param ref Gun chain reference
 * @returns array of keys inside that graph
 */
export default async function getGraphKeys(ref: any): Promise<string[]> {
  const graph = await ref.then();

  return graph?._ && graph?._[">"] ? Object.keys(graph._[">"]) : [];
}
