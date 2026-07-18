import { Injectable } from '@nestjs/common';
import { AgentTool, ToolContext } from './tool.interface';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

/**
 * Get fraud risk scores and signals for a user, property, or listing.
 * Read-only: does not modify fraud models or training data.
 * Surfaces existing signals to inform agent recommendations.
 */
@Injectable()
export class GetFraudSignalsTool implements AgentTool {
  definition = {
    name: 'get_fraud_signals',
    description:
      'Retrieve fraud risk flags and signals for a property, user, or landlord. Helps identify potential rental scams, suspicious activity, or trust concerns.',
    parameters: {
      type: 'object',
      properties: {
        entityType: {
          type: 'string',
          enum: ['user', 'property', 'landlord'],
          description: 'Type of entity to check: user, property, or landlord.',
        },
        entityId: {
          type: 'string',
          description: 'The ID of the user, property, or landlord to check.',
        },
      },
      required: ['entityType', 'entityId'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const signals = await this.chiomaApi.getFraudSignals(
      context.accessToken,
      args.entityType as string,
      args.entityId as string,
    );
    return JSON.stringify(signals);
  }
}

/**
 * Get a summary of all fraud alerts and anomalies affecting the user.
 * Includes active warnings and historical incidents.
 */
@Injectable()
export class GetFraudAlertsTool implements AgentTool {
  definition = {
    name: 'get_fraud_alerts',
    description:
      'Get all fraud alerts and warnings related to the user: warnings about suspicious listings, blocked accounts, reported scams, or account compromise alerts.',
    parameters: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low', 'all'],
          description: 'Filter alerts by severity (default: all).',
          default: 'all',
        },
        includeResolved: {
          type: 'boolean',
          description: 'Include resolved/historical alerts (default: false).',
          default: false,
        },
      },
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const alerts = await this.chiomaApi.getFraudAlerts(
      context.accessToken,
      (args.severity as string) ?? 'all',
      (args.includeResolved as boolean) ?? false,
    );
    return JSON.stringify(alerts);
  }
}

/**
 * Report suspected fraud, scam, or suspicious activity.
 * Creates a support ticket for the fraud team to investigate.
 * Note: This creates a report but does not directly modify fraud scores or models.
 */
@Injectable()
export class ReportFraudSuspicionTool implements AgentTool {
  definition = {
    name: 'report_fraud_suspicion',
    description:
      'Report suspected fraud, scam, or suspicious activity. Examples: fake listing, phishing attempt, unauthorized account access, or suspicious landlord behavior. Creates a case for investigation.',
    parameters: {
      type: 'object',
      properties: {
        fraudType: {
          type: 'string',
          enum: ['fake_listing', 'phishing', 'account_compromise', 'scam', 'other'],
          description: 'Type of suspected fraud.',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the suspicious activity.',
        },
        relatedEntityIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of related users, properties, or accounts involved.',
        },
        evidenceUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs, screenshots, or file hashes of evidence.',
        },
      },
      required: ['fraudType', 'description'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const result = await this.chiomaApi.reportFraudSuspicion(context.accessToken, {
      fraudType: args.fraudType as string,
      description: args.description as string,
      relatedEntityIds: (args.relatedEntityIds as string[]) ?? [],
      evidenceUrls: (args.evidenceUrls as string[]) ?? [],
    });
    return JSON.stringify(result);
  }
}
