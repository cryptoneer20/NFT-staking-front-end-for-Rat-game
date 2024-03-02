import { useWallet } from "@solana/wallet-adapter-react"
import { useProgram } from "../utils/useProgram"
import { useEffect, useState } from "react"
import { InfoStaking, openNotification } from "../utils/constants"
import NftCard from "../components/NftCard"
import StakedNftCard from "../components/StakedNftCard"
import { CircularProgress } from '@mui/material';

import BACKGROUND from '../assets/images/background.png'
import TWITTER_IMG_Light from '../assets/images/twitter.png'
import DISCORD_IMG from '../assets/images/discord.png'
import TENSOR_IMG from '../assets/images/tensor.png'

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PublicKey } from "@solana/web3.js"

export default function NftStake(){
    const {getTokenAmount, getRewardAmount, getNftsForOwner, getStakedNftsForOwner, getPoolData, stakeNfts, unstakeNfts, lockNfts, claim} = useProgram()
    const {publicKey} = useWallet()
    
    const [poolData, setPoolData] = useState<any>(null)
    const [ownedNfts, setOwnedNfts] = useState<any[]>([])
    const [stakedNfts, setStakedNfts] = useState<any[]>([])
    const [rewardAmounts, setRewardAmounts] = useState<number[]>([])
    const [totalRewardAmount, setTotalRewardAmount] = useState(0)

    const [isNftLoading, setIsNftLoading] = useState(false)
	const [isStakedNftLoading, setIsStakedNftLoading] = useState(false)

    const [ownedTokenAmount, setOwnedTokenAmount] = useState(0)

    useEffect(()=>{
        getStakingPoolData()
    },[])

    useEffect(()=>{
        const interval = setInterval(()=>{getStakingPoolData()}, 10000)
        return ()=>clearInterval(interval)
    },[])

    const getStakingPoolData = async() => {
        setPoolData(await getPoolData())
    }

    useEffect(()=>{
        getOwnedNfts()
        getStakedNfts()
        getOwnedTokenAmount()
    },[publicKey])
    
    useEffect(()=>{
        const interval = setInterval(()=>{getOwnedTokenAmount()}, 10000)
        return ()=>clearInterval(interval)
    },[publicKey])
    
    useEffect(()=>{
        getRewardAmounts()
    }, [stakedNfts])

    useEffect(()=>{
        const interval = setInterval(()=>{getRewardAmounts()}, 1000)
        return ()=>clearInterval(interval)
    },[stakedNfts])

    const handleSelectNft = (nft : PublicKey) => {
		setOwnedNfts(ownedNfts.map((item)=>{
			if(item.mint.toBase58()===nft.toBase58()){
				return {...item, selected : !item.selected}
			}
			return item
		}))
	}

    const handleSelectStakeNft = (nft : PublicKey) => {
		setStakedNfts(stakedNfts.map((item)=>{
			if(item.stakingDataAddress.toBase58()===nft.toBase58()){
				return {...item, selected : !item.selected}
			}
			return item
		}))
	}

    const getOwnedNfts = async() => {
        setIsNftLoading(true)
        if(publicKey!=null){
            let nfts = await getNftsForOwner(publicKey)
            setOwnedNfts(nfts.map(item=>{return {...item, selected: false}}))
        }
        else
            setOwnedNfts([])
        setIsNftLoading(false)
    }

    const getStakedNfts = async() => {
        setIsStakedNftLoading(true)
        if(publicKey!=null){
            let nfts = await getStakedNftsForOwner(publicKey)
            setStakedNfts(nfts.map(item=>{return {...item, selected: false}}))
        }
        else
            setStakedNfts([])
        setIsStakedNftLoading(false)
    }

    const getOwnedTokenAmount = async() => {
        setOwnedTokenAmount(Math.floor(await getTokenAmount() * 100) / 100)
    }

    const getRewardAmounts = async() => {
        let allAmounts = []
        let total = 0
        for(let item of stakedNfts){
            let amount = Math.floor(await getRewardAmount(poolData, item.stakingData) * 100) / 100
            allAmounts.push(amount)
            total += amount
        }
        setRewardAmounts(allAmounts)
        setTotalRewardAmount(Math.floor(total *100) / 100)
    }
    
    return <div className="main">
        <div className='main-background'>
            <img src ={BACKGROUND} alt="background"></img>
        </div>
        <div className='back-group'>
            <div className='main-logo'>
                <div className="pad"/>
                <div className='wallet-position'><WalletMultiButton></WalletMultiButton></div>
            </div>
            <div className='penguin-title'>
                <h1 className="title">SAGA RATS</h1>
                <p className="description">Connect your wallet. Select the saga rats that you want to be staked. Click "STAKE" in other to stake the selected ones or "STAKE ALL" if you don't want to bother. That's it now you are earning some valuable $RAT!!!</p>
            </div>
            <div className='progress'>
                <div className="progress-bar" role="progressbar"  aria-valuemin={0} aria-valuemax={100} style={{width: (100*(poolData==null ? 0 : poolData.totalNumber)/InfoStaking.totalSupply)+"%", fontFamily:"Arial"}}>
                    {(100*(poolData==null ? 0 : poolData.totalNumber)/InfoStaking.totalSupply)+"% staked"}
                </div>
            </div>
            <div className='row'>
                <div className='main-panel col-lg-6'>
                    <div className="main-panel-header">
                        <div className='main-panel-header-name'>
                            WALLET
                        </div>
                        <div className='main-panel-header-value'>
                            <span className='main-panel-header-amount'>{ownedTokenAmount}</span> $RAT
                        </div>
                    </div>
                    <div className='main-panel-content'>
                        {/* <div className='main-panel-content-header'>
                            <div>
                                <img src={PENGUIN} alt="penguin header" onClick={async()=>{
                                    if(publicKey!=null)
                                        await getNftsForOwner(publicKey)
                                }}></img>
                            </div>
                        </div> */}
                        <hr></hr>
                        <div className='main-panel-content-body'>
                        {
                            isNftLoading ?
                                <div className='loading-bar'><CircularProgress disableShrink size="10rem" color="inherit"></CircularProgress></div>
                            :
                                <div className="nft-panel-content">
                                {
                                    ownedNfts.map((item, idx)=>{
                                        return <NftCard key={idx} data={item} callbackFunc={handleSelectNft}></NftCard>
                                    })
                                }
                                </div>
                        }
                        </div>
                    </div>
                    <div className='main-panel-actions'>
                        <div className="wrap-stake">
                            <button className='btn btn-stake' onClick={async()=>{
                                try{
                                    let items = ownedNfts.filter(function(item){return item.selected==true})
                                    if(items.length==0){
                                        openNotification('warning', "You didn't select any NFT(s) to stake")
                                        return;
                                    }
                                    await stakeNfts(items)
                                    openNotification('success', 'Stake success')
                                    await getPoolData()
                                    getOwnedNfts()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Stake failed')
                                }
                            }}>Stake</button>
                        </div>
                        <div className='wrap-stake'>
                            <button className='btn btn-stake-all' onClick={async()=>{
                                try{
                                    if(ownedNfts.length==0){
                                        openNotification('warning', "You don't have any NFTs you can stake")
                                        return;
                                    }
                                    await stakeNfts(ownedNfts)
                                    openNotification('success', 'Stake success')
                                    await getPoolData()
                                    getOwnedNfts()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Stake failed')
                                }
                            }}>Stake All</button>
                        </div>
                    </div>
                </div>
                <div className='main-panel col-lg-6'>
                    <div className="main-panel-header">
                        <div className='main-panel-header-name'>
                            EARNED
                        </div>
                        <div className='main-panel-header-value'>
                            <span className='main-panel-header-amount'>{totalRewardAmount}</span> $RAT
                        </div>
                    </div>
                    <div className='main-panel-content'>
                        {/* <div className='main-panel-content-header'>
                            <div>
                                <img src={PENGUIN} alt="penguin header" onClick={async()=>{
                                    if(publicKey!=null)
                                        await getStakedNftsForOwner(publicKey)
                                }}></img>
                            </div>
                        </div> */}
                        <hr></hr>
                        <div className='main-panel-content-body'>
                        {
                            isStakedNftLoading ?
                                <div className='loading-bar'><CircularProgress disableShrink size="10rem" color="inherit"></CircularProgress></div>
                            :
                                <div className="nft-panel-content">
                                {
                                    stakedNfts.map((item, idx)=>{
                                        return <StakedNftCard key={idx} data={item} lockStatus={item.stakingData.lockStatus==1 && item.stakingData.lockTime.toNumber()+poolData.lockDuration>(new Date().getTime()/1000)} rewardAmount={rewardAmounts[idx]} callbackFunc={handleSelectStakeNft}></StakedNftCard>
                                    })
                                }
                                </div>
                        }	
                        </div>
                    </div>
                    <div className='main-panel-actions'>
                        <div className='wrap-unstake'>
                            <button className='btn btn-unstake' onClick={async()=>{
                                try{
                                    let currentTime = new Date().getTime() / 1000
                                    let items = stakedNfts.filter(function(item){return item.selected==true && !(item.stakingData.lockStatus==1 && item.stakingData.lockTime.toNumber()+poolData.lockDuration>currentTime)})
                                    if(items.length==0){
                                        openNotification('warning', "You didn't select any NFT(s) to unstake")
                                        return
                                    }
                                    await unstakeNfts(items)
                                    openNotification('success', 'Unstake success')
                                    await getPoolData()
                                    getOwnedNfts()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Unstake failed')
                                }
                            }}>Unstake</button>
                        </div>
                        <div className='wrap-unstake'>
                            <button className='btn btn-unstake-all' onClick={async()=>{
                                try{
                                    let currentTime = new Date().getTime() / 1000
                                    let items = stakedNfts.filter(function(item){return !(item.stakingData.lockStatus==1 && item.stakingData.lockTime.toNumber()+poolData.lockDuration>currentTime)})
                                    if(items.length==0){
                                        openNotification('warning', "You don't have any NFT(s) to unstake")
                                        return;
                                    }
                                    await unstakeNfts(items)
                                    openNotification('success', 'Unstake success')
                                    await getPoolData()
                                    getOwnedNfts()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Unstake failed')
                                }
                            }}>Unstake All</button>
                        </div>
                        <div className='wrap-unstake'>
                            <button className='btn btn-claim' onClick={async()=>{
                                try{
                                    if(stakedNfts.length==0){
                                        openNotification('warning', "You don't have any staked NFTs")
                                        return
                                    }
                                    await claim(stakedNfts)
                                    openNotification('success', 'Claim success')
                                    await getPoolData()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Claim failed')
                                }
                            }}>Claim</button>
                        </div>
                    </div>
                    <div className='main-panel-actions'>
                        <div className='wrap-unstake'>
                            <button className='btn btn-unstake' onClick={async()=>{
                                try{
                                    let items = stakedNfts.filter(function(item){return item.selected==true && item.stakingData.lockStatus==0})
                                    if(items.length==0){
                                        openNotification('warning', "You didn't select any NFT(s) to lock")
                                        return;
                                    }
                                    await lockNfts(items)
                                    openNotification('success', 'Unstake success')
                                    await getPoolData()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Unstake failed')
                                }
                            }}>LOCK</button>
                        </div>
                        <div className='wrap-unstake'>
                            <button className='btn btn-unstake-all' onClick={async()=>{
                                try{
                                    let items = stakedNfts.filter(function(item){return item.stakingData.lockStatus==0})
                                    if(items.length==0){
                                        openNotification('warning', "You don't have any NFT(s) you can lock")
                                        return;
                                    }
                                    await lockNfts(items)
                                    openNotification('success', 'Lock success')
                                    await getPoolData()
                                    getStakedNfts()
                                }catch(err){
                                    openNotification('error', 'Lock failed')
                                }
                            }}>LOCK ALL</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className='footer'>
            <div>Saga Rats @2024 All Rights Reserved </div>
            <div>
                <a href="https://twitter.com/sagarats24" target="_blank"><img className="twitter-link" src={TWITTER_IMG_Light} width="32px" alt="Twitter"></img></a>
                <a href="https://discord.com/invite/6jXEEye3Y4" target="_blank"><img className="twitter-link" src={DISCORD_IMG} width="32px" alt="Twitter"></img></a>
                <a href="https://www.tensor.trade/trade/saga_rats_alpha" target="_blank"><img className="twitter-link" src={TENSOR_IMG} width="32px" alt="Twitter"></img></a>
            </div>
        </div>
    </div>
}