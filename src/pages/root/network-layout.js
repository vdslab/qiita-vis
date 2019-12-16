const mod = window.egraph('https://unpkg.com/egraph/umd/egraph.wasm')

export default async (data) => {
  const { Graph, SimulationBuilder } = await mod
  const graph = new Graph()
  for (const node of data.nodes) {
    graph.addNode(node.id, node)
  }
  for (const link of data.links) {
    const { source, target } = link
    graph.addEdge(source, target, link)
  }
  const builder = SimulationBuilder.defaultNonConnected()
  const simulation = builder.start(graph)
  const nodes = data.nodes.map((node) =>
    Object.assign({}, node, {
      x: simulation.x(node.id),
      y: simulation.y(node.id)
    })
  )
  const links = data.links.map((link) => Object.assign({}, link))
  return { nodes, links }
}
