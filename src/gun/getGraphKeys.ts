export default async function getGraphKeys(ref: any): Promise<string[]> {
  const graph = await ref.then();

  return graph?._[">"] ? Object.keys(graph._[">"]) : [];
}
