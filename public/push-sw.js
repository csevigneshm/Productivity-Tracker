self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

const dashboardLogUrl = () => `${self.location.origin}/dashboard?log=1`;

const absoluteIcon = () => `${self.location.origin}/favicon.ico`;

const buildOptions = (payload) => ({
    body: payload.body || "You haven't updated today's productivity log yet.",
    icon: payload.icon ? new URL(payload.icon, self.location.origin).href : absoluteIcon(),
    tag: payload.tag || 'daily-log-reminder',
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: payload.data || { url: dashboardLogUrl() },
});

self.addEventListener('push', (event) => {
    const fallback = {
        title: 'Daily log reminder',
        body: "You haven't updated today's productivity log yet.",
        tag: 'daily-log-reminder',
        data: { url: dashboardLogUrl() },
    };

    const show = (payload) => {
        const title = payload.title || fallback.title;
        return self.registration.showNotification(title, buildOptions({ ...fallback, ...payload }));
    };

    if (!event.data) {
        event.waitUntil(show(fallback));
        return;
    }

    event.waitUntil(
        event.data
            .json()
            .then((payload) => show(payload))
            .catch(() => show({ ...fallback, body: event.data.text() || fallback.body })),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetPath = event.notification.data?.url || dashboardLogUrl();
    const absoluteUrl = new URL(targetPath, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin)) {
                    client.postMessage({ type: 'open-daily-log' });

                    if ('focus' in client) {
                        return client.focus();
                    }
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(absoluteUrl);
            }

            return undefined;
        }),
    );
});
