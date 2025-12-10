export const agents = [];

export function getAgentById(id: string) {
  return agents.find((agent) => agent.id === id);
}
