/**
 * 插件系统测试
 */

import { Plugin } from './plugin';

// 创建一个测试插件
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
                    title: "测试歌曲1",
                    artist: "测试歌手",
                    platform: "测试插件"
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

export async function testPluginSystem() {
    console.log('开始测试插件系统...');

    try {
        // 测试插件创建
        const plugin = new Plugin(testPluginCode, 'test-plugin.js');
        console.log('✅ 插件创建成功:', plugin.name);

        // 测试插件方法
        const searchResult = await plugin.methods.search('测试', 1, 'music');
        console.log('✅ 搜索功能测试成功:', searchResult);

        // 测试媒体源获取
        const mediaSource = await plugin.methods.getMediaSource({
            id: 'test',
            title: '测试',
            artist: '测试',
            platform: '测试插件',
            duration: 180,
            album: '测试专辑',
            artwork: ''
        }, 'standard');
        console.log('✅ 媒体源获取测试成功:', mediaSource);

        console.log('🎉 插件系统测试完成！');
        return true;
    } catch (error) {
        console.error('❌ 插件系统测试失败:', error);
        return false;
    }
}
