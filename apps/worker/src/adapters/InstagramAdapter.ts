export type PublishResult = { externalPostId: string };

export class InstagramAdapter {
  // Stub: implement when Instagram Graph API credentials are configured
  async publish(_caption: string, _hashtags: string[], _mediaUrls: string[], _accountId: string, _accessToken: string): Promise<PublishResult> {
    throw new Error("Instagram publishing not yet implemented — add Graph API credentials");
  }

  async postComment(_externalPostId: string, _commentText: string, _accessToken: string): Promise<{ commentId: string }> {
    throw new Error("Comment posting not yet implemented for this platform");
  }
}
