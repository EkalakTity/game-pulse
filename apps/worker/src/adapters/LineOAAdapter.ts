export type PublishResult = { externalPostId: string };

export class LineOAAdapter {
  // Stub: implement when LINE Messaging API credentials are configured
  async publish(_caption: string, _hashtags: string[], _mediaUrls: string[], _channelId: string, _accessToken: string): Promise<PublishResult> {
    throw new Error("LINE OA publishing not yet implemented — add Messaging API credentials");
  }

  async postComment(_externalPostId: string, _commentText: string, _accessToken: string): Promise<{ commentId: string }> {
    throw new Error("Comment posting not yet implemented for this platform");
  }
}
