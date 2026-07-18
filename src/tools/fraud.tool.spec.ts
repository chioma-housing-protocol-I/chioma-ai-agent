import {
  GetFraudSignalsTool,
  GetFraudAlertsTool,
  ReportFraudSuspicionTool,
} from './fraud.tool';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

describe('fraud tools', () => {
  const context = { accessToken: 'tok' };

  function makeClient() {
    const getFraudSignals = jest.fn<
      ReturnType<ChiomaApiClient['getFraudSignals']>,
      Parameters<ChiomaApiClient['getFraudSignals']>
    >();
    const getFraudAlerts = jest.fn<
      ReturnType<ChiomaApiClient['getFraudAlerts']>,
      Parameters<ChiomaApiClient['getFraudAlerts']>
    >();
    const reportFraudSuspicion = jest.fn<
      ReturnType<ChiomaApiClient['reportFraudSuspicion']>,
      Parameters<ChiomaApiClient['reportFraudSuspicion']>
    >();
    const client = {
      getFraudSignals,
      getFraudAlerts,
      reportFraudSuspicion,
    } as unknown as ChiomaApiClient;
    return { client, getFraudSignals, getFraudAlerts, reportFraudSuspicion };
  }

  describe('GetFraudSignalsTool', () => {
    it('gets fraud signals for a property', async () => {
      const { client, getFraudSignals } = makeClient();
      getFraudSignals.mockResolvedValue({
        riskScore: 0.15,
        signals: ['price_significantly_below_market'],
        flaggedAt: '2026-07-15',
      });
      const tool = new GetFraudSignalsTool(client);

      const result = await tool.execute(
        { entityType: 'property', entityId: 'prop123' },
        context,
      );

      expect(getFraudSignals).toHaveBeenCalledWith('tok', 'property', 'prop123');
      expect(JSON.parse(result)).toEqual({
        riskScore: 0.15,
        signals: ['price_significantly_below_market'],
        flaggedAt: '2026-07-15',
      });
    });

    it('gets fraud signals for a user', async () => {
      const { client, getFraudSignals } = makeClient();
      getFraudSignals.mockResolvedValue({
        riskScore: 0.05,
        signals: [],
        flaggedAt: null,
      });
      const tool = new GetFraudSignalsTool(client);

      const result = await tool.execute({ entityType: 'user', entityId: 'user123' }, context);

      expect(getFraudSignals).toHaveBeenCalledWith('tok', 'user', 'user123');
      expect(JSON.parse(result)).toEqual({
        riskScore: 0.05,
        signals: [],
        flaggedAt: null,
      });
    });

    it('gets fraud signals for a landlord', async () => {
      const { client, getFraudSignals } = makeClient();
      getFraudSignals.mockResolvedValue({
        riskScore: 0.3,
        signals: [
          'multiple_evictions',
          'consistent_deposit_disputes',
          'rapid_property_turnover',
        ],
        flaggedAt: '2026-06-01',
      });
      const tool = new GetFraudSignalsTool(client);

      await tool.execute({ entityType: 'landlord', entityId: 'landlord123' }, context);

      expect(getFraudSignals).toHaveBeenCalledWith('tok', 'landlord', 'landlord123');
    });
  });

  describe('GetFraudAlertsTool', () => {
    it('returns all fraud alerts with default severity filter', async () => {
      const { client, getFraudAlerts } = makeClient();
      getFraudAlerts.mockResolvedValue([
        {
          alertId: 'alert_1',
          severity: 'high',
          type: 'suspicious_listing',
          description: 'Listing flagged for unusually low price',
        },
      ]);
      const tool = new GetFraudAlertsTool(client);

      const result = await tool.execute({}, context);

      expect(getFraudAlerts).toHaveBeenCalledWith('tok', 'all', false);
      expect(JSON.parse(result)).toEqual([
        {
          alertId: 'alert_1',
          severity: 'high',
          type: 'suspicious_listing',
          description: 'Listing flagged for unusually low price',
        },
      ]);
    });

    it('filters alerts by severity', async () => {
      const { client, getFraudAlerts } = makeClient();
      getFraudAlerts.mockResolvedValue([]);
      const tool = new GetFraudAlertsTool(client);

      await tool.execute({ severity: 'critical' }, context);

      expect(getFraudAlerts).toHaveBeenCalledWith('tok', 'critical', false);
    });

    it('includes resolved alerts when requested', async () => {
      const { client, getFraudAlerts } = makeClient();
      getFraudAlerts.mockResolvedValue([]);
      const tool = new GetFraudAlertsTool(client);

      await tool.execute({ includeResolved: true }, context);

      expect(getFraudAlerts).toHaveBeenCalledWith('tok', 'all', true);
    });
  });

  describe('ReportFraudSuspicionTool', () => {
    it('reports suspected fraud with required fields', async () => {
      const { client, reportFraudSuspicion } = makeClient();
      reportFraudSuspicion.mockResolvedValue({
        reportId: 'report_123',
        status: 'submitted_for_review',
        investigationId: 'inv_456',
      });
      const tool = new ReportFraudSuspicionTool(client);

      const result = await tool.execute(
        {
          fraudType: 'fake_listing',
          description: 'Property listed multiple times with different owners',
          relatedEntityIds: ['prop123', 'landlord_abc'],
        },
        context,
      );

      expect(reportFraudSuspicion).toHaveBeenCalledWith('tok', {
        fraudType: 'fake_listing',
        description: 'Property listed multiple times with different owners',
        relatedEntityIds: ['prop123', 'landlord_abc'],
        evidenceUrls: [],
      });
      expect(JSON.parse(result)).toEqual({
        reportId: 'report_123',
        status: 'submitted_for_review',
        investigationId: 'inv_456',
      });
    });

    it('includes evidence URLs when provided', async () => {
      const { client, reportFraudSuspicion } = makeClient();
      reportFraudSuspicion.mockResolvedValue({ reportId: 'report_789', status: 'submitted' });
      const tool = new ReportFraudSuspicionTool(client);

      await tool.execute(
        {
          fraudType: 'phishing',
          description: 'Suspicious email asking for wire transfer to secure listing',
          evidenceUrls: ['https://example.com/email_screenshot.png'],
        },
        context,
      );

      expect(reportFraudSuspicion).toHaveBeenCalledWith('tok', {
        fraudType: 'phishing',
        description: 'Suspicious email asking for wire transfer to secure listing',
        relatedEntityIds: [],
        evidenceUrls: ['https://example.com/email_screenshot.png'],
      });
    });
  });
});
