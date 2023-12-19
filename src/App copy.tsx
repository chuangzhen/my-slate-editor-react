import React, { useCallback, useState, ReactElement, MouseEvent } from 'react';
import logo from './logo.svg';
import './App.less';
// Import the Slate editor factory.
import type {} from 'slate'
import { createEditor, Selection, BaseRange, Transforms, Editor, Descendant, BaseEditor, Text,Node } from 'slate'
// Import the Slate components and React plugin.
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps, useSlate, useSelected, useFocused } from 'slate-react'
import { BaseElement, BaseText } from 'slate/dist/interfaces';
import { withHtml, deserialize } from './utils'
import { Button, Toolbar, Icon } from './components';
import { css } from '@emotion/css';
import ClipboardJS from 'clipboard';
import { withHistory } from 'slate-history';

interface HistoryEditor extends BaseEditor {
  history: History
  undo: () => void
  redo: () => void
  writeHistory: (stack: 'undos' | 'redos', batch: any) => void
}

const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: "By default, pasting content into a Slate editor will use the clipboard's ",
      },
      { text: "'text/plain'", code: true },
      {
        text: " data. That's okay for some use cases, but sometimes you want users to be able to paste in content and have it maintain its formatting. To do this, your editor needs to handle ",
      },
      { text: "'text/html'", code: true },
      { text: ' data. ' },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: 'This is an example of doing exactly that!' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: "Try it out for yourself! Copy and paste some rendered HTML rich text content (not the source code) from another site into this editor and it's formatting should be preserved.",
      },
    ],
  },
]


const ImageElement = ({ attributes, children, element }: RenderElementProps) => {
  console.log(children, element, '=====image=======')
  const selected = useSelected()
  const focused = useFocused()
  return (
    <div {...attributes}>
      {children}
      <img
        //@ts-ignore
        src={element.url}
        className={css`
          display: block;
          max-width: 100%;
          max-height: 20em;
          box-shadow: ${selected && focused ? '0 0 0 2px blue;' : 'none'};
        `}
      />
    </div>
  )
}


interface MyElementProps extends BaseElement {
  type: string
  url?: string
  [name: string]: any
}
interface MyRenderElementProps extends RenderElementProps {
  element: MyElementProps
}
const MyElement = (props: RenderElementProps) => {
  const { children, element, attributes } = props as MyRenderElementProps
  switch (element.type) {
    default:
      return <p {...attributes}>{children}</p>
    case 'quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'code':
      return (
        <pre>
          <code {...attributes}>{children}</code>
        </pre>
      )
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>
    case 'heading-four':
      return <h4 {...attributes}>{children}</h4>
    case 'heading-five':
      return <h5 {...attributes}>{children}</h5>
    case 'heading-six':
      return <h6 {...attributes}>{children}</h6>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'link':
      return (
        <a href={element.url} {...attributes}>
          {children}
        </a>
      )
    case 'image':
      return <ImageElement {...props} />
    case 'button':
      return <button {...attributes}>{children}</button>
  }
}
interface MyLeafProps extends BaseText {
  bold?: boolean
  code?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
}
interface MyRenderLeafProps extends RenderLeafProps {
  leaf: MyLeafProps
}
const MyLeaf = (props: RenderLeafProps) => {
  const { children, leaf, attributes } = props as MyRenderLeafProps
  let newChildren = children
  if (leaf.bold) {
    newChildren = <strong>{newChildren}</strong>
  }
  if (leaf.code) {
    newChildren = <code>{newChildren}</code>
  }
  if (leaf.italic) {
    newChildren = <em>{newChildren}</em>
  }
  if (leaf.underline) {
    newChildren = <u>{newChildren}</u>
  }
  if (leaf.strikethrough) {
    newChildren = <del>{newChildren}</del>
  }

  return <span {...attributes}>{newChildren}</span>

}


interface MyEditorProps extends BaseEditor {
  type?: string
}
const CustomEditor = {
  isMarkLeafActive(editor: Editor, format: string) {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
  },
  isBlockElemActive(editor: Editor, type: string) {
    const [match] = Editor.nodes(editor, {
      match: (n: MyEditorProps) => n.type === type
    })

    return !!match
  },

  toggleLeafMark(editor: Editor, format: string) {
    const isActive = this.isMarkLeafActive(editor, format)
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  },

  toggleCodeBlock(editor: Editor, type: string) {
    const match = this.isBlockElemActive(editor, type)

    Transforms.setNodes(
      editor,
      //@ts-ignore
      { type: match ? 'paragraph' : `${type}` },
      //@ts-ignore
      { match: n => Editor.isBlock(editor, n) }
    )

  }
}


interface MyTextNode {
  key: number
}

