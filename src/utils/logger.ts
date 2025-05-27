/**
 * 日志工具
 */

export function trace(tag: string, ...args: any[]) {
    console.log(`[TRACE] ${tag}:`, ...args);
}

export function devLog(level: 'info' | 'warn' | 'error', tag: string, ...args: any[]) {
    const prefix = `[${level.toUpperCase()}] ${tag}:`;
    
    switch (level) {
        case 'info':
            console.log(prefix, ...args);
            break;
        case 'warn':
            console.warn(prefix, ...args);
            break;
        case 'error':
            console.error(prefix, ...args);
            break;
    }
}

export function errorLog(tag: string, ...args: any[]) {
    console.error(`[ERROR] ${tag}:`, ...args);
}
