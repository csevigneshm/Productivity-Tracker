self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

const absoluteIcon = () => `${self.location.origin}/favicon.ico`;

const buildOptions = (payload) => ({
    body: payload.body || "You haven't updated today's productivity log yet.",
    icon: payload.icon ? new URL(payload.icon, self.location.origin).href : absoluteIcon(),
    tag: payload.tag || 'daily-log-reminder',
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: payload.data || { url: `${self.location.origin}/dashboard` },
});

self.addEventListener('message', (event) => {
    if (event.data?.type !== 'show-test-notification') {
        return;
    }

    const title = event.data.title || 'Test reminder';
    const options = buildOptions({
        body: event.data.body || 'This is a test push. Your reminders are working!',
        tag: 'daily-log-reminder-test',
        data: { url: `${self.location.origin}/dashboard` },
    });

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('push', (event) => {
    const fallback = {
        title: 'Daily log reminder',
        body: "You haven't updated today's productivity log yet.",
        tag: 'daily-log-reminder',
        data: { url: `${self.location.origin}/dashboard` },
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

    const targetPath = event.notification.data?.url || '/dashboard';
    const absoluteUrl = new URL(targetPath, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(absoluteUrl);
            }

            return undefined;
        }),
    );
});