function App() {

  const [editor] = useState(() => withHtml(withHistory(withReact(createEditor()))))
  const [nodesList, setNodeList] = useState<JSX.Element[]>([])
  const [selectFragment, setFragment] = useState<Descendant | null>(null)

  const renderElement = useCallback((props: RenderElementProps) => <MyElement {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <MyLeaf {...props} />, [])


  const handleCopy = (editor: Editor) => {
    if (!selectFragment) {
      return false
    }
    handleSerial(selectFragment)
    // 初始化clipboard
    var clipboard = new ClipboardJS('#copyBtn', {
      target: function (trigger) {
        let dom = document.querySelector('#copyArea')
        return dom
      },
      action: () => {
        return 'copy'
      }
    });

    clipboard.on('success', function (e) {
      console.log(e);
    });

    clipboard.on('error', function (e) {
      console.log(e);
    });

  }
  // todo 粘贴后，光标的位置要重置
  const handlePaste = async (editor: Editor) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        let type = 'text/plain'
        if (clipboardItem.types.includes('text/html')) {
          type = 'text/html'
        }
        const blob = await clipboardItem.getType(type);
        const html = await blob.text()
        // console.log(html, '==html==', type);

        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const fragment = deserialize(parsed.body)
        Transforms.insertFragment(editor, fragment)
      }
    } catch (err) {
      // console.error(err);
    }
  }
  const handleCut = (editor: Editor) => {
    if (!selectFragment) {
      return false
    }
    handleSerial(selectFragment)
    // 初始化clipboard
    var clipboard = new ClipboardJS('#cutBtn', {
      target: function (trigger) {
        let dom = document.querySelector('#copyArea')
        return dom
      }
    });

    clipboard.on('success', function (e) {
      console.log(e, '===11111');
      Editor.deleteFragment(editor)
      setFragment(null)
    });

    clipboard.on('error', function (e) {
      console.log(e);
    });
  }
  const handleSerial = (desc: Descendant) => {
    console.log(desc, '==desc==');
    setNodeList([])
    //@ts-ignore
    const nodes = desc.map(({ children, ...others }, index: number) => {
      //@ts-ignore
      let childLeaf = children.map(item => {
        //@ts-ignore
        return <MyLeaf children={item.text} leaf={item} attributes={{ 'data-slate-leaf': true }} />
      })
      return < MyElement
        children={childLeaf}
        //@ts-ignore
        element={{ ...others }}
        attributes={
          {
            'data-slate-node': "element",
            'ref': null
          }
        }
      />

    });
    setNodeList(nodes)
    console.log(nodes, '==nodes==')

  }
  const handleUndo = (editor: HistoryEditor) => {
    console.log(editor, '==undo==')
    editor.undo()
  }
  const handleTodo = (editor: HistoryEditor) => {
    editor.redo()
  }


  return (
    <div className="App">
      <Slate editor={editor}
        initialValue={initialValue}
        onSelectionChange={(selection: Selection) => {
          editor.selection
          console.log(selection, 'selection==selection',editor.selection)
          const { anchor, focus } = selection as BaseRange
          if (JSON.stringify(anchor) !== JSON.stringify(focus)) {
            const fragment = editor.getFragment()
            setFragment(fragment)
            console.log(fragment, '==fragment==fragment')
          }

          // Editor
          //  获取鼠标选中的内容

        }}
      >
        <Toolbar>
          <span>菜单栏：</span>
          <DefaultButton id="copyBtn" format="copy" onClick={() => handleCopy(editor)} icon="copy" />
          <DefaultButton id="cc" format="paste" onClick={() => handlePaste(editor)} icon="paste" />
          <DefaultButton id="cutBtn" format="cut" onClick={() => handleCut(editor)} icon="cut" />
          <DefaultButton format="undo" icon="undo" onClick={() => handleUndo(editor)} />
          <DefaultButton format="todo" icon="todo" onClick={() => handleTodo(editor)} />

          <MarkButton format="bold" icon="format_bold" />
          <MarkButton format="italic" icon="format_italic" />
          <MarkButton format="underline" icon="format_underlined" />

          <BlockButton format="code" icon="code" />
          <BlockButton format="heading-one" icon="looks_one" />
          <BlockButton format="heading-two" icon="looks_two" />
          <BlockButton format="block-quote" icon="format_quote" />
          <BlockButton format="numbered-list" icon="format_list_numbered" />
          <BlockButton format="bulleted-list" icon="format_list_bulleted" />

        </Toolbar>

        <div className="container">
          <div>侧边栏1</div>
          <div>侧边栏2</div>
          <Editable
            autoFocus={true}
            className="editor"
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={(event) => {
              if (!event.ctrlKey) return false
              // 添加一个ctrl-` 的快捷插入代码块的快捷按钮
              switch (event.key) {
                case '`':
                  event.preventDefault()
                  CustomEditor.toggleCodeBlock(editor, 'code')
                  break;

                case 'b':
                  event.preventDefault();
                  CustomEditor.toggleLeafMark(editor, 'bold')
                  break
              }


            }}
          />
        </div>
      </Slate>


      <div id="copyArea">{nodesList}</div>
    </div>
  );
}

export default App;

// const Button = ({ active, onMouseDown, children }: { active: boolean, onMouseDown: any, children: ReactElement }) => {
//   return <div
//     onMouseDown={onMouseDown}
//     style={active ?
//       { backgroundColor: 'lightblue', border: '1px solid #e8e8e8', fontWeight: 'bold' } : {}}
//   >{children}</div>
// }
const MarkButton = ({ format, icon }: { format: string, icon: string }) => {
  const editor = useSlate()
  return (
    <Button
      active={CustomEditor.isMarkLeafActive(editor, format)}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault()
        CustomEditor.toggleLeafMark(editor, format)
      }}
    >
      {/* <div>{format}</div> */}
      <Icon>{format}</Icon>
    </Button>
  )
}
const BlockButton = ({ format, icon, onClick }: { format: string, icon: string, onClick?: () => void }) => {
  const editor = useSlate()
  return (
    <Button
      active={CustomEditor.isBlockElemActive(editor, format)}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault()
        CustomEditor.toggleCodeBlock(editor, format)
      }}
      onClick={onClick}
    >
      {/* <div>{format}</div> */}
      <Icon>{format}</Icon>
    </Button>
  )
}
const DefaultButton = ({ format, icon, onClick, id }: { format: string, icon: string, id?: string, onClick?: () => void }) => {
  const editor = useSlate()
  return (
    <Button
      active={false}
      onClick={onClick}
      id={id}
    >
      {/* <div>{format}</div> */}
      <Icon>{format}</Icon>
    </Button>
  )
}