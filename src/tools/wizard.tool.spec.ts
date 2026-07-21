import {
  GetPricingSuggestionTool,
  GetDescriptionSuggestionTool,
  GetCompletenessScoreTool,
} from './wizard.tool';
import { ChiomaApiClient } from '../integrations/chioma-api/chioma-api.client';

describe('wizard tools', () => {
  const context = { accessToken: 'tok' };

  function makeClient() {
    const getPricingSuggestion = jest.fn<
      ReturnType<ChiomaApiClient['getPricingSuggestion']>,
      Parameters<ChiomaApiClient['getPricingSuggestion']>
    >();
    const getDescriptionSuggestion = jest.fn<
      ReturnType<ChiomaApiClient['getDescriptionSuggestion']>,
      Parameters<ChiomaApiClient['getDescriptionSuggestion']>
    >();
    const getCompletenessScore = jest.fn<
      ReturnType<ChiomaApiClient['getCompletenessScore']>,
      Parameters<ChiomaApiClient['getCompletenessScore']>
    >();
    const client = {
      getPricingSuggestion,
      getDescriptionSuggestion,
      getCompletenessScore,
    } as unknown as ChiomaApiClient;
    return {
      client,
      getPricingSuggestion,
      getDescriptionSuggestion,
      getCompletenessScore,
    };
  }

  it('GetPricingSuggestionTool forwards the access token and draftId', async () => {
    const { client, getPricingSuggestion } = makeClient();
    const suggestion = {
      suggestedRent: 1200,
      depositRange: { min: 1200, max: 2400 },
    };
    getPricingSuggestion.mockResolvedValue(suggestion as never);
    const tool = new GetPricingSuggestionTool(client);

    const result = await tool.execute({ draftId: 'draft-1' }, context);

    expect(getPricingSuggestion).toHaveBeenCalledWith('tok', 'draft-1');
    expect(JSON.parse(result)).toEqual(suggestion);
  });

  it('GetDescriptionSuggestionTool forwards the access token and draftId', async () => {
    const { client, getDescriptionSuggestion } = makeClient();
    const suggestion = {
      description: 'A cozy two-bedroom flat.',
      neighborhoodBlurb: 'Quiet and well connected.',
    };
    getDescriptionSuggestion.mockResolvedValue(suggestion as never);
    const tool = new GetDescriptionSuggestionTool(client);

    const result = await tool.execute({ draftId: 'draft-2' }, context);

    expect(getDescriptionSuggestion).toHaveBeenCalledWith('tok', 'draft-2');
    expect(JSON.parse(result)).toEqual(suggestion);
  });

  it('GetCompletenessScoreTool forwards the access token and draftId', async () => {
    const { client, getCompletenessScore } = makeClient();
    const score = { score: 82, improvements: ['Add more photos.'] };
    getCompletenessScore.mockResolvedValue(score as never);
    const tool = new GetCompletenessScoreTool(client);

    const result = await tool.execute({ draftId: 'draft-3' }, context);

    expect(getCompletenessScore).toHaveBeenCalledWith('tok', 'draft-3');
    expect(JSON.parse(result)).toEqual(score);
  });
});
