import { FC, useCallback, useMemo, ReactNode } from 'react';
import { ProgramContext } from './useProgram'
import { InfoStaking, confirmOptions } from './constants'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import * as anchor from "@project-serum/anchor";
import { PublicKey, SYSVAR_CLOCK_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction} from '@solana/spl-token'
import { sendTransactionWithRetry } from './utility';
import { Metaplex } from '@metaplex-foundation/js'

export interface ProgramProviderProps{
    children : ReactNode
}

export const ProgramProvider: FC<ProgramProviderProps> = ({children}) => {
    const wallet = useWallet()
    const {publicKey} = useWallet()
    const {connection: conn} = useConnection()
    
    const [program, metaplex] = useMemo(()=>{
        const provider = new anchor.AnchorProvider(conn, wallet as any, confirmOptions)
        const program =  new anchor.Program(InfoStaking.idl, InfoStaking.programId, provider)
        const metaplex = Metaplex.make(conn)
        return [program, metaplex]
    },[conn, wallet])

    const getPoolData = async() => {
        try{
            let poolData = await program.account.pool.fetch(InfoStaking.pool) as any
            return {
                ...poolData,
                rewardPeriod: Number(poolData.rewardPeriod),
                rewardAmount: Number(poolData.rewardAmount),
                rewardAmountForLock: Number(poolData.rewardAmountForLock),
                lockDuration: Number(poolData.lockDuration),
                totalNumber: Number(poolData.totalNumber),
                lockedNumber: Number(poolData.lockedNumber)
            }
        }catch(err){
            return null
        }
    }

    const getNftsForOwner = async(owner: PublicKey) => {
        try{
            const allTokens: any[] = []
            const tokenAccounts = await conn.getParsedTokenAccountsByOwner(owner, {programId: TOKEN_PROGRAM_ID})
            for(let tokenAccount of tokenAccounts.value){
                try{
                    const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
                    if(tokenAmount.amount === "1" && tokenAmount.decimals === 0){
                        let nftMint = new PublicKey(tokenAccount.account.data.parsed.info.mint) 
                        let metadata = await metaplex.nfts().findByMint({mintAddress: nftMint})
                        if(metadata.creators.findIndex(function(a){return a.address.toBase58()==InfoStaking.collection.toBase58() && a.verified==true})!=-1){
                            allTokens.push({
                                mint: nftMint,
                                account: tokenAccount.pubkey,
                                metadata: metadata
                            })
                        }
                    }
                }catch(err){

                }
            }
            allTokens.sort(function(a: any, b: any){
                if(a.metadata.name > b.metadata.name) return 1
                if(a.metadata.name < b.metadata.name) return -1
                return 0
            })
            return allTokens
        }catch(err){
            return []
        }
    }

    const getStakedNftsForOwner = async(owner: PublicKey) => {
        try{
            let allTokens: any[] = []
            const STAKING_DATA_SIZE = 8 + 32 + 32 + 32 + 1 + 32 + 8 + 8 + 8 + 1 + 40;
            let resp = await conn.getProgramAccounts(InfoStaking.programId, {
                dataSlice: {length:0, offset: 0},
                filters: [
                    {dataSize: STAKING_DATA_SIZE},
                    {memcmp: {offset:8, bytes: InfoStaking.pool.toBase58()}},
                    {memcmp: {offset:105, bytes: owner.toBase58()}}
                ]
            })
            let poolData = await getPoolData()
            for(let nftAccount of resp){
                let stakedNft = await program.account.stakingData.fetch(nftAccount.pubkey) as any
                if(stakedNft.isStaked === false) continue;
                try{
                    let metadata = await metaplex.nfts().findByMint(stakedNft.nftMint)
                    let time = new Date().getTime()/1000
                    let earnedWithIt = poolData.rewardAmount * Math.floor((time - stakedNft.stakeTime.toNumber() + 30)/poolData.rewardPeriod - stakedNft.claimNumber.toNumber())
                    allTokens.push({stakingData: stakedNft, stakingDataAddress: nftAccount.pubkey, earned: earnedWithIt>0 ? earnedWithIt : 0, metadata: metadata})
                }catch(err){

                }
            }
            allTokens.sort(function(a: any, b: any){
                if(a.metadata.name < b.metadata.name) return 1
                if(a.metadata.name > b.metadata.name) return -1
                return 0
            })
            return allTokens
        }catch(err){
            return []
        }
    }

    const stakeNft = useCallback(async(item: any) => {
        let address = publicKey!
        let instruction: TransactionInstruction[] = []
        let [stakingData, ] = PublicKey.findProgramAddressSync([item.mint.toBuffer(), InfoStaking.pool.toBuffer()], InfoStaking.programId)
        if((await conn.getAccountInfo(stakingData))==null){
            instruction.push(program.instruction.initStakingData({
                accounts:{
                    payer: address,
                    pool: InfoStaking.pool,
                    nftMint: item.mint,
                    metadata: item.metadata.address,
                    
                    stakingData: stakingData,
                    systemProgram: SystemProgram.programId
                }
            }))
        }
        instruction.push(program.instruction.stakeNft({
            accounts:{
                staker: address,
                pool: InfoStaking.pool,
                stakingData: stakingData,
                nftAccount: item.account,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        await sendTransactionWithRetry(conn, wallet, instruction, [])
    }, [wallet])

    const lockNft = useCallback(async(item: any) => {
        let address = publicKey!
        let instruction: TransactionInstruction[] = []
        instruction.push(program.instruction.lockNft({
            accounts:{
                staker: address,
                pool: InfoStaking.pool,
                stakingData: item.stakingDataAddress,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        await sendTransactionWithRetry(conn, wallet, instruction, [])
    }, [wallet])

    const unstakeNft = useCallback(async(item: any) => {
        let address = publicKey!
        let instruction: TransactionInstruction[] = []
        let tokenFrom = getAssociatedTokenAddressSync(InfoStaking.rewardToken, InfoStaking.pool, true)
        let tokenTo = getAssociatedTokenAddressSync(InfoStaking.rewardToken, address, true)
        if((await conn.getAccountInfo(tokenTo))==null)
            instruction.push(createAssociatedTokenAccountInstruction(address, tokenTo, address, InfoStaking.rewardToken))
        instruction.push(program.instruction.unstakeNft({
            accounts:{
                staker: address,
                pool: InfoStaking.pool,
                stakingData: item.stakingDataAddress,
                nftAccount: item.stakingData.nftAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                tokenFrom: tokenFrom,
                tokenTo: tokenTo,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        await sendTransactionWithRetry(conn, wallet, instruction, [])
    }, [wallet])

    const claim = useCallback(async(item: any) => {
        let address = publicKey!
        let instruction: TransactionInstruction[] = []
        let tokenFrom = getAssociatedTokenAddressSync(InfoStaking.rewardToken,InfoStaking.pool,true)
        let tokenTo = getAssociatedTokenAddressSync(InfoStaking.rewardToken,address,true)
        if((await conn.getAccountInfo(tokenTo))==null)
            instruction.push(createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID,TOKEN_PROGRAM_ID,InfoStaking.rewardToken,tokenTo,address,address))
        instruction.push(program.instruction.claimReward({
            accounts:{
                staker: address,
                pool: InfoStaking.pool,
                stakingData: item.stakingDataAddress,
                tokenFrom: tokenFrom,
                tokenTo: tokenTo,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        await sendTransactionWithRetry(conn, wallet, instruction, [])
    },[wallet])

    return <ProgramContext.Provider value={{
        getPoolData,
        getNftsForOwner,
        getStakedNftsForOwner,

        stakeNft,
        unstakeNft,
        claim,
    }}>{children}</ProgramContext.Provider>
}