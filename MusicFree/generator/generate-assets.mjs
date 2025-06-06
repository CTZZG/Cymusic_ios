import fs from 'fs/promises';
import path from 'path';
import * as url from "node:url";


function toCamelCase(str) {
    // 将下划线和中划线统一替换为空格
    let camelCaseStr = str.replace(/[-_]/g, ' ');

    // 将每个单词的首字母大写，其余字母小写
    camelCaseStr = camelCaseStr.split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join('');

    return camelCaseStr;
}

// 读取所有的icon
const basePath = path.resolve(url.fileURLToPath(import.meta.url), '../../src/assets/icons')

// 读取所有的svg
const icons = await fs.readdir(basePath)

const assets = icons.map(it => ({
    componentName: toCamelCase(it.slice(0, -path.extname(it).length)) + "Icon",
    filePath: `@/assets/icons/${it}`,
    name: it.slice(0, -path.extname(it).length)
}))

let scriptTemplate = `// This file is generated by generate-assets.mjs. DO NOT MODIFY.
import {SvgProps} from 'react-native-svg';

${assets.map(asset => `import ${asset.componentName} from '${asset.filePath}';`).join('\n')}

export type IIconName = ${assets.map(asset => `'${asset.name}'`).join(' | ')};

interface IProps extends SvgProps {
    /** 图标名称 */
    name: IIconName;
    /** 图标大小 */
    size?: number;
}

const iconMap = {
${assets.map(asset => `    '${asset.name}': ${asset.componentName}`).join(',\n')}
} as const;

export default function Icon(props: IProps) {
    const {name, size} = props;
    
    const newProps = {
        ...props,
        width: props.width ?? size,
        height: props.width ?? size
    } as SvgProps;
    
    const Component = iconMap[name];
    
    return <Component {...newProps}></Component>;
}
`

const targetPath = path.resolve(url.fileURLToPath(import.meta.url), '../../src/components/base/icon.tsx');
await fs.writeFile(targetPath, scriptTemplate, 'utf8');

console.log(`Generate Succeed. ${assets.length} assets.`)