type PushSubscriptionPayload = {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    contentEncoding?: string | null;
};

const csrfToken = (): string =>
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
        ?.content ?? '';

const apiFetch = (url: string, options: RequestInit = {}): Promise<Response> =>
    fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
            ...(options.headers ?? {}),
        },
        credentials: 'same-origin',
    });

const urlBase64ToUint8Array = (
    base64String: string,
): Uint8Array<ArrayBuffer> => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);

    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

const getContentEncoding = (): string => {
    if ('supportedContentEncodings' in PushManager) {
        const encodings = PushManager.supportedContentEncodings as string[];

        if (encodings.length > 0) {
            return encodings[0];
        }
    }

    return 'aes128gcm';
};

const formatPushError = (error: unknown): string => {
    if (error instanceof DOMException) {
        const message = error.message.toLowerCase();

        if (
            message.includes('retrieving push subscription') ||
            message.includes('push subscription')
        ) {
            return 'Could not connect to browser push service. Refresh the page, then turn reminders on again.';
        }

        if (
            message.includes('invalid key') ||
            message.includes('applicationserverkey')
        ) {
            return 'Push setup is invalid. Run php artisan webpush:vapid and refresh the page.';
        }

        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Unable to set up push notifications.';
};

const subscriptionToPayload = (
    subscription: PushSubscription,
): PushSubscriptionPayload => {
    const json = subscription.toJSON();

    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Invalid push subscription payload.');
    }

    return {
        endpoint: json.endpoint,
        keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
        },
        contentEncoding:
            (json as PushSubscriptionJSON & { contentEncoding?: string })
                .contentEncoding ?? getContentEncoding(),
    };
};

const waitForActiveWorker = async (
    registration: ServiceWorkerRegistration,
): Promise<void> => {
    if (registration.active) {
        return;
    }

    const worker = registration.installing ?? registration.waiting;

    if (!worker) {
        await navigator.serviceWorker.ready;

        return;
    }

    if (worker.state === 'activated') {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            reject(
                new Error(
                    'Service worker timed out. Refresh the page and try again.',
                ),
            );
        }, 15000);

        worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
                window.clearTimeout(timeout);
                resolve();
            }
        });
    });
};

export const isPushSupported = (): boolean =>
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

export const isSecureContextForPush = (): boolean => {
    if (window.isSecureContext) {
        return true;
    }

    const host = window.location.hostname;

    return host === 'localhost' || host === '127.0.0.1';
};

export const getNotificationPermission = (): NotificationPermission => {
    if (!('Notification' in window)) {
        return 'denied';
    }

    return Notification.permission;
};

export const requestNotificationPermission =
    async (): Promise<NotificationPermission> => {
        if (!('Notification' in window)) {
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            throw new Error(
                'Notifications are blocked. Click the lock icon in the address bar → Site settings → Notifications → Allow, then refresh.',
            );
        }

        return Notification.requestPermission();
    };

export const getServiceWorkerRegistration =
    async (): Promise<ServiceWorkerRegistration> => {
        let registration = await navigator.serviceWorker.getRegistration('/');

        if (!registration) {
            registration = await navigator.serviceWorker.register(
                '/push-sw.js',
                {
                    scope: '/',
                    updateViaCache: 'none',
                },
            );
        }

        await registration.update();
        await waitForActiveWorker(registration);
        await navigator.serviceWorker.ready;

        if (!registration.active) {
            throw new Error(
                'Service worker is not active. Refresh the page and try again.',
            );
        }

        if (!registration.pushManager) {
            throw new Error(
                'Push manager is unavailable for this service worker.',
            );
        }

        return registration;
    };

const getPushSubscription = async (
    registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> => {
    try {
        return await registration.pushManager.getSubscription();
    } catch {
        return null;
    }
};

const saveSubscriptionToServer = async (
    subscription: PushSubscription,
): Promise<void> => {
    const response = await apiFetch('/api/push-subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionToPayload(subscription)),
    });

    if (!response.ok) {
        throw new Error('Failed to save push subscription.');
    }
};

export const subscribeToPush = async (
    vapidPublicKey: string,
): Promise<PushSubscription> => {
    if (!isPushSupported()) {
        throw new Error(
            'Push notifications are not supported in this browser.',
        );
    }

    if (!isSecureContextForPush()) {
        throw new Error(
            'Push needs HTTPS (or localhost). Open the site with https:// or http://localhost.',
        );
    }

    if (!vapidPublicKey) {
        throw new Error('Push notifications are not configured yet.');
    }

    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
        throw new Error('Notification permission was denied.');
    }

    try {
        const registration = await getServiceWorkerRegistration();
        const existing = await getPushSubscription(registration);

        if (existing) {
            try {
                await saveSubscriptionToServer(existing);

                return existing;
            } catch {
                try {
                    await existing.unsubscribe();
                } catch {
                    // Continue and create a fresh subscription below.
                }
            }
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await saveSubscriptionToServer(subscription);

        return subscription;
    } catch (error) {
        throw new Error(formatPushError(error));
    }
};

export const unsubscribeFromPush = async (): Promise<void> => {
    if (!isPushSupported()) {
        return;
    }

    const registration = await navigator.serviceWorker.getRegistration('/');

    if (!registration?.pushManager) {
        return;
    }

    const subscription = await getPushSubscription(registration);

    if (!subscription) {
        return;
    }

    try {
        await apiFetch('/api/push-subscriptions', {
            method: 'DELETE',
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
    } catch {
        // Still try to unsubscribe locally even if the API call fails.
    }

    try {
        await subscription.unsubscribe();
    } catch {
        // Ignore — reminders are already disabled server-side.
    }
};
