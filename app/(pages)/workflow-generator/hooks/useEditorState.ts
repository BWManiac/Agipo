import { useWorkflowGeneratorStore } from "../store";

/**
 * Manages the state of the editor UI, such as the active sidebar tab,
 * the currently editing node, and the active layer.
 */
export function useEditorState() {
  const activeLayer = useWorkflowGeneratorStore((state) => state.activeLayer);
  const setActiveLayer = useWorkflowGeneratorStore(
    (state) => state.setActiveLayer
  );
  const activeSidebarTab = useWorkflowGeneratorStore(
    (state) => state.activeSidebarTab
  );
  const setSidebarTab = useWorkflowGeneratorStore(
    (state) => state.setSidebarTab
  );
  const editingNodeId = useWorkflowGeneratorStore(
    (state) => state.editingNodeId
  );
  const openEditor = useWorkflowGeneratorStore((state) => state.openEditor);

  return {
    activeLayer,
    setActiveLayer,
    activeSidebarTab,
    setSidebarTab,
    editingNodeId,
    openEditor,
  };
}
