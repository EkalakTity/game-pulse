import axios from "axios";

export type PublishResult = { externalPostId: string };

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

export class FacebookAdapter {
  async publish(
    caption: string,
    hashtags: string[],
    mediaUrls: string[],
    pageId: string,
    accessToken: string,
  ): Promise<PublishResult> {
    const hashtagText = hashtags
      .map(h => (h.startsWith("#") ? h : `#${h}`))
      .join(" ");
    const message = [caption, hashtagText].filter(Boolean).join("\n\n");

    let postId: string;

    if (mediaUrls.length === 0) {
      const res = await axios.post(`${GRAPH_BASE}/${pageId}/feed`, null, {
        params: { message, access_token: accessToken },
      });
      postId = res.data.id;
    } else if (mediaUrls.length === 1) {
      const res = await axios.post(`${GRAPH_BASE}/${pageId}/photos`, null, {
        params: { url: mediaUrls[0], caption: message, access_token: accessToken },
      });
      postId = res.data.post_id ?? res.data.id;
    } else {
      const photoIds = await Promise.all(
        mediaUrls.map(url =>
          axios
            .post(`${GRAPH_BASE}/${pageId}/photos`, null, {
              params: { url, published: false, access_token: accessToken },
            })
            .then(r => r.data.id as string),
        ),
      );
      const res = await axios.post(`${GRAPH_BASE}/${pageId}/feed`, null, {
        params: {
          message,
          attached_media: JSON.stringify(photoIds.map(id => ({ media_fbid: id }))),
          access_token: accessToken,
        },
      });
      postId = res.data.id;
    }

    return { externalPostId: postId };
  }
}
