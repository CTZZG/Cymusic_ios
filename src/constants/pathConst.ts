import { DocumentDirectoryPath } from 'react-native-fs';

/**
 * 路径常量定义
 * 定义应用中使用的各种文件路径
 */
export const pathConst = {
    /** 应用根目录 */
    appPath: DocumentDirectoryPath,
    
    /** 插件目录 */
    pluginPath: `${DocumentDirectoryPath}/plugins`,
    
    /** 音乐缓存目录 */
    musicCachePath: `${DocumentDirectoryPath}/music-cache`,
    
    /** 歌词缓存目录 */
    lyricCachePath: `${DocumentDirectoryPath}/lyric-cache`,
    
    /** 封面缓存目录 */
    artworkCachePath: `${DocumentDirectoryPath}/artwork-cache`,
    
    /** 配置文件目录 */
    configPath: `${DocumentDirectoryPath}/config`,
    
    /** 日志文件目录 */
    logPath: `${DocumentDirectoryPath}/logs`,
    
    /** 临时文件目录 */
    tempPath: `${DocumentDirectoryPath}/temp`,
    
    /** 备份目录 */
    backupPath: `${DocumentDirectoryPath}/backup`,
};
