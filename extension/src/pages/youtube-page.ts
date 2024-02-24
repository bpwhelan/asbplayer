import { VideoData } from '@project/common';

document.addEventListener(
    'asbplayer-get-synced-data',
    async () => {
        const response: VideoData = { error: '', basename: '', subtitles: [] };

        try {
            const playerContext = await fetch(window.location.href)
                .then((webResponse) => {
                    if (!webResponse.ok) {
                        throw new Error(
                            `YT Context Retrieval failed with Status ${webResponse.status}/${webResponse.statusText}...`
                        );
                    }
                    return webResponse.text();
                })
                .then((pageString) => new window.DOMParser().parseFromString(pageString, 'text/html'))
                .then((page) => {
                    const scriptElements = page.body.querySelectorAll('script');

                    for (let i = 0; i < scriptElements.length; ++i) {
                        const elm = scriptElements[i];

                        if (elm.textContent?.includes('ytInitialPlayerResponse')) {
                            const context = new Function(`${elm.textContent}; return ytInitialPlayerResponse;`)();

                            if (context) {
                                return context;
                            }
                        }
                    }

                    return undefined;
                });

            if (!playerContext) {
                throw new Error('YT Player Context not found...');
            }

            response.basename = playerContext.videoDetails?.title || document.title;
            response.subtitles = (playerContext?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []).map(
                (track: any) => {
                    return {
                        label: `${track.languageCode} - ${track.name?.simpleText ?? track.name?.runs?.[0]?.text}`,
                        language: track.languageCode.toLowerCase(),
                        url: track.baseUrl,
                        extension: 'ytxml',
                    };
                }
            );
        } catch (error) {
            if (error instanceof Error) {
                response.error = error.message;
            } else {
                response.error = String(error);
            }
        } finally {
            document.dispatchEvent(
                new CustomEvent('asbplayer-synced-data', {
                    detail: response,
                })
            );
        }
    },
    false
);
