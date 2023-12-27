import { BaseEditor, BaseElement, Node } from "slate";
import { ReactEditor } from "slate-react";
import ee from 'event-emitter'
import {
  TableElement,
  TableRowElement,
  TableCellElement,
} from "./components/Table/customTypes";

type ParagraphElement = { type: "paragraph"; children: Descendant[] };
type CustomElement =
  | ParagraphElement
  | TableElement
  | TableRowElement
  | TableCellElement;

type extendEditor = {
  tableState: {
    showSelection: boolean
    selection: Path[]
  }
  // 自定义事件
  on: (type: string, listener: ee.EventListener) => void
  off: (type: string, listener: ee.EventListener) => void
  once: (type: string, listener: ee.EventListener) => void
  emit: (type: string, ...args: any[]) => void
}
export type CustomEditor = BaseEditor & ReactEditor & extendEditor;

declare module "slate" {
  export interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
  }
  export interface BaseElement {
    type?: string
  }

  export type Node = Editor | Element | Text | { colSpan?: number, rowSpan?: number, children?: Element[] };
}

// declare const NodeTransforms {
//   interface CustomNode extends
//   export setNodes: <T extends Node>(editor: Editor, props: Partial<T>, options?: {
//     at?: Location;
//     match?: NodeMatch<T>;
//     mode?: MaximizeMode;
//     hanging?: boolean;
//     split?: boolean;
//     voids?: boolean;
//     compare?: PropsCompare;
//     merge?: PropsMerge;
// }) => void;
// }
