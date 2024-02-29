import { useWallet } from "@solana/wallet-adapter-react"
import { useProgram } from "../utils/useProgram"
import { useEffect, useState } from "react"
import { InfoStaking, openNotification } from "../utils/constants"
import NftCard from "../components/NftCard"
import StakedNftCard from "../components/StakedNftCard"
import { CircularProgress } from '@mui/material';

import BACKGROUND from '../assets/images/background.png'
import MAIN_LOGO from '../assets/images/main_logo.png'
import PENGUIN from '../assets/images/content-header.png'
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PublicKey } from "@solana/web3.js"

export default function NftStake(){
    const {getNftsForOwner, getStakedNftsForOwner, getPoolData, stakeNfts, unstakeNfts, claim} = useProgram()
    const {publicKey} = useWallet()
    
    const [poolData, setPoolData] = useState<any>(null)
    const [ownedNfts, setOwnedNfts] = useState<any[]>([])
    const [stakedNfts, setStakedNfts] = useState<any[]>([])

    const [isNftLoading, setIsNftLoading] = useState(false)
	const [isStakedNftLoading, setIsStakedNftLoading] = useState(false)

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
    },[publicKey])


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
    
    return <div className="main">
        <div className='main-background'>
            <img src ={BACKGROUND} alt="background"></img>
        </div>
        <div className='back-group'>
            <div className='main-logo'>
                <img src={MAIN_LOGO} width="120px" alt="Logo"></img>
                <div className='wallet-position'><WalletMultiButton></WalletMultiButton></div>
            </div>
            <div className='progress'>
                <div className="progress-bar" role="progressbar"  aria-valuemin={0} aria-valuemax={100} style={{width: (100*(poolData==null ? 0 : poolData.totalNumber)/InfoStaking.totalSupply)+"%", fontFamily:"Arial"}}>
                    {(poolData==null ? 0 : poolData.totalNumber)+"/"+InfoStaking.totalSupply}
                </div>
            </div>
            <div className='row'>
                <div className='main-panel col-lg-6'>
                    <div className="main-panel-header">
                        <div className='main-panel-header-name'>
                            WALLET
                        </div>
                        <div className='main-panel-header-value'>
                            <span className='main-panel-header-amount'>{0}</span> $HIT
                        </div>
                    </div>
                    <div className='main-panel-content'>
                        <div className='main-panel-content-header'>
                            <div>
                                <img src={PENGUIN} alt="penguin header" onClick={async()=>{
                                    if(publicKey!=null)
                                        await getNftsForOwner(publicKey)
                                }}></img>
                            </div>
                        </div>
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
                                    await stakeNfts(ownedNfts.filter(function(item){return item.selected==true}))
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
                            <span className='main-panel-header-amount'>{0}</span> $HIT
                        </div>
                    </div>
                    <div className='main-panel-content'>
                        <div className='main-panel-content-header'>
                            <div>
                                <img src={PENGUIN} alt="penguin header" onClick={async()=>{
                                    if(publicKey!=null)
                                        await getStakedNftsForOwner(publicKey)
                                }}></img>
                            </div>
                        </div>
                        <hr></hr>
                        <div className='main-panel-content-body'>
                        {
                            isStakedNftLoading ?
                                <div className='loading-bar'><CircularProgress disableShrink size="10rem" color="inherit"></CircularProgress></div>
                            :
                                <div className="nft-panel-content">
                                {
                                    stakedNfts.map((item, idx)=>{
                                        return <StakedNftCard key={idx} data={item} callbackFunc={handleSelectStakeNft}></StakedNftCard>
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
                                    await unstakeNfts(stakedNfts.filter(function(item){return item.selected==true}))
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
                                    await unstakeNfts(stakedNfts)
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
                </div>
            </div>
        </div>
        <div className='footer'>
            <div>
                <p>@2024, Saga Rat</p>
                <p>All rights reserved</p>
            </div>
        </div>
    </div>
}