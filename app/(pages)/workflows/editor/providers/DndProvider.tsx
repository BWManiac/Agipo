"use client";

import { useState, ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useWorkflowStore } from "../store";
import { DragOverlayContent } from "../components/drag-and-drop/DragOverlayContent";

interface DndProviderProps {
  children: ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<Record<string, unknown> | null>(null);

  const {
    addStepAtIndex,
    reorderSteps,
    moveStepIntoContainer,
    moveStepToLane,
  } = useWorkflowStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveData(event.active.data.current as Record<string, unknown>);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveData(null);
      return;
    }

    const activeDataCurrent = active.data.current as Record<string, unknown>;
    const overDataCurrent = over.data.current as Record<string, unknown>;
    const overType = overDataCurrent?.type as string;

    // Palette drag (new item) to main rail
    if (activeDataCurrent?.isNew && overType !== "container-drop-zone" && overType !== "branch-lane-drop" && overType !== "parallel-lane-drop") {
      const dropIndex = (overDataCurrent?.index as number) ?? 0;
      addStepAtIndex(activeDataCurrent, dropIndex);
    }
    // Palette drag to container
    else if (activeDataCurrent?.isNew && overType === "container-drop-zone") {
      const containerId = overDataCurrent?.containerId as string;
      const index = (overDataCurrent?.index as number) ?? 0;
      // First add to main rail, then move into container
      addStepAtIndex(activeDataCurrent, 0);
      // The new step will have the latest ID, we need to move it
      // For now, this creates at index 0 and moves - a bit clunky but works
      const newStepId = useWorkflowStore.getState().steps[0]?.id;
      if (newStepId && containerId) {
        moveStepIntoContainer(newStepId, containerId, index);
      }
    }
    // Palette drag to branch lane
    else if (activeDataCurrent?.isNew && overType === "branch-lane-drop") {
      const branchStepId = overDataCurrent?.branchStepId as string;
      const conditionIndex = overDataCurrent?.conditionIndex as number;
      addStepAtIndex(activeDataCurrent, 0);
      const newStepId = useWorkflowStore.getState().steps[0]?.id;
      if (newStepId && branchStepId) {
        moveStepToLane(newStepId, branchStepId, conditionIndex, "branch");
      }
    }
    // Palette drag to parallel lane
    else if (activeDataCurrent?.isNew && overType === "parallel-lane-drop") {
      const parallelStepId = overDataCurrent?.parallelStepId as string;
      const laneIndex = overDataCurrent?.laneIndex as number;
      addStepAtIndex(activeDataCurrent, 0);
      const newStepId = useWorkflowStore.getState().steps[0]?.id;
      if (newStepId && parallelStepId) {
        moveStepToLane(newStepId, parallelStepId, laneIndex, "parallel");
      }
    }
    // Existing step drop to container
    else if (!activeDataCurrent?.isNew && overType === "container-drop-zone") {
      const containerId = overDataCurrent?.containerId as string;
      const index = overDataCurrent?.index as number;
      moveStepIntoContainer(active.id as string, containerId, index);
    }
    // Existing step drop to branch lane
    else if (!activeDataCurrent?.isNew && overType === "branch-lane-drop") {
      const branchStepId = overDataCurrent?.branchStepId as string;
      const conditionIndex = overDataCurrent?.conditionIndex as number;
      moveStepToLane(active.id as string, branchStepId, conditionIndex, "branch");
    }
    // Existing step drop to parallel lane
    else if (!activeDataCurrent?.isNew && overType === "parallel-lane-drop") {
      const parallelStepId = overDataCurrent?.parallelStepId as string;
      const laneIndex = overDataCurrent?.laneIndex as number;
      moveStepToLane(active.id as string, parallelStepId, laneIndex, "parallel");
    }
    // Workflow drag (reorder on main rail)
    else if (active.id !== over.id) {
      reorderSteps(active.id as string, over.id as string);
    }

    setActiveId(null);
    setActiveData(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeId && activeData && <DragOverlayContent data={activeData} />}
      </DragOverlay>
    </DndContext>
  );
}

