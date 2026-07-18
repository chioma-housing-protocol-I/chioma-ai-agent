import {
  GetEscrowStatusTool,
  RequestEscrowReleaseTool,
  FileEscrowClaimTool,
} from './escrow.tool';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

describe('escrow tools', () => {
  const context = { accessToken: 'tok' };

  function makeClient() {
    const getEscrowStatus = jest.fn<
      ReturnType<ChiomaApiClient['getEscrowStatus']>,
      Parameters<ChiomaApiClient['getEscrowStatus']>
    >();
    const requestEscrowRelease = jest.fn<
      ReturnType<ChiomaApiClient['requestEscrowRelease']>,
      Parameters<ChiomaApiClient['requestEscrowRelease']>
    >();
    const fileEscrowClaim = jest.fn<
      ReturnType<ChiomaApiClient['fileEscrowClaim']>,
      Parameters<ChiomaApiClient['fileEscrowClaim']>
    >();
    const client = {
      getEscrowStatus,
      requestEscrowRelease,
      fileEscrowClaim,
    } as unknown as ChiomaApiClient;
    return { client, getEscrowStatus, requestEscrowRelease, fileEscrowClaim };
  }

  describe('GetEscrowStatusTool', () => {
    it('returns escrow status for a property', async () => {
      const { client, getEscrowStatus } = makeClient();
      getEscrowStatus.mockResolvedValue({
        propertyId: 'prop123',
        heldAmount: 150000,
        status: 'active',
        releaseCondition: 'move_out_inspection_pending',
        disputes: [],
      });
      const tool = new GetEscrowStatusTool(client);

      const result = await tool.execute({ propertyId: 'prop123' }, context);

      expect(getEscrowStatus).toHaveBeenCalledWith('tok', 'prop123');
      expect(JSON.parse(result)).toEqual({
        propertyId: 'prop123',
        heldAmount: 150000,
        status: 'active',
        releaseCondition: 'move_out_inspection_pending',
        disputes: [],
      });
    });
  });

  describe('RequestEscrowReleaseTool', () => {
    it('requests release with reason only', async () => {
      const { client, requestEscrowRelease } = makeClient();
      requestEscrowRelease.mockResolvedValue({
        requestId: 'rel_123',
        status: 'pending_approval',
        expectedReleaseDate: '2026-08-05',
      });
      const tool = new RequestEscrowReleaseTool(client);

      const result = await tool.execute(
        { propertyId: 'prop123', reason: 'move_out_inspection_passed' },
        context,
      );

      expect(requestEscrowRelease).toHaveBeenCalledWith('tok', {
        propertyId: 'prop123',
        reason: 'move_out_inspection_passed',
        amount: undefined,
        notes: undefined,
      });
      expect(JSON.parse(result)).toEqual({
        requestId: 'rel_123',
        status: 'pending_approval',
        expectedReleaseDate: '2026-08-05',
      });
    });

    it('requests partial release with amount and notes', async () => {
      const { client, requestEscrowRelease } = makeClient();
      requestEscrowRelease.mockResolvedValue({
        requestId: 'rel_456',
        status: 'pending_approval',
      });
      const tool = new RequestEscrowReleaseTool(client);

      await tool.execute(
        {
          propertyId: 'prop123',
          reason: 'dispute_resolved',
          amount: 100000,
          notes: 'Partial settlement agreed',
        },
        context,
      );

      expect(requestEscrowRelease).toHaveBeenCalledWith('tok', {
        propertyId: 'prop123',
        reason: 'dispute_resolved',
        amount: 100000,
        notes: 'Partial settlement agreed',
      });
    });
  });

  describe('FileEscrowClaimTool', () => {
    it('files an escrow claim with required fields', async () => {
      const { client, fileEscrowClaim } = makeClient();
      fileEscrowClaim.mockResolvedValue({
        claimId: 'claim_123',
        status: 'filed',
        arbitrationStartDate: '2026-07-26',
      });
      const tool = new FileEscrowClaimTool(client);

      const result = await tool.execute(
        {
          propertyId: 'prop123',
          claimAmount: 50000,
          claimType: 'damage',
          description: 'Carpet damage in living room',
          evidenceUrls: ['https://example.com/photo1.jpg'],
        },
        context,
      );

      expect(fileEscrowClaim).toHaveBeenCalledWith('tok', {
        propertyId: 'prop123',
        claimAmount: 50000,
        claimType: 'damage',
        description: 'Carpet damage in living room',
        evidenceUrls: ['https://example.com/photo1.jpg'],
      });
      expect(JSON.parse(result)).toEqual({
        claimId: 'claim_123',
        status: 'filed',
        arbitrationStartDate: '2026-07-26',
      });
    });

    it('files a claim without evidence URLs', async () => {
      const { client, fileEscrowClaim } = makeClient();
      fileEscrowClaim.mockResolvedValue({ claimId: 'claim_456', status: 'filed' });
      const tool = new FileEscrowClaimTool(client);

      await tool.execute(
        {
          propertyId: 'prop123',
          claimAmount: 25000,
          claimType: 'unpaid_rent',
          description: 'June rent unpaid',
        },
        context,
      );

      expect(fileEscrowClaim).toHaveBeenCalledWith('tok', {
        propertyId: 'prop123',
        claimAmount: 25000,
        claimType: 'unpaid_rent',
        description: 'June rent unpaid',
        evidenceUrls: [],
      });
    });
  });
});
