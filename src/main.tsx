import React, { useCallback, useMemo, useState, useRef } from 'react';
import Editor, { defaultPlugins } from './editor/index.jsx';
import './main.less';

const Main = () => {
    const [value, setValue] = useState([
        {
            type: 'paragraph',
            children: [{ text: 'abc' }]
        }
    ]);
    const onChange = useCallback(function (val) {
        console.log('onChange', val);
        setValue(val);
    }, []);
    return <Editor value={value} onChange={onChange} className="" plugins={defaultPlugins} />;
};

export default Main


