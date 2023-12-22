import { Editor, Transforms, Range, Point } from 'slate';
import React from 'react';
import { deserialize, handleSerialize } from '../utils'
import ClipboardJS from 'clipboard';
import ReactDOM from 'react-dom/client';
const merge = require('deepmerge')
const WRAP_TYPES = [
    {
        type: 'numbered-list',
        childType: 'list-item'
    },
    {
        type: 'bulleted-list',
        childType: 'list-item'
    },
    {
        type: 'block-code'
    },
    {
        type: 'block-quote'
    }
];

const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format);
    const config = WRAP_TYPES.find((item) => item.type === format);
    Transforms.unwrapNodes(editor, {
        match: (n) => WRAP_TYPES.find((item) => item.type === n.type),
        split: true
    });
    if (!isActive) {
        if (config) {
            Transforms.setNodes(editor, {
                type: config.childType || 'paragraph'
            });
            Transforms.wrapNodes(editor, { type: format, children: [] });
        } else {
            Transforms.setNodes(editor, {
                type: format
            });
        }
    } else {
        Transforms.setNodes(editor, {
            type: 'paragraph'
        });
    }
};

// 清楚叶子节点的样式
const clearMark = (editor) => {
    Editor.clearMark(editor, [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'superscript',
        'subscript',
        'fontSize',
        'lineHeight',
        'color',
        'backgroundColor',
        'letterSpacing'
    ]);
};

const toggleMark = (editor, format, otherFormat) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
        if (otherFormat) {
            Editor.removeMark(editor, otherFormat);
        }
    }
};

const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
        match: (n) => n.type === format
    });
    return !!match;
};

const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

const preventDefault = (e) => {
    e.preventDefault();
};

// 扩展插件-添加clearMark函数，清理叶子节点样式功能函数
const extendWithEditor = (editor) => {
    Editor.clearMark = (editor, key) => {
        editor.clearMark(key);
    }
    editor.clearMark = (key) => {
        let selection = editor.selection;
        if (selection) {
            if (Range.isExpanded(selection)) {
                editor.removeMark(key)
            } else {
                editor.marks = {};
                editor.onChange();
            }
        }
    }
    return editor;
};


// todo 粘贴后，光标的位置要重置
const handlePaste = async (editor) => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            let type = 'text/plain'
            if (clipboardItem.types.includes('text/html')) {
                type = 'text/html'
            }
            const blob = await clipboardItem.getType(type);
            const html = await blob.text()
            console.log(html, '==html==');

            const parsed = new DOMParser().parseFromString(html, 'text/html')
            console.log(parsed.body, '==html==222222');
            const fragment = deserialize(parsed.body)
            // console.log(fragment,'==html==fragment');
            Transforms.insertFragment(editor, fragment)

        }
    } catch (err) {
        // console.error(err);
    }
}

// type = copy  复制 |  cut  剪切
const handleCopyOrCut = (editor, type) => {
    const selection = editor.selection
    if (!selection) {
        return false
    }
    const { anchor, focus } = selection
    let fragment = null
    if (!!anchor && JSON.stringify(anchor) !== JSON.stringify(focus)) {
        fragment = editor.getFragment()
        console.log(fragment, '==fragment==fragment')

    }
    //  默认是点击复制按钮
    const btnId = type === 'cut' ? '#cut' : '#copy'
    const selectElements = handleSerialize(fragment)
    // 序列化 为html
    const div = document.createElement('div')
    div.id = "select"
    document.body.appendChild(div)
    const root = ReactDOM.createRoot(document.querySelector('#select'))
    root.render(<>{selectElements}</>)

    const clipboard = new ClipboardJS(`${btnId}`, {
        target: function (trigger) {
            console.log(3);
            const dom = document.querySelector('#select')
            console.log(dom, '====??===');
            return dom
        }
    });
    // console.log(2);
    clipboard.on('success', function (e) {
        // cut 
        type === 'cut' && Editor.deleteFragment(editor)


        document.body.removeChild(div)
        // 解决二次点击复制时执行2次错误问题
        clipboard.destroy()
    });

    clipboard.on('error', function (e) {
        console.log(222);
        // console.log(e, 4);
        // document.body.removeChild(p)
        clipboard.destroy()
    });


}
// 粘贴后，光标的位置不正确
const copyPaste = (editor, type) => {
    Editor.copyPaste(editor, type)
}

// 拓展editor实例 增加复制，剪切，粘贴功能函数
const withCopyPasteEditor = (editor) => {
    Editor.copyPaste = (editor, type) => {
        editor.copyPaste(type)
    }

    editor.copyPaste = (type) => {
        switch (type) {
            case 'copy':
                handleCopyOrCut(editor, 'copy');
                break;
            case 'cut':
                handleCopyOrCut(editor, 'cut');
                break;
            case 'paste':
                handlePaste(editor);
                break;
        }
    }


    return editor

}

const blockWithEditor = (editor) => {
    const { insertBreak, deleteBackward } = editor;
    editor.__BLOCKS__ = [];
    editor.deleteBackward = () => {
        const [match] = Editor.nodes(editor, {
            match: (n) => editor.__BLOCKS__.includes(n.type)
        });
        if (match) {
            let [node, blockPath] = match;
            let blockStart = Editor.start(editor, blockPath);
            let blockEnd = Editor.end(editor, blockPath);
            if (node.children.length === 1 && Point.equals(blockEnd, blockStart)) {
                let selection = editor.selection;
                if (selection) {
                    let [, selectionEnd] = Range.edges(selection);
                    if (Range.isCollapsed(editor.selection) && Point.equals(blockEnd, selectionEnd)) {
                        let { path: endPath } = Editor.end(editor, []);
                        Transforms.removeNodes(editor, {
                            select: true,
                            at: blockPath
                        });
                        if (endPath[0] === blockPath[0]) {
                            Transforms.insertNodes(editor, {
                                type: 'paragraph',
                                children: [{ text: '' }]
                            });
                        }
                        return;
                    }
                }
            }
        }
        deleteBackward();
    };
    editor.insertBreak = () => {
        const [match] = Editor.nodes(editor, {
            match: (n) => editor.__BLOCKS__.includes(n.type)
        });
        if (match) {
            let blockPath = match[1];
            let blockEnd = Editor.end(editor, blockPath);
            //最后一行是空行
            if (blockEnd.path[blockEnd.path.length - 1] === 0 && blockEnd.offset === 0) {
                let selection = editor.selection;
                if (selection) {
                    let [, selectionEnd] = Range.edges(selection);
                    if (Range.isCollapsed(editor.selection) && Point.equals(blockEnd, selectionEnd)) {
                        let path = blockEnd.path;
                        path.length--;
                        Transforms.removeNodes(editor, { at: path });
                        blockPath[blockPath.length - 1]++;
                        Transforms.insertNodes(
                            editor,
                            {
                                type: 'paragraph',
                                children: [{ text: '' }]
                            },
                            {
                                select: true,
                                at: blockPath
                            }
                        );
                        return;
                    }
                }
            }
        }
        insertBreak();
    };
    return editor;
};

export { withCopyPasteEditor, copyPaste, merge, blockWithEditor, extendWithEditor, isMarkActive, isBlockActive, toggleMark, toggleBlock, clearMark, preventDefault };
