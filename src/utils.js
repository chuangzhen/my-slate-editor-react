import { jsx } from 'slate-hyperscript'
import { Transforms } from 'slate'
import { Element, Leaf, defaultPlugins } from './editor'
import pluginMap from './components/plugins/index.js';
import { merge } from './editor/common'

//  元素标签展示状态
const ELEMENT_TAGS = {
    A: el => ({ type: 'link', url: el.getAttribute('href') }),
    BLOCKQUOTE: () => ({ type: 'quote' }),
    H1: () => ({ type: 'heading-one' }),
    H2: () => ({ type: 'heading-two' }),
    H3: () => ({ type: 'heading-three' }),
    H4: () => ({ type: 'heading-four' }),
    H5: () => ({ type: 'heading-five' }),
    H6: () => ({ type: 'heading-six' }),
    IMG: el => ({ type: 'image', url: el.getAttribute('src') }),
    LI: () => ({ type: 'list-item' }),
    OL: () => ({ type: 'numbered-list' }),
    P: () => ({ type: 'paragraph' }),
    PRE: () => ({ type: 'code' }),
    UL: () => ({ type: 'bulleted-list' }),
}

// COMPAT: `B` is omitted here because Google Docs uses `<b>` in weird ways.
// 叶子元素标签标识状态
const TEXT_TAGS = {
    CODE: () => ({ code: true }),
    I: () => ({ italic: true }),
    DEL: () => ({ strikethrough: true }),
    U: () => ({ underline: true }),
    S: () => ({ strikethrough: true }),
    STRIKE: () => ({ strikethrough: true }),
    B: () => ({ bold: true }),
    STRONG: () => ({ bold: true }),
    SUP: () => ({ superscript: true }),
    SUB: () => ({ subscript: true })
}
// 字符粗中 - 后接的第一个字母转成大写
const SPECIAL_CHARS_REGEXP = /([\-]+(.))/g
const camelCase = function (name) {
    return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
        return offset ? letter.toUpperCase() : letter
    })
}


export const deserialize = (el, styleObj = {}) => {
    // debugger
    let styles = { ...styleObj }
    if (el.nodeType === 3) {
        return el.textContent
    } else if (el.nodeType !== 1) {
        return null
    } else if (el.nodeName === 'BR') {
        // console.log(JSON.stringify(el, '==99=='))
        return '\n'
    }
    const { nodeName, attributes } = el
    let parent = el
    // console.log(el, '---el---');
    // todo 
    /**
     *  需要兼容的样式有 
     * 中划线 下划线
     * text-decoration =>  line-through | underline
     * 
     * 斜体
     * font-style:italic   italic
     * 
     * 字重
     * font-weight:bold    bold
     * 
     * 字体 需要反转义\"
     * font-family 
     * 
     * 背景色
     * background-color
     * 
     * 字体颜色
     * color
     * 
     * 字号
     * font-size
     * 
     * 行高
     * line-height
     * 
     * 对齐 缩进 都不用识别
    //  * 对齐
    //  * text-align : right | left |  center
    //  * direction : rtl  | ltr
    //  * 缩进-增加|减少   一次40px, 搭配对齐方式 决定
    //  * 对齐是 rtl =>  缩进 margin-right  |   对齐是 ltr => 缩进是 margin-left
     */

    if (attributes.length > 0 && !!attributes?.style?.value) {
        // const leafElement = ['text-decoration', 'font-style', 'font-weight', ] ...leafElement, 'superscript', 'subscript',
        const filterStyleKey = ['font-family', 'font-size', 'line-height', 'color', 'background-color']

        styles = Object.fromEntries(`${attributes?.style.value}`.split(';').filter(Boolean).map(i => `${i}`.trim().split(':')).filter(j => filterStyleKey.includes(j[0])).map(k => [camelCase(k[0]), k[1]]))
        console.log(styles, '==styles==');
        // leafElement.forEach(i => {
        //     const key = camelCase(i)
        //     if (styles?.[key]) {
        //         switch (key) {
        //             case 'textDecoration':
        //                 styles?.[key].includes('underline') && (styles.underline = true)
        //                 styles?.[key].includes('line-through') && (styles.strikethrough = true)
        //                 break;
        //             case 'fontStyle':
        //                 styles?.[key].includes('italic') && (styles.italic = true)

        //                 break;
        //             case 'fontWeight':
        //                 styles?.[key].includes('bold') && (styles.bold = true)

        //                 break;
                   
        //         }
        //     }
        // });
        // console.log(styles, '---styles---');
    }
    if (
        nodeName === 'PRE' &&
        el.childNodes[0] &&
        el.childNodes[0].nodeName === 'CODE'
    ) {
        parent = el.childNodes[0]
    }
    let children = Array.from(parent.childNodes).map((i) => deserialize(i, styles)).flat()

    if (children.length === 0) {
        children = [{ text: '', name: "cz" }]
    }
    // console.log(children, '---children--');

    if (el.nodeName === 'BODY') {
        // console.log(jsx('fragment', {}, children), '---BODY---')
        return jsx('fragment', {}, children)
    }

    if (ELEMENT_TAGS[nodeName]) {
        const attrs = ELEMENT_TAGS[nodeName](el)
        // console.log(jsx('element', attrs, children), '---Element_tags---', nodeName, attrs, children);
        return jsx('element', attrs, children)
    }

    if (TEXT_TAGS[nodeName]) {
        const attrs = TEXT_TAGS[nodeName](el)
        console.log(children.map(child => jsx('text', attrs, child)), '---text_tags---');
        return children.map(child => jsx('text', attrs, child))
    }
    // console.log(children, '===11==')
    let newChildren = children.map(i => (i instanceof Object ? { ...i, ...styles } : { text: i, ...styles }))
    console.log(newChildren, '===22==')
    return newChildren
}
export const handleSerialize = (fragment) => {

    return fragment.map(({ children, ...others }) => {
        let childLeaf = children.map((item) => {
            return <Leaf children={item.text} leaf={item} attributes={{ 'data-slate-leaf': true }} plugins={getPlugins(defaultPlugins, pluginMap)} />
        })

        return <Element children={childLeaf} element={{ ...others }}
            attributes={
                {
                    'data-slate-node': "element",
                    'ref': null
                }
            } plugins={getPlugins(defaultPlugins, pluginMap)} />
    })


}

// 获取菜单插件列表
export const getPlugins = (_plugins, pluginMap) => {
    return _plugins.map((item) => {
        if (typeof item === 'string') {
            return pluginMap[item] || item;
        } else if (pluginMap[item.key]) {
            return merge(pluginMap[item.key], item);
        } else {
            return;
        }
    });
}

export const withHtml = editor => {
    const { insertData, isInline, isVoid } = editor

    editor.isInline = element => {
        return element.type === 'link' ? true : isInline(element)
    }

    editor.isVoid = element => {
        return element.type === 'image' ? true : isVoid(element)
    }

    editor.insertData = data => {
        // console.log(data, '==data==')
        let html = data.getData('text/html')
        html = html.split('<!--StartFragment-->').join('').split('<!--EndFragment-->').join()
        console.log(html, '==html==')

        if (html) {

            const parsed = new DOMParser().parseFromString(html, 'text/html')
            console.log(parsed.body, '==parsed.body==')
            const fragment = deserialize(parsed.body)
            console.log(fragment, '==fragment==withHtml==');
            Transforms.insertFragment(editor, fragment)
            return
        }

        insertData(data)
    }

    return editor
}