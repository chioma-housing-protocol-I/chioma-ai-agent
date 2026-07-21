import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { RootConfig } from '../../config/env.validation';

export interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export interface HorizonAccount {
  account_id: string;
  sequence: string;
  balances: HorizonBalance[];
}

export interface HorizonTransaction {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  successful: boolean;
  fee_charged: string;
  memo?: string;
}

export interface HorizonTransactionPage {
  transactions: HorizonTransaction[];
  nextCursor?: string;
}

/**
 * Typed read-only client for the Stellar Horizon API. Provides account
 * balance and transaction lookups. No write/submit operations — read-only
 * by design, following the same conventions as ChiomaApiClient.
 */
@Injectable()
export class StellarHorizonClient {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService<RootConfig, true>,
  ) {
    this.baseUrl = configService.get('app', { infer: true }).stellarHorizonUrl;
  }

  async getAccountBalances(accountId: string): Promise<HorizonBalance[]> {
    const account = await this.get<HorizonAccount>(`/accounts/${accountId}`);
    return account.balances;
  }

  async getTransactions(
    accountId: string,
    opts: { limit?: number; cursor?: string; order?: 'asc' | 'desc' } = {},
  ): Promise<HorizonTransactionPage> {
    const { limit = 10, cursor, order = 'desc' } = opts;
    const response = await this.get<{
      _embedded: { records: HorizonTransaction[] };
      _links: { next?: { href: string } };
    }>(`/accounts/${accountId}/transactions`, { limit, cursor, order });

    const nextHref = response._links?.next?.href;
    const nextCursor = nextHref
      ? new URL(nextHref).searchParams.get('cursor') ?? undefined
      : undefined;

    return {
      transactions: response._embedded.records,
      nextCursor,
    };
  }

  private async get<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      baseURL: this.baseUrl,
      params,
    };
    const response = await firstValueFrom(this.httpService.get<T>(path, config));
    return response.data;
  }
}
