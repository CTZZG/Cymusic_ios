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
                    title: `测试歌曲 - ${query}`,
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
                    id: `sheet-${tag.id}-${page}`,
                    title: `${tag.title}歌单${page}`,
                    description: `这是一个${tag.title}类型的测试歌单`,
                    coverImg: "",
                    platform: "测试音源",
                    playCount: 1000 + page * 100,
                    worksNums: 20 + page
                }
            ]
        };
    }
};
