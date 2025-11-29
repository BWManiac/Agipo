import { useWorkflowGeneratorStore } from "../store";

/**
 * Manages the execution state of the workflow, including running code,
 * installing dependencies, and tracking their loading states.
 */
export function useExecution() {
  const {
    output,
    isBooting,
    isInstalling,
    packageName,
    installDependency,
    runWorkflow,
    setPackageName,
  } = useWorkflowGeneratorStore();

  return {
    output,
    isBooting,
    isInstalling,
    packageName,
    installDependency,
    runWorkflow,
    setPackageName,
  };
}
