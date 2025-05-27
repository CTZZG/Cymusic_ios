
import pathConst from '@/store/pathConst'
import { Platform } from 'react-native'

// 动态导入MMKV以避免Web环境错误
let MMKV: any = null

if (Platform.OS !== 'web') {
    try {
        const mmkvModule = require('react-native-mmkv')
        MMKV = mmkvModule.MMKV
    } catch (error) {
        console.warn('react-native-mmkv not available:', error)
    }
}

// Web环境的简单存储实现
class WebStorage {
    private id: string
    private prefix: string

    constructor(options: { id: string; path?: string }) {
        this.id = options.id
        this.prefix = `mmkv_${this.id}_`
    }

    getString(key: string): string | undefined {
        const value = localStorage.getItem(this.prefix + key)
        return value || undefined
    }

    setString(key: string, value: string): void {
        localStorage.setItem(this.prefix + key, value)
    }

    getNumber(key: string): number | undefined {
        const value = localStorage.getItem(this.prefix + key)
        return value ? Number(value) : undefined
    }

    setNumber(key: string, value: number): void {
        localStorage.setItem(this.prefix + key, String(value))
    }

    getBoolean(key: string): boolean | undefined {
        const value = localStorage.getItem(this.prefix + key)
        return value ? value === 'true' : undefined
    }

    setBoolean(key: string, value: boolean): void {
        localStorage.setItem(this.prefix + key, String(value))
    }

    delete(key: string): void {
        localStorage.removeItem(this.prefix + key)
    }

    getAllKeys(): string[] {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length))
            }
        }
        return keys
    }

    clearAll(): void {
        const keys = this.getAllKeys()
        keys.forEach(key => this.delete(key))
    }
}

const _mmkvCache: Record<string, any> = {}

if (typeof global !== 'undefined') {
    global.mmkv = _mmkvCache
}

// Internal Method
const getOrCreateMMKV = (dbName: string, cachePath = false) => {
    if (_mmkvCache[dbName]) {
        return _mmkvCache[dbName]
    }

    let newStore: any

    if (Platform.OS === 'web') {
        // Web环境使用localStorage
        newStore = new WebStorage({
            id: dbName,
            path: cachePath ? pathConst.mmkvCachePath : pathConst.mmkvPath,
        })
    } else if (MMKV) {
        // 原生环境使用MMKV
        newStore = new MMKV({
            id: dbName,
            path: cachePath ? pathConst.mmkvCachePath : pathConst.mmkvPath,
        })
    } else {
        // 降级到内存存储
        console.warn('MMKV not available, using memory storage')
        const memoryStore = new Map<string, any>()
        newStore = {
            getString: (key: string) => memoryStore.get(key),
            setString: (key: string, value: string) => memoryStore.set(key, value),
            getNumber: (key: string) => memoryStore.get(key),
            setNumber: (key: string, value: number) => memoryStore.set(key, value),
            getBoolean: (key: string) => memoryStore.get(key),
            setBoolean: (key: string, value: boolean) => memoryStore.set(key, value),
            delete: (key: string) => memoryStore.delete(key),
            getAllKeys: () => Array.from(memoryStore.keys()),
            clearAll: () => memoryStore.clear(),
        }
    }

    _mmkvCache[dbName] = newStore
    return newStore
}

export default getOrCreateMMKV;
