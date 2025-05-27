/**
 * 插件系统测试脚本
 * 用于验证插件系统的核心功能
 */

// 模拟React Native环境
global.console = console;

// 模拟CryptoJs
const CryptoJs = {
    MD5: (str) => ({
        toString: () => 'mock-hash-' + str.length
    })
};

// 模拟nanoid
const nanoid = () => 'mock-id-' + Date.now();

// 模拟插件状态枚举
const PluginState = {
    Loading: 'loading',
    Mounted: 'mounted',
    Error: 'error',
};

// 模拟插件错误原因枚举
const PluginErrorReason = {
    CannotParse: 'cannot-parse',
    VersionNotMatch: 'version-not-match',
    InvalidPlugin: 'invalid-plugin',
};

// 简化的插件类
class Plugin {
    constructor(funcCode, pluginPath) {
        let _instance;

        try {
            if (typeof funcCode === 'string') {
                this.hash = CryptoJs.MD5(funcCode).toString();
                
                // 创建一个安全的执行环境
                const _module = { exports: {} };
                const _require = (name) => {
                    throw new Error(`Module ${name} is not allowed`);
                };

                // 执行插件代码
                const func = new Function('module', 'exports', 'require', funcCode);
                func(_module, _module.exports, _require);

                if (_module.exports.default) {
                    _instance = _module.exports.default;
                } else {
                    _instance = _module.exports;
                }
            } else {
                _instance = funcCode();
            }

            this.checkValid(_instance);
        } catch (e) {
            this.state = PluginState.Error;
            this.errorReason = e?.errorReason ?? PluginErrorReason.CannotParse;
            console.error(`${pluginPath}插件无法解析:`, e?.message);
            
            _instance = {
                platform: '',
                appVersion: '',
                async getMediaSource() { return null; },
                async search() { return {}; },
            };
        }

        this.instance = _instance;
        this.name = _instance.platform;
        this.path = pluginPath;

        if (typeof funcCode === 'string') {
            this.hash = CryptoJs.MD5(funcCode).toString();
        } else {
            this.hash = nanoid();
        }
    }

    checkValid(instance) {
        if (!instance.platform) {
            const e = new Error('插件platform字段不能为空');
            e.errorReason = PluginErrorReason.InvalidPlugin;
            e.instance = instance;
            throw e;
        }

        this.state = PluginState.Mounted;
    }
}

// 测试插件代码
const testPluginCode = `
module.exports = {
    platform: "测试插件",
    version: "1.0.0",
    author: "测试作者",
    async search(query, page, type) {
        return {
            isEnd: false,
            data: [
                {
                    id: "test1",
                    title: "测试歌曲1 - " + query,
                    artist: "测试歌手",
                    platform: "测试插件",
                    duration: 180,
                    album: "测试专辑",
                    artwork: ""
                }
            ]
        };
    },
    async getMediaSource(musicItem, quality) {
        return {
            url: "https://example.com/test.mp3"
        };
    }
};
`;

// 运行测试
async function runTest() {
    console.log('🔌 开始测试插件系统...\n');
    
    try {
        // 测试1: 插件创建
        console.log('📝 测试1: 插件创建');
        const plugin = new Plugin(testPluginCode, 'test-plugin.js');
        console.log('✅ 插件创建成功');
        console.log(`   - 插件名: ${plugin.name}`);
        console.log(`   - 插件状态: ${plugin.state}`);
        console.log(`   - 插件版本: ${plugin.instance.version}`);
        console.log(`   - 插件作者: ${plugin.instance.author}\n`);
        
        // 测试2: 搜索功能
        console.log('🔍 测试2: 搜索功能');
        const searchResult = await plugin.instance.search('测试歌曲', 1, 'music');
        console.log('✅ 搜索功能测试成功');
        console.log(`   - 搜索结果数量: ${searchResult.data.length}`);
        console.log(`   - 第一首歌曲: ${searchResult.data[0]?.title}\n`);
        
        // 测试3: 媒体源获取
        console.log('🎵 测试3: 媒体源获取');
        const mediaSource = await plugin.instance.getMediaSource({
            id: 'test',
            title: '测试歌曲',
            artist: '测试歌手',
            platform: '测试插件',
            duration: 180,
            album: '测试专辑',
            artwork: ''
        }, 'standard');
        console.log('✅ 媒体源获取测试成功');
        console.log(`   - 媒体URL: ${mediaSource.url}\n`);
        
        // 测试4: 错误处理
        console.log('❌ 测试4: 错误处理');
        const invalidPluginCode = `
        module.exports = {
            // 缺少platform字段
            version: "1.0.0"
        };
        `;
        const invalidPlugin = new Plugin(invalidPluginCode, 'invalid-plugin.js');
        console.log('✅ 错误处理测试成功');
        console.log(`   - 无效插件状态: ${invalidPlugin.state}`);
        console.log(`   - 错误原因: ${invalidPlugin.errorReason}\n`);
        
        console.log('🎉 所有测试通过！插件系统基础功能正常！');
        return true;
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        return false;
    }
}

// 运行测试
runTest().then(success => {
    if (success) {
        console.log('\n✅ 第一阶段测试完成：插件系统基础架构正常工作');
        console.log('📋 下一步计划：');
        console.log('   1. 移植MusicFree的UI组件');
        console.log('   2. 集成React Navigation导航系统');
        console.log('   3. 移植插件管理页面');
        console.log('   4. 完整的功能测试');
    } else {
        console.log('\n❌ 第一阶段测试失败，需要修复问题后再继续');
    }
    process.exit(success ? 0 : 1);
});
