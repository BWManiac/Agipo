import { agent1ae3aa46b7b44477916d85ca120fe9e2Agent } from "./zen-chang-1ae3aa46-b7b4-4477-916d-85ca120fe9e2/config";
import { agent82a3899955c94c14904b65be2cdb94c5Agent } from "./test-agent-82a38999-55c9-4c14-904b-65be2cdb94c5/config";

export const agents = [agent1ae3aa46b7b44477916d85ca120fe9e2Agent,
  agent82a3899955c94c14904b65be2cdb94c5Agent];

export function getAgentById(id: string) {
  return agents.find((agent) => agent.id === id);
}
