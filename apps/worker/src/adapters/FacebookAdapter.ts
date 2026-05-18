export type PublishResult = { externalPostId: string };

export class FacebookAdapter {
  // Stub: implement when Facebook Graph API credentials are configured
  async publish(_caption: string, _hashtags: string[], _mediaUrls: string[], _pageId: string, _accessToken: string): Promise<PublishResult> {
    throw new Error("Facebook publishing not yet implemented — add Graph API credentials");
  }
}
