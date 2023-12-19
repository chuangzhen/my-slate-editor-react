import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Editable, withReact, useSlate, Slate } from 'slate-react';
import { withCopyPasteEditor, copyPaste } from '../../../editor/common';

export default {
    config: {
        title: {
            paste: '粘贴',
            copy: '复制',
            cut: '剪切'
        }
    },
    withEditor: (editor) => {
        return withCopyPasteEditor(editor);
    },
    ToolbarButton: React.memo(({ config }) => {
        const editor = useSlate();
        const history = editor.history;
        return (
            <>
                <button
                    type="button"
                    key="paste"
                    // todo 判断剪切板是否有东西
                    disabled={false}
                    data-title={config.title.paste}
                    className="slate-toolbar-item"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        copyPaste(editor, 'paste');

                    }}>
                        {/* className="bfi-undo" */}
                    <i >paste</i>
                </button>
                <button
                    type="button"
                    key="copy"
                    id="copy"
                    // disabled={history.redos.length === 0}
                    data-title={config.title.copy}
                    className="slate-toolbar-item"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        copyPaste(editor,'copy')
                    }}>
                    <i >copy</i>
                </button>
                <button
                    type="button"
                    key="cut"
                    id="cut"
                    // disabled={history.redos.length === 0}
                    data-title={config.title.cut}
                    className="slate-toolbar-item"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        copyPaste(editor,'cut')
                    }}>
                    <i >cut</i>
                </button>
            </>
        );
    })
};
