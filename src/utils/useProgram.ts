import { createContext, useContext } from "react";
import { PublicKey } from '@solana/web3.js';

export interface ProgramContextState{
    getPoolData() : Promise<any>;
    getNftsForOwner(owner: PublicKey) : Promise<any[]>;
    getStakedNftsForOwner(owner: PublicKey) : Promise<any[]>;

    stakeNft(item: any) : Promise<void>;
    unstakeNft(item: any) : Promise<void>;
    claim(item: any) : Promise<void>;
}

export const ProgramContext = createContext<ProgramContextState>({
} as ProgramContextState)

export function useProgram() : ProgramContextState{
    return useContext(ProgramContext)
}