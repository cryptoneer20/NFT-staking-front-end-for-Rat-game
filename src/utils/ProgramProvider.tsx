import { FC, useCallback, useMemo, ReactNode } from 'react';
import { ProgramContext } from './useProgram'
import { InfoStaking, METADATA_PROGRAM_ID, confirmOptions } from './constants'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import * as anchor from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_CLOCK_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token} from '@solana/spl-token'
import { sendTransactionWithRetry, sendTransactions } from './utility';
import { Metadata, MasterEdition } from '@metaplex-foundation/mpl-token-metadata'

export interface ProgramProviderProps{
    children : ReactNode
}

export const ProgramProvider: FC<ProgramProviderProps> = ({children}) => {
    const wallet = useWallet()
    const {publicKey} = useWallet()
    
    const {connection: conn} = useConnection()
    
    const [program] = useMemo(()=>{
        const provider = new anchor.AnchorProvider(conn, wallet as any, confirmOptions)
        const program =  new anchor.Program(InfoStaking.idl, InfoStaking.programId, provider)
        return [program]
    },[conn, wallet])

    const getTokenAmount = async() => {
		try{
			if(publicKey!=null){
				const tokenAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID,TOKEN_PROGRAM_ID, InfoStaking.rewardToken, publicKey)
				if(await conn.getAccountInfo(tokenAccount)){
					let resp : any = (await conn.getTokenAccountBalance(tokenAccount)).value
					return Number(resp.uiAmount)
				}
            }
            return 0
		}catch(err){
			return 0
		}
	}

    const getRewardAmount = async(poolData: any, item: any) => {
        try{
            let currentTime = new Date().getTime() / 1000
            const lockStatus = item.lockStatus
            const claimTime = item.claimTime.toNumber()
            const lockTime = item.lockTime.toNumber()
            const decimals = 10**InfoStaking.rewardDecimals
            if(lockStatus==0 && lockStatus==2)
                return poolData.rewardAmount / decimals * (currentTime - claimTime) / poolData.rewardPeriod
            else if(claimTime < lockTime){
                if(lockTime + poolData.lockDuration > currentTime)
                    return (poolData.rewardAmount / decimals * (lockTime - claimTime) + poolData.rewardAmountForLock / decimals * (currentTime - lockTime)) / poolData.rewardPeriod
                else
                    return (poolData.rewardAmount / decimals * (currentTime - claimTime - poolData.lockDuration) + poolData.rewardAmountForLock / decimals * poolData.lockDuration) / poolData.rewardPeriod
            }else if(claimTime < lockTime + poolData.lockDuration){
                if(lockTime+poolData.lockDuration > currentTime)
                    return poolData.rewardAmountForLock / decimals * (currentTime - claimTime) / poolData.rewardPeriod
                else
                    return (poolData.rewardAmountForLock / decimals * (lockTime + poolData.lockDuration - claimTime) + poolData.rewardAmount / decimals * (currentTime - lockTime - poolData.lockDuration)) / poolData.rewardPeriod
            }
            return poolData.rewardAmount / decimals * (currentTime - claimTime) / poolData.rewardPeriod
        }catch(err){
            return 0
        }
    }

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
                lockedNumber: Number(poolData.lockedNumber),
                unstakeFeeAmount: Number(poolData.unstakeFeeAmount)
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
                        let pda = await Metadata.getPDA(nftMint)
                        let edition = await MasterEdition.getPDA(nftMint)
                        const accountInfo = (await conn.getAccountInfo(pda))!;
                        let metadata: any = new Metadata(pda, accountInfo).data.data
                        if(metadata.creators.findIndex(function(a: any){return a.address==InfoStaking.collection.toBase58() && a.verified==1})!=-1){
                            allTokens.push({mint: nftMint, account: tokenAccount.pubkey, metadataAddress: pda, editionAddress: edition, metadata: metadata})
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
                    let pda = await Metadata.getPDA(stakedNft.nftMint)
					const accountInfo: any = await conn.getAccountInfo(pda);
					let metadata = new Metadata(pda, accountInfo).data.data
                    let time = new Date().getTime()/1000
                    let earnedWithIt = 0
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

    const stakeNfts = useCallback(async(items: any[]) => {
        let address = publicKey!
        let instructions: TransactionInstruction[][] = []
        let signers: Keypair[][] = []
        for(let item of items){
            let instruction: TransactionInstruction[] = []
            let [stakingData, ] = PublicKey.findProgramAddressSync([item.mint.toBuffer(), InfoStaking.pool.toBuffer()], InfoStaking.programId)
            if((await conn.getAccountInfo(stakingData))==null){
                instruction.push(program.instruction.initStakingData({
                    accounts:{
                        payer: address,
                        pool: InfoStaking.pool,
                        nftMint: item.mint,
                        metadata: item.metadataAddress,
                        edition: item.editionAddress,
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
            instructions.push(instruction)
            signers.push([])
        }
        await sendTransactions(conn, wallet, instructions, signers)
    }, [wallet])

    const lockNfts = useCallback(async(items: any) => {
        let address = publicKey!
        let instructions: TransactionInstruction[][] = []
        let signers: Keypair[][] = []
        for(let item of items){
            let instruction: TransactionInstruction[] = []
            instruction.push(program.instruction.lockNft({
                accounts:{
                    staker: address,
                    pool: InfoStaking.pool,
                    stakingData: item.stakingDataAddress,
                    clock: SYSVAR_CLOCK_PUBKEY
                }
            }))
            instructions.push(instruction)
            signers.push([])
        }
        await sendTransactions(conn, wallet, instructions, signers)
    }, [wallet])

    const unstakeNfts = useCallback(async(items: any[]) => {
        let address = publicKey!
        let instructions: TransactionInstruction[][] = []
        let signers: Keypair[][] = []
        let poolData = await getPoolData()
        for(let item of items){
            let instruction: TransactionInstruction[] = []
            let tokenFrom = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, InfoStaking.rewardToken, InfoStaking.pool, true)
            let tokenTo = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, InfoStaking.rewardToken, address, true)
            if((await conn.getAccountInfo(tokenTo))==null)
                instruction.push(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, InfoStaking.rewardToken, tokenTo, address, address))
            instruction.push(program.instruction.unstakeNft({
                accounts:{
                    staker: address,
                    pool: InfoStaking.pool,
                    stakingData: item.stakingDataAddress,
                    nftAccount: item.stakingData.nftAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    tokenFrom: tokenFrom,
                    tokenTo: tokenTo,
                    clock: SYSVAR_CLOCK_PUBKEY,
                    poolOwner: poolData.owner,
                    systemProgram: SystemProgram.programId
                }
            }))
            instructions.push(instruction)
            signers.push([])
        }
        await sendTransactions(conn, wallet, instructions, signers)
    }, [wallet])

    const claim = useCallback(async(items: any[]) => {
        let address = publicKey!
        let instructions: TransactionInstruction[][] = []
        let signers: Keypair[][] = []
        for(let item of items){
            let instruction: TransactionInstruction[] = []
            let tokenFrom = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, InfoStaking.rewardToken, InfoStaking.pool, true)
            let tokenTo = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, InfoStaking.rewardToken, address, true)
            if((await conn.getAccountInfo(tokenTo))==null)
                instruction.push(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, InfoStaking.rewardToken, tokenTo, address, address))
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
            instructions.push(instruction)
            signers.push([])
        }
        await sendTransactions(conn, wallet, instructions, signers)
    },[wallet])

    const updatePoolProperties = useCallback(async(rewardPeriod: number, rewardAmount: number, rewardAmountForLock: number, lockDuration: number, feeAmount: number) => {
        let address = publicKey!;
        let poolData = await getPoolData()
        let instructions : TransactionInstruction[] = []
        instructions.push(program.instruction.updatePoolProperties(new anchor.BN(rewardPeriod), new anchor.BN(rewardAmount * (10**InfoStaking.rewardDecimals)), new anchor.BN(rewardAmountForLock * (10**InfoStaking.rewardDecimals)), new anchor.BN(lockDuration), poolData.collection, new anchor.BN(feeAmount * LAMPORTS_PER_SOL), {
            accounts:{
                owner: address,
                pool: InfoStaking.pool,
            }
        }))
        await sendTransactionWithRetry(conn, wallet, instructions, [])
    }, [wallet])

    return <ProgramContext.Provider value={{
        getTokenAmount,
        getRewardAmount,
        getPoolData,
        getNftsForOwner,
        getStakedNftsForOwner,

        stakeNfts,
        unstakeNfts,
        lockNfts,
        claim,

        updatePoolProperties
    }}>{children}</ProgramContext.Provider>
}