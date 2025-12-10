import { agent1ae3aa46b7b44477916d85ca120fe9e2Agent } from "./zen-chang-1ae3aa46-b7b4-4477-916d-85ca120fe9e2/config";

export const agents = [agent1ae3aa46b7b44477916d85ca120fe9e2Agent];

export function getAgentById(id: string) {
  return agents.find((agent) => agent.id === id);
}
