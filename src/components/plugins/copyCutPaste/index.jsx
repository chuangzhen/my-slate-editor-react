import React from 'react';
import { useSlate, Slate } from 'slate-react';
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

                    <i className="bfi-paste"></i>
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
                        copyPaste(editor, 'copy')
                    }}>
                    <i className="bfi-copy"></i>
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
                        copyPaste(editor, 'cut')
                    }}>
                    <i>
                        <svg t="1703231241367" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1199" width="20" height="30"><path d="M630.24 618.56L232.224 158.56a42.4 42.4 0 0 1 4.8-60.224 43.712 43.712 0 0 1 61.152 4.896l401.92 464.48c74.016-31.2 162.368-12.576 216.32 51.744 66.432 79.136 55.648 197.504-24.064 264.384-79.68 66.88-198.144 56.96-264.544-22.208-59.84-71.296-56.992-174.432 2.432-243.072z m60.256 27.2a124.064 124.064 0 0 0-43.968 94.784c0 68.864 56.224 124.704 125.6 124.704 69.344 0 125.568-55.84 125.568-124.704 0-68.864-56.224-124.704-125.568-124.704-22.752 0-44.096 6.016-62.496 16.512a42.688 42.688 0 0 1-5.6 5.696c-4.16 3.456-8.736 6.016-13.536 7.744z m-226.048-78.88l-57.344 66.272a44.48 44.48 0 0 1-1.12 1.216c47.232 67.936 45.568 161.28-9.824 227.264-66.4 79.136-184.864 89.088-264.544 22.208-79.712-66.88-90.496-185.28-24.096-264.384 58.496-69.728 157.408-85.76 234.592-42.816l57.792-66.784a128.48 128.48 0 0 0 64.544 57.024z m158.4-183.04a128.448 128.448 0 0 0-65.728-55.68l194.656-224.96a43.712 43.712 0 0 1 61.152-4.864 42.4 42.4 0 0 1 4.8 60.224l-194.88 225.28zM171.648 836.064c53.12 44.576 132.096 37.952 176.352-14.784 44.288-52.768 37.12-131.68-16.032-176.256-53.12-44.576-132.096-37.952-176.384 14.784-44.256 52.768-37.056 131.68 16.064 176.256z" fill="#333333" p-id="1200"></path></svg>

                    </i>
                </button>
            </>
        );
    })
};
