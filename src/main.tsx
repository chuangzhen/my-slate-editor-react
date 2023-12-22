import React, { useCallback, useMemo, useState, useRef } from 'react';
import Editor, { defaultPlugins } from './editor/index.jsx';
import './main.less';

const Main = () => {
    const [initialValue, setValue] = useState([
        {
            type: 'paragraph',
            children: [{ text: 'abc' }]
        }
    ]);
    const onChange = useCallback(function (val) {
        console.log('onChange', val);
        setValue(val);
    }, []);
    return <Editor initialValue={initialValue} onChange={onChange} className="" plugins={defaultPlugins} />;
};

export default Main


