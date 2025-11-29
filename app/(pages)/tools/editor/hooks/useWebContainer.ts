import { useEffect } from "react";
import { useWorkflowGeneratorStore } from "../store";

/**
 * Manages the WebContainer lifecycle, ensuring it boots on mount and tears
 * down on unmount.
 */
export function useWebContainer() {
  const bootRuntime = useWorkflowGeneratorStore((state) => state.bootRuntime);
  const teardownRuntime = useWorkflowGeneratorStore(
    (state) => state.teardownRuntime
  );

  useEffect(() => {
    // Bootstrap the webcontainer on mount; tear it down when navigating away.
    bootRuntime();
    return () => {
      teardownRuntime();
    };
  }, [bootRuntime, teardownRuntime]);
}
