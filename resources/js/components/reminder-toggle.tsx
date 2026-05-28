import { Bell } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    getNotificationPermission,
    isPushSupported,
    isSecureContextForPush,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
} from '@/lib/push-notifications';

const csrfToken = (): string =>
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

const updateReminderSetting = async (enabled: boolean): Promise<boolean> => {
    const response = await fetch('/api/reminder-settings', {
        method: 'PATCH',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ daily_log_reminders_enabled: enabled }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            typeof data.message === 'string' ? data.message : 'Failed to update reminder settings.',
        );
    }

    return Boolean(data.daily_log_reminders_enabled);
};

type Props = {
    enabled: boolean;
    vapidPublicKey: string | null;
};

export default function ReminderToggle({ enabled: initialEnabled, vapidPublicKey }: Props) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [turningOn, setTurningOn] = useState(false);
    const [permission, setPermission] = useState(getNotificationPermission());

    const refreshPermission = () => setPermission(getNotificationPermission());

    const turnOff = async () => {
        if (!enabled) {
            return;
        }

        setEnabled(false);

        try {
            const saved = await updateReminderSetting(false);
            setEnabled(saved);
            void unsubscribeFromPush();
            toast.success('Reminders turned off.');
        } catch (toggleError) {
            setEnabled(true);
            toast.error(
                toggleError instanceof Error
                    ? toggleError.message
                    : 'Unable to turn reminders off.',
            );
        }
    };

    const turnOn = async () => {
        if (enabled || turningOn) {
            return;
        }

        if (!isPushSupported() || !isSecureContextForPush()) {
            toast.error('Push needs HTTPS (or localhost). Open the site with https:// or http://localhost.');
            return;
        }

        if (!vapidPublicKey) {
            toast.error('VAPID keys are missing. Run php artisan webpush:vapid first.');
            return;
        }

        setTurningOn(true);

        try {
            await subscribeToPush(vapidPublicKey);
            refreshPermission();
            const saved = await updateReminderSetting(true);
            setEnabled(saved);
            toast.success('Reminders turned on.');
        } catch (toggleError) {
            await unsubscribeFromPush().catch(() => undefined);
            setEnabled(false);
            refreshPermission();
            toast.error(
                toggleError instanceof Error
                    ? toggleError.message
                    : 'Unable to turn reminders on.',
            );
        } finally {
            setTurningOn(false);
        }
    };

    const handleAllowNotifications = async () => {
        try {
            const result = await requestNotificationPermission();
            refreshPermission();

            if (result === 'granted') {
                toast.success('Notifications allowed. You can turn reminders on now.');
            } else {
                toast.error('Notifications were not allowed.');
            }
        } catch (error) {
            refreshPermission();
            toast.error(error instanceof Error ? error.message : 'Could not request notifications.');
        }
    };

    const handleSwitchClick = () => {
        if (turningOn) {
            return;
        }

        if (enabled) {
            void turnOff();
            return;
        }

        void turnOn();
    };

    const notificationsBlocked = permission === 'denied';

    return (
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <div
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                title="Hourly push reminders from 6 PM to 11:59 PM if today's log isn't saved"
            >
                <Bell className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />

                <span className="hidden text-xs font-medium text-neutral-600 sm:inline dark:text-neutral-300">
                    Reminders
                </span>

                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={enabled ? 'Turn reminders off' : 'Turn reminders on'}
                    onClick={handleSwitchClick}
                    className={cn(
                        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200',
                        turningOn && 'opacity-70',
                        enabled
                            ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                            : 'border-neutral-300 bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-700',
                    )}
                >
                    <span
                        className={cn(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
                            enabled
                                ? 'translate-x-6 dark:bg-neutral-900'
                                : 'translate-x-1 dark:bg-neutral-100',
                        )}
                    />
                </button>

                <button
                    type="button"
                    onClick={handleSwitchClick}
                    className="min-w-[24px] cursor-pointer text-xs font-semibold text-neutral-600 hover:underline dark:text-neutral-300"
                >
                    {enabled ? 'On' : turningOn ? '...' : 'Off'}
                </button>
            </div>

            {notificationsBlocked ? (
                <p className="max-w-xs text-right text-xs text-rose-600 dark:text-rose-400">
                    Blocked in Firefox → lock icon → Permissions → Notifications → Allow → refresh
                </p>
            ) : permission === 'default' ? (
                <button
                    type="button"
                    onClick={() => void handleAllowNotifications()}
                    className="cursor-pointer text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                >
                    Allow notifications
                </button>
            ) : null}
        </div>
    );
}
