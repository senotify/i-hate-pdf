import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { MultiBackend, TouchTransition } from "react-dnd-multi-backend";

// Configure multi-backend to support both mouse and touch
export const DndMultiBackend = MultiBackend;

export const DndBackendOptions = {
  backends: [
    {
      id: "html5",
      backend: HTML5Backend,
      transition: TouchTransition,
    },
    {
      id: "touch",
      backend: TouchBackend,
      options: { enableMouseEvents: true },
      preview: true,
      transition: TouchTransition,
    },
  ],
};
