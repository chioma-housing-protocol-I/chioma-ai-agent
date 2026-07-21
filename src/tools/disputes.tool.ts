import { Injectable } from '@nestjs/common';
import { AgentTool, ToolContext } from './tool.interface';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

/**
 * Get disputes involving the user: active disputes, claims, evidence status.
 * Shows timeline and current status with each party.
 */
@Injectable()
export class GetDisputeStatusTool implements AgentTool {
  definition = {
    name: 'get_dispute_status',
    description:
      'Get all disputes involving the user as a tenant or landlord. Shows dispute stage, claims, evidence, timeline, and arbitration status.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'Optional property ID to filter disputes. If omitted, returns all user disputes.',
        },
        status: {
          type: 'string',
          enum: ['open', 'in_arbitration', 'resolved', 'all'],
          description: 'Filter by dispute status (default: all).',
          default: 'all',
        },
      },
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const disputes = await this.chiomaApi.getDisputeStatus(
      context.accessToken,
      args.propertyId as string | undefined,
      (args.status as string) ?? 'all',
    );
    return JSON.stringify(disputes);
  }
}

/**
 * File a new dispute against the other party (e.g., tenant vs landlord, landlord vs tenant).
 * Initiates the dispute resolution / arbitration process.
 */
@Injectable()
export class FileDisputeTool implements AgentTool {
  definition = {
    name: 'file_dispute',
    description:
      'File a new dispute (complaint) against the other party. Initiates the arbitration process. Requires a detailed claim and evidence.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The property ID involved in the dispute.',
        },
        disputeType: {
          type: 'string',
          enum: [
            'maintenance_not_provided',
            'rent_overcharge',
            'unauthorized_entry',
            'property_damage',
            'security_deposit_withholding',
            'lease_violation',
            'other',
          ],
          description: 'Category of the dispute.',
        },
        claimDescription: {
          type: 'string',
          description: 'Detailed description of the claim with dates and impacts.',
        },
        damagesRequested: {
          type: 'number',
          description: 'Amount of damages/compensation sought in USD cents (optional).',
        },
        evidenceUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs or file hashes of supporting evidence (messages, photos, receipts).',
        },
      },
      required: ['propertyId', 'disputeType', 'claimDescription'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const result = await this.chiomaApi.fileDispute(context.accessToken, {
      propertyId: args.propertyId as string,
      disputeType: args.disputeType as string,
      claimDescription: args.claimDescription as string,
      damagesRequested: args.damagesRequested as number | undefined,
      evidenceUrls: (args.evidenceUrls as string[]) ?? [],
    });
    return JSON.stringify(result);
  }
}

/**
 * Submit evidence or response to an active dispute.
 * Updates dispute with new claims, counter-claims, or supporting documents.
 */
@Injectable()
export class SubmitDisputeEvidenceTool implements AgentTool {
  definition = {
    name: 'submit_dispute_evidence',
    description:
      'Submit or update evidence in an active dispute: photos, messages, receipts, witness statements, etc. Can also file a counter-claim.',
    parameters: {
      type: 'object',
      properties: {
        disputeId: {
          type: 'string',
          description: 'The dispute ID.',
        },
        evidenceUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs or file hashes of new evidence.',
        },
        statement: {
          type: 'string',
          description: 'Written statement or response from the party.',
        },
        counterClaim: {
          type: 'object',
          description: 'Optional counter-claim object if responding to the other party',
          properties: {
            type: { type: 'string', description: 'Counter-claim type.' },
            amount: {
              type: 'number',
              description: 'Amount sought in USD cents.',
            },
            description: {
              type: 'string',
              description: 'Description of the counter-claim.',
            },
          },
        },
      },
      required: ['disputeId'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const result = await this.chiomaApi.submitDisputeEvidence(context.accessToken, {
      disputeId: args.disputeId as string,
      evidenceUrls: (args.evidenceUrls as string[]) ?? [],
      statement: args.statement as string | undefined,
      counterClaim: args.counterClaim as Record<string, unknown> | undefined,
    });
    return JSON.stringify(result);
  }
}

/**
 * Accept a proposed arbitration or settlement offer in an active dispute.
 */
@Injectable()
export class AcceptDisputeSettlementTool implements AgentTool {
  definition = {
    name: 'accept_dispute_settlement',
    description:
      'Accept a proposed settlement or arbitration ruling in a dispute. Closes the dispute and releases funds if applicable.',
    parameters: {
      type: 'object',
      properties: {
        disputeId: {
          type: 'string',
          description: 'The dispute ID.',
        },
        settlementId: {
          type: 'string',
          description: 'The settlement or arbitration offer ID.',
        },
        notes: {
          type: 'string',
          description: 'Optional final notes or confirmation message.',
        },
      },
      required: ['disputeId', 'settlementId'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const result = await this.chiomaApi.acceptDisputeSettlement(context.accessToken, {
      disputeId: args.disputeId as string,
      settlementId: args.settlementId as string,
      notes: args.notes as string | undefined,
    });
    return JSON.stringify(result);
  }
}
