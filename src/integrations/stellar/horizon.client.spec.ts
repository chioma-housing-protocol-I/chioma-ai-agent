import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { StellarHorizonClient, HorizonTransaction } from './horizon.client';
import { InternalAxiosRequestConfig } from 'axios';

describe('StellarHorizonClient', () => {
  let client: StellarHorizonClient;
  let httpService: { get: jest.Mock };

  const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  });

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StellarHorizonClient,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({
              stellarHorizonUrl: 'https://horizon-testnet.stellar.org',
            }),
          },
        },
      ],
    }).compile();

    client = module.get<StellarHorizonClient>(StellarHorizonClient);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('getAccountBalances', () => {
    it('returns the balances array for an account', async () => {
      const mockBalances = [
        { asset_type: 'native', balance: '100.0000000' },
      ];
      httpService.get.mockReturnValue(
        of(mockAxiosResponse({ account_id: 'GABC', sequence: '1', balances: mockBalances })),
      );

      const result = await client.getAccountBalances('GABC');

      expect(result).toEqual(mockBalances);
      expect(httpService.get).toHaveBeenCalledWith(
        '/accounts/GABC',
        expect.objectContaining({ baseURL: 'https://horizon-testnet.stellar.org' }),
      );
    });
  });

  describe('getTransactions', () => {
    it('returns transactions with a next cursor when present', async () => {
      const mockTx = [{ id: 'tx1', hash: 'abc', ledger: 1, created_at: 'now', source_account: 'GABC', successful: true, fee_charged: '100' }];
      httpService.get.mockReturnValue(
        of(
          mockAxiosResponse({
            _embedded: { records: mockTx },
            _links: { next: { href: 'https://horizon-testnet.stellar.org/accounts/GABC/transactions?cursor=999' } },
          }),
        ),
      );

      const result = await client.getTransactions('GABC', { limit: 10 });

      expect(result.transactions).toEqual(mockTx);
      expect(result.nextCursor).toBe('999');
    });

    it('returns undefined nextCursor when no next link exists', async () => {
      const mockTx: HorizonTransaction[] = [];
      httpService.get.mockReturnValue(
        of(mockAxiosResponse({ _embedded: { records: mockTx }, _links: {} })),
      );

      const result = await client.getTransactions('GABC');

      expect(result.nextCursor).toBeUndefined();
    });
  });
});
