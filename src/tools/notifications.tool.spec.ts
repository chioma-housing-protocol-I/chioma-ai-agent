import {
  GetNotificationsTool,
  DismissNotificationTool,
  SetNotificationPreferencesTool,
} from './notifications.tool';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

describe('notifications tools', () => {
  const context = { accessToken: 'tok' };

  function makeClient() {
    const getNotifications = jest.fn<
      ReturnType<ChiomaApiClient['getNotifications']>,
      Parameters<ChiomaApiClient['getNotifications']>
    >();
    const dismissNotification = jest.fn<
      ReturnType<ChiomaApiClient['dismissNotification']>,
      Parameters<ChiomaApiClient['dismissNotification']>
    >();
    const setNotificationPreferences = jest.fn<
      ReturnType<ChiomaApiClient['setNotificationPreferences']>,
      Parameters<ChiomaApiClient['setNotificationPreferences']>
    >();
    const client = {
      getNotifications,
      dismissNotification,
      setNotificationPreferences,
    } as unknown as ChiomaApiClient;
    return { client, getNotifications, dismissNotification, setNotificationPreferences };
  }

  describe('GetNotificationsTool', () => {
    it('returns all notifications with default filters', async () => {
      const { client, getNotifications } = makeClient();
      getNotifications.mockResolvedValue([
        {
          notificationId: 'notif_1',
          type: 'rent_due',
          message: 'Rent due in 3 days',
          urgency: 'urgent',
          dueDate: '2026-07-22',
        },
      ]);
      const tool = new GetNotificationsTool(client);

      const result = await tool.execute({}, context);

      expect(getNotifications).toHaveBeenCalledWith('tok', 'all', 'all');
      expect(JSON.parse(result)).toEqual([
        {
          notificationId: 'notif_1',
          type: 'rent_due',
          message: 'Rent due in 3 days',
          urgency: 'urgent',
          dueDate: '2026-07-22',
        },
      ]);
    });

    it('filters notifications by category and urgency', async () => {
      const { client, getNotifications } = makeClient();
      getNotifications.mockResolvedValue([]);
      const tool = new GetNotificationsTool(client);

      await tool.execute({ category: 'disputes', urgencyLevel: 'critical' }, context);

      expect(getNotifications).toHaveBeenCalledWith('tok', 'disputes', 'critical');
    });
  });

  describe('DismissNotificationTool', () => {
    it('marks a notification as read', async () => {
      const { client, dismissNotification } = makeClient();
      dismissNotification.mockResolvedValue({
        notificationId: 'notif_1',
        status: 'read',
      });
      const tool = new DismissNotificationTool(client);

      const result = await tool.execute(
        { notificationId: 'notif_1', action: 'read' },
        context,
      );

      expect(dismissNotification).toHaveBeenCalledWith('tok', 'notif_1', 'read');
      expect(JSON.parse(result)).toEqual({
        notificationId: 'notif_1',
        status: 'read',
      });
    });

    it('dismisses a notification', async () => {
      const { client, dismissNotification } = makeClient();
      dismissNotification.mockResolvedValue({
        notificationId: 'notif_2',
        status: 'dismissed',
      });
      const tool = new DismissNotificationTool(client);

      await tool.execute({ notificationId: 'notif_2', action: 'dismiss' }, context);

      expect(dismissNotification).toHaveBeenCalledWith('tok', 'notif_2', 'dismiss');
    });

    it('snoozes a notification for 24 hours', async () => {
      const { client, dismissNotification } = makeClient();
      dismissNotification.mockResolvedValue({
        notificationId: 'notif_3',
        status: 'snoozed',
        snoozeUntil: '2026-07-20T12:00:00Z',
      });
      const tool = new DismissNotificationTool(client);

      await tool.execute(
        { notificationId: 'notif_3', action: 'snooze_24h' },
        context,
      );

      expect(dismissNotification).toHaveBeenCalledWith('tok', 'notif_3', 'snooze_24h');
    });
  });

  describe('SetNotificationPreferencesTool', () => {
    it('sets notification preferences with channels and categories', async () => {
      const { client, setNotificationPreferences } = makeClient();
      setNotificationPreferences.mockResolvedValue({
        saved: true,
        channels: ['email', 'push'],
        categories: {
          rent_reminders: true,
          disputes: true,
          maintenance: false,
        },
      });
      const tool = new SetNotificationPreferencesTool(client);

      const result = await tool.execute(
        {
          channels: ['email', 'push'],
          categories: {
            rent_reminders: true,
            disputes: true,
            maintenance: false,
          },
        },
        context,
      );

      expect(setNotificationPreferences).toHaveBeenCalledWith('tok', {
        channels: ['email', 'push'],
        categories: {
          rent_reminders: true,
          disputes: true,
          maintenance: false,
        },
        quietHours: {},
      });
      expect(JSON.parse(result)).toEqual({
        saved: true,
        channels: ['email', 'push'],
        categories: {
          rent_reminders: true,
          disputes: true,
          maintenance: false,
        },
      });
    });

    it('sets quiet hours for notifications', async () => {
      const { client, setNotificationPreferences } = makeClient();
      setNotificationPreferences.mockResolvedValue({
        saved: true,
        quietHours: {
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'EST',
        },
      });
      const tool = new SetNotificationPreferencesTool(client);

      await tool.execute(
        {
          channels: ['email'],
          quietHours: {
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'EST',
          },
        },
        context,
      );

      expect(setNotificationPreferences).toHaveBeenCalledWith('tok', {
        channels: ['email'],
        categories: {},
        quietHours: {
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'EST',
        },
      });
    });
  });
});
