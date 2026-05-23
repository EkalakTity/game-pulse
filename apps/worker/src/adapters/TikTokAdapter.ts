export type PublishResult = { externalPostId: string };

export class TikTokAdapter {
  // Stub: implement when TikTok Content Posting API credentials are configured
  async publish(_caption: string, _hashtags: string[], _mediaUrls: string[], _accountId: string, _accessToken: string): Promise<PublishResult> {
    throw new Error("TikTok publishing not yet implemented — add Content Posting API credentials");
  }

  async postComment(_externalPostId: string, _commentText: string, _accessToken: string): Promise<{ commentId: string }> {
    throw new Error("Comment posting not yet implemented for this platform");
  }
}
