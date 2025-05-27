declare namespace IMedia {
    /** 评论信息 */
    export interface IComment {
        id: string;
        userName: string;
        userAvatar?: string;
        content: string;
        time?: string;
        likeCount?: number;
        replyCount?: number;
        replies?: IComment[];
    }
}
