/**
 * 文件工具函数
 */

export function getFileName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    // 移除文件扩展名
    return fileName.replace(/\.[^/.]+$/, '');
}

export function addFileScheme(path: string): string {
    if (path.startsWith('file://')) {
        return path;
    }
    return `file://${path}`;
}

export function removeFileScheme(path: string): string {
    if (path.startsWith('file://')) {
        return path.substring(7);
    }
    return path;
}
