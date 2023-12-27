import React, { useRef, useState } from 'react';
import DropDown from '../../common/dropDown';
import { useSlate } from 'slate-react';
import { Editor, Element, Transforms, createEditor, Range } from 'slate';
import { preventDefault, toggleBlock } from '../../../editor/common.js';
import { withTable, RenderTable, RenderTableCell, RenderTableRow } from './Table'
import './style.less';

import { tableData } from "./utils/tableData";
import withCustom from './utils/withCustom';

interface TableProps {
    config: {
        title: string
    }
}

const Table = React.memo(({ config }: TableProps) => {
    const editor = useSlate();
    const [active, setActive] = useState(false);

    const isInTable = () => {
        const [tableNode] = Editor.nodes(editor, {
            match: (n) =>
                !Editor.isEditor(n) && Element.isElement(n) && n.type === "table",
            mode: "highest",
        });
        return !!tableNode;
    };
    const handleAddTable = () => {
        if (isInTable()) return;
        Transforms.insertNodes(editor, tableData);
    };
    return (
        <DropDown
            key={'table'}
            caption={'表格111'}
            title={config.title}
            // arrowActive={true}
            className="slate-toolbar-item slate-toolbar-tables"
            active={active}
            onActiveChange={setActive}

        >
            <>
                <div>动态选表格的</div>
                <button
                    className="slate-toolbar"
                    disabled={isInTable()}
                    onClick={handleAddTable}>
                    添加表格
                </button>
            </>
        </DropDown>
    );
});

export default {
    config: {
        title: '表格',
    },
    withEditor: (editor) => {
        return withCustom(withTable(editor))
    },
    ToolbarButton: Table,
    processElement: ({ attributes, children, element }) => {
        const elementProp = {
            attributes, children, element
        }
        switch (element.type) {
            case 'table':
                return <RenderTable {...elementProp} />;
            case 'tableRow':
                return <RenderTableRow {...elementProp} />;
            case 'tableCell':
                return <RenderTableCell {...elementProp} />;
            // default:
            //     return React.createElement('p', attributes, children);
        }
    }
};
