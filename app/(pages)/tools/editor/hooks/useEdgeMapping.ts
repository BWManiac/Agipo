import { useWorkflowGeneratorStore } from "../store";

/**
 * Manages all logic for creating and modifying the data mappings (bindings)
 * between node inputs and outputs when an edge is selected.
 */
export function useEdgeMapping() {
  const mappings = useWorkflowGeneratorStore((state) => state.mappings);
  const activeEdgeId = useWorkflowGeneratorStore((state) => state.activeEdgeId);
  const setActiveEdge = useWorkflowGeneratorStore(
    (state) => state.setActiveEdge
  );
  const linkFields = useWorkflowGeneratorStore((state) => state.linkFields);
  const unlinkField = useWorkflowGeneratorStore((state) => state.unlinkField);
  const setStaticValue = useWorkflowGeneratorStore(
    (state) => state.setStaticValue
  );

  return {
    mappings,
    activeEdgeId,
    setActiveEdge,
    linkFields,
    unlinkField,
    setStaticValue,
  };
}
