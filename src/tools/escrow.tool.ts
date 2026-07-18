import { Injectable } from '@nestjs/common';
import { AgentTool, ToolContext } from './tool.interface';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

/**
 * Get the status of security deposit escrow held during a rental agreement.
 * Shows held amount, conditions for release, dispute status if any.
 */
@Injectable()
export class GetEscrowStatusTool implements AgentTool {
  definition = {
    name: 'get_escrow_status',
    description:
      'Check the status of security deposit escrow. Shows amount held, terms for release (e.g., move-out inspection pending), and any disputes or claims.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The property ID (rental).',
        },
      },
      required: ['propertyId'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const status = await this.chiomaApi.getEscrowStatus(
      context.accessToken,
      args.propertyId as string,
    );
    return JSON.stringify(status);
  }
}

/**
 * Request or approve escrow release (e.g., security deposit after move-out inspection).
 * Returns confirmation and timeline for release.
 */
@Injectable()
export class RequestEscrowReleaseTool implements AgentTool {
  definition = {
    name: 'request_escrow_release',
    description:
      'Request release of escrowed funds (e.g., security deposit). Requires reason and supporting evidence. Landlord or mediator must approve.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The property ID (rental).',
        },
        reason: {
          type: 'string',
          enum: ['move_out_inspection_passed', 'dispute_resolved', 'tenant_request'],
          description:
            'Reason for release request: move_out_inspection_passed, dispute_resolved, or tenant_request.',
        },
        amount: {
          type: 'number',
          description: 'Amount to release in USD cents (null = release full escrow).',
        },
        notes: {
          type: 'string',
          description: 'Supporting notes or evidence description.',
        },
      },
      required: ['propertyId', 'reason'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const result = await this.chiomaApi.requestEscrowRelease(context.accessToken, {
      propertyId: args.propertyId as string,
      reason: args.reason as string,
      amount: args.amount as number | undefined,
      notes: args.notes as string | undefined,
    });
    return JSON.stringify(result);
  }
}

/**
 * File a claim against escrow for damage or breach (e.g., unpaid rent, damages).
 * Initiates the dispute/arbitration process.
 */
@Injectable()
export class FileEscrowClaimTool implements AgentTool {
  definition = {
    name: 'file_escrow_claim',
    description:
      'File a claim against escrowed funds for damages, unpaid rent, or other tenant/landlord breaches. This triggers an arbitration or dispute process.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The property ID (rental).',
        },
        claimAmount: {
          type: 'number',
          description: 'Claim amount in USD cents.',
        },
        claimType: {
          type: 'string',
          enum: ['damage', 'unpaid_rent', 'breach_of_terms', 'other'],
          description: 'Type of claim: damage, unpaid_rent, breach_of_terms, or other.',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the claim with evidence references.',
        },
        evidenceUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs or file hashes of supporting evidence (photos, receipts, etc).',
        },
      },
      required: ['propertyId', 'claimAmount', 'claimType', 'description'],
    },
  };

  constructor(private readonly chiomaApi: ChiomaApiClient) {}

  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    const result = await this.chiomaApi.fileEscrowClaim(context.accessToken, {
      propertyId: args.propertyId as string,
      claimAmount: args.claimAmount as number,
      claimType: args.claimType as string,
      description: args.description as string,
      evidenceUrls: (args.evidenceUrls as string[]) ?? [],
    });
    return JSON.stringify(result);
  }
}
