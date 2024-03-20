import { createContext, useContext } from "react";
import { PublicKey } from '@solana/web3.js';

export interface ProgramContextState{
    getTokenAmount() : Promise<number>;
    getRewardAmount(poolData: any, item: any) : Promise<number>;
    getPoolData() : Promise<any>;
    getNftsForOwner(owner: PublicKey) : Promise<any[]>;
    getStakedNftsForOwner(owner: PublicKey) : Promise<any[]>;

    stakeNfts(items: any[]) : Promise<void>;
    unstakeNfts(items: any[]) : Promise<void>;
    lockNfts(items: any[]): Promise<void>
    claim(items: any[]) : Promise<void>;

    updatePoolProperties(rewardPeriod: number, rewardAmount: number, rewardAmountForLock: number, lockDuration: number, feeAmount: number) : Promise<void>;
    redeemToken(amount: number) : Promise<void>;
}

export const ProgramContext = createContext<ProgramContextState>({
} as ProgramContextState)

export function useProgram() : ProgramContextState{
    return useContext(ProgramContext)
}