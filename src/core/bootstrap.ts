import { pathConst } from '@/constants/pathConst';
import pluginManager from './pluginManager';

/**
 * 应用启动初始化函数
 * 负责创建必要的目录结构和初始化核心服务
 */
export async function bootstrap() {
    try {
        console.log('开始应用初始化...');

        // 创建必要的目录
        await createDirectories();

        // 初始化插件系统
        await initializePluginSystem();

        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
        throw error;
    }
}

/**
 * 创建应用所需的目录结构
 */
async function createDirectories() {
    const { platformFS } = await import('./pluginManager/platformAdapter');
    const directories = [
        pathConst.pluginPath,
        pathConst.musicCachePath,
        pathConst.lyricCachePath,
        pathConst.artworkCachePath,
        pathConst.configPath,
        pathConst.logPath,
        pathConst.tempPath,
        pathConst.backupPath,
    ];

    for (const dir of directories) {
        try {
            await platformFS.mkdir(dir, { NSURLIsExcludedFromBackupKey: true });
            console.log(`创建目录: ${dir}`);
        } catch (error: any) {
            // 目录已存在时会抛出错误，这是正常的
            if (!error.message.includes('already exists')) {
                console.warn(`创建目录失败: ${dir}`, error);
            }
        }
    }
}

/**
 * 初始化插件系统
 */
async function initializePluginSystem() {
    try {
        console.log('初始化插件系统...');

        // 创建测试插件
        await createTestPlugin();

        await pluginManager.setup();
        console.log('插件系统初始化完成');

        // 输出已加载的插件信息
        const plugins = pluginManager.getPlugins();
        console.log(`已加载 ${plugins.length} 个插件:`);
        plugins.forEach(plugin => {
            console.log(`- ${plugin.name} (${plugin.state})`);
        });
    } catch (error) {
        console.error('插件系统初始化失败:', error);
        // 插件系统初始化失败不应该阻止应用启动
    }
}

/**
 * 创建测试插件
 */
async function createTestPlugin() {
    const { platformFS } = await import('./pluginManager/platformAdapter');
    const testPluginPath = `${pathConst.pluginPath}/testPlugin.js`;

    // 检查测试插件是否已存在
    const pluginExists = await platformFS.exists(testPluginPath);
    if (pluginExists) {
        console.log('测试插件已存在，跳过创建');
        return;
    }

    const testPluginCode = `
// 测试插件示例
module.exports = {
    platform: "测试音源",
    version: "1.0.0",
    author: "Cymusic",

    async search(query, page, type) {
        // 模拟搜索结果
        return {
            isEnd: page > 1,
            data: [
                {
                    id: "test-1",
                    platform: "测试音源",
                    title: \`测试歌曲 - \${query}\`,
                    artist: "测试歌手",
                    album: "测试专辑",
                    duration: 180,
                    artwork: "",
                    url: ""
                }
            ]
        };
    },

    async getMediaSource(musicItem, quality) {
        // 返回测试音频URL
        return {
            url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
            headers: {}
        };
    },

    async getTopLists() {
        return [
            {
                title: "测试榜单分类",
                data: [
                    {
                        id: "test-top-1",
                        title: "测试热歌榜",
                        description: "最热门的测试歌曲",
                        coverImg: "",
                        platform: "测试音源"
                    }
                ]
            }
        ];
    },

    async getTopListDetail(topListItem, page) {
        return {
            isEnd: page > 1,
            musicList: [
                {
                    id: "test-top-song-1",
                    platform: "测试音源",
                    title: "榜单测试歌曲1",
                    artist: "测试歌手1",
                    album: "测试专辑1",
                    duration: 200,
                    artwork: "",
                    url: ""
                },
                {
                    id: "test-top-song-2",
                    platform: "测试音源",
                    title: "榜单测试歌曲2",
                    artist: "测试歌手2",
                    album: "测试专辑2",
                    duration: 220,
                    artwork: "",
                    url: ""
                }
            ]
        };
    },

    async getRecommendSheetTags() {
        return {
            pinned: [
                {
                    id: "test-sheet-1",
                    title: "精选测试歌单",
                    description: "最好听的测试歌曲合集",
                    coverImg: "",
                    platform: "测试音源"
                }
            ],
            data: [
                {
                    title: "流行",
                    data: [
                        {
                            id: "pop-1",
                            title: "流行测试",
                            description: "流行音乐测试歌单",
                            coverImg: "",
                            platform: "测试音源"
                        }
                    ]
                }
            ]
        };
    },

    async getRecommendSheetsByTag(tag, page) {
        return {
            isEnd: page > 1,
            data: [
                {
                    id: \`sheet-\${tag.id}-\${page}\`,
                    title: \`\${tag.title}歌单\${page}\`,
                    description: \`这是一个\${tag.title}类型的测试歌单\`,
                    coverImg: "",
                    platform: "测试音源",
                    playCount: 1000 + page * 100,
                    worksNums: 20 + page
                }
            ]
        };
    }
};`;

    try {
        await platformFS.writeFile(testPluginPath, testPluginCode, 'utf8');
        console.log('测试插件创建成功:', testPluginPath);
    } catch (error) {
        console.error('创建测试插件失败:', error);
    }
}

/**
 * 检查插件系统状态
 */
export function getPluginSystemStatus() {
    const plugins = pluginManager.getPlugins();
    const enabledPlugins = pluginManager.getEnabledPlugins();

    return {
        totalPlugins: plugins.length,
        enabledPlugins: enabledPlugins.length,
        plugins: plugins.map(plugin => ({
            name: plugin.name,
            state: plugin.state,
            hash: plugin.hash,
            enabled: pluginManager.isPluginEnabled(plugin),
        })),
    };
}
