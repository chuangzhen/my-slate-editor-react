import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Editable, withReact, useSlate, Slate, useSelected, useFocused } from 'slate-react';
import { createEditor, Transforms, Text, Editor } from 'slate';
// import merge from 'merge-deep';
import classnames from 'classnames';
import Toolbar from '../components/toolbar/index.jsx';
import pluginMap from '../components/plugins/index.js';
import { blockWithEditor, extendWithEditor } from './common.js';
import '../css/slate-editor.less';
import { withHtml, getPlugins } from '../utils'



const SlateEditor = ({ className: _className, initialValue, onChange, plugins: _plugins }) => {
    const plugins = useMemo(() => {
        return getPlugins(_plugins, pluginMap)
    }, [_plugins]);

    const renderElement = useCallback((props) => <Element {...props} plugins={plugins} />, []);
    const renderLeaf = useCallback((props) => <Leaf {...props} plugins={plugins} />, []);
    const [className, setClassName] = useState('');
    const editor = useMemo(() => {
        let editor = withHtml(extendWithEditor(blockWithEditor(withReact(createEditor()))));
        plugins.forEach(item => {
            if (item.withEditor) {
                editor = item.withEditor(editor);
            }
        });
        let _className = className;
        Object.defineProperty(editor, 'className', {
            get() {
                return _className;
            },
            set: function (value) {
                _className = value;
                setClassName(value);
            }
        });
        return editor;
    }, []);
    const containerNode = useRef(null);
    const getContainerNode = useCallback(() => containerNode.current);

    return (
        <div className={classnames('slate-container', _className, className)} ref={containerNode}>
            <Slate
                editor={editor}
                initialValue={initialValue}
                onChange={onChange}
            >
                <Toolbar getContainerNode={getContainerNode} plugins={plugins} />
                <Editable
                    className="slate-content"
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="Enter some rich text…"
                    spellCheck={false}
                    autoFocus
                    onCompositionEnd={(e) => {
                        console.log(1);
                        Transforms.setNodes(
                            editor,
                            {
                                key: +new Date()
                            },
                            { match: Text.isText }
                        );
                    }}
                />
            </Slate>
        </div>
    );
};


const defaultPlugins = [
    'copyCutPaste',
    'history',
    'line',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'line',
    'textColor',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'line',
    'superscript',
    'subscript',
    'format-clear',
    'line',
    'indent',
    'align',
    'line',
    'headings',
    'bulleted-list',
    'numbered-list',
    'block-quote',
    'block-code',
    'line',
    'linkEditor',
    'hr',
    'clear-all',
    'line',
    'fullscreen'
];
// SlateEditor.plugins  = defaultPlugins


const Element = (props) => {
    let { attributes, children, element, plugins } = props;
    // console.log(props, '==plugins==');
    attributes.style = attributes.style || {};
    let res, item;
    for (var i = 0, len = plugins.length; i < len; i++) {
        item = plugins[i];
        if (item.processElement) {
            res = item.processElement({ attributes, children, element });
            if (res) {
                return res;
            }
        }
    }
    return <div {...attributes}>{children}</div>;
};

const Leaf = React.memo((props) => {
    let { attributes: attr, children, leaf, plugins } = props;
    console.log(props, '==leaf==');
    const style = {};
    const attributes = { ...attr }
    plugins.forEach((item) => {
        if (item.processLeaf) {
            let res = item.processLeaf({ attributes, children, leaf, style });
            if (res) {
                children = res
            }
        }
    });
    if (leaf.key) {
        attributes.key = leaf.key;
    }
    console.log(attributes, '==leaf==attributes')
    return (
        <span {...attributes} style={style}>
            {children}
        </span>
    );
});

export default SlateEditor;
export { defaultPlugins, Element, Leaf };
