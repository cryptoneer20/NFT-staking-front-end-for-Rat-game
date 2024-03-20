
import { useState, useEffect } from 'react';
import { useWallet } from "@solana/wallet-adapter-react"
import { useProgram } from "../utils/useProgram"

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { InfoStaking, openNotification } from '../utils/constants';

import { Button} from '@mui/material';

import BACKGROUND from '../assets/images/background.png'
import TWITTER_IMG_Light from '../assets/images/twitter.png'
import DISCORD_IMG from '../assets/images/discord.png'
import TENSOR_IMG from '../assets/images/tensor.png'
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function AdminPage(){
    const {getPoolData, updatePoolProperties, redeemToken} = useProgram()
    const {publicKey} = useWallet()

    const [poolData, setPoolData] = useState<any>(null)
    const [rewardPeriod, setRewardPeriod] = useState('')
    const [rewardAmount, setRewardAmount] = useState('')
    const [rewardAmountForLock, setRewardAmountForLock] = useState('')
    const [lockDuration, setLockDuration] = useState('')
    const [feeAmount, setFeeAmount] = useState('')
    const [redeemAmount, setRedeemAmount] = useState('')

    useEffect(()=>{
        getStakingPoolData()
	},[])

    useEffect(()=>{
        if(poolData!=null){
            setRewardPeriod(poolData.rewardPeriod)
            setRewardAmount(""+poolData.rewardAmount / 10**InfoStaking.rewardDecimals)
            setRewardAmountForLock(""+poolData.rewardAmountForLock / 10**InfoStaking.rewardDecimals)
            setLockDuration(poolData.lockDuration)
            setFeeAmount(""+poolData.unstakeFeeAmount / LAMPORTS_PER_SOL)
        }
    }, [poolData])

    const getStakingPoolData = async() => {
        try{
            setPoolData(await getPoolData())
        }catch(err){
            setPoolData(null)
        }
    }

    return <div className="main">
        <div className='main-background'>
            <img src ={BACKGROUND} alt="background"></img>
        </div>
        <div className='back-group'>
            <div className='main-logo'>
                <div className='wallet-position'><WalletMultiButton></WalletMultiButton></div>
            </div>
            <div className='community-header'>
                <div>
                    <a href="https://twitter.com/sagarats24" target="_blank"><img className="twitter-link" src={TWITTER_IMG_Light} width="40px" alt="Twitter"></img></a>
                    <a href="https://discord.com/invite/6jXEEye3Y4" target="_blank"><img className="twitter-link" src={DISCORD_IMG} width="40px" alt="Twitter"></img></a>
                    <a href="https://www.tensor.trade/trade/saga_rats_alpha" target="_blank"><img className="twitter-link" src={TENSOR_IMG} width="40px" alt="Twitter"></img></a>
                </div>
            </div>
            <div className="disclaimer-panel">
                <div className='disclaimer-content'>
                    <h2 id="parent-modal-title">Administrator Panel</h2>
                    {
                        poolData!=null &&
                        <p id="parent-modal-description">Current reward amount is {poolData.rewardAmount / (10**InfoStaking.rewardDecimals)} $FOOD per {poolData.rewardPeriod}sec for normal NFT and {poolData.rewardAmountForLock / (10**InfoStaking.rewardDecimals)} $FOOD per {poolData.rewardPeriod}sec for locked NFT. And lock period is {poolData.lockDuration}sec so you can get {poolData.lockDuration/poolData.rewardPeriod*poolData.rewardAmountForLock/10**InfoStaking.rewardDecimals} $FOOD in LOCK time.</p>
                    }
                    <div className="input-group mb-1">
                        <span className="input-group-text">Period</span>
                        <input name="reward period"  type="text" className="form-control" onChange={(event)=>{setRewardPeriod(event.target.value)}} value={rewardPeriod}/>
                        <span className="input-group-text">sec</span>
                    </div>
                    <div className="input-group mb-1">
                        <span className="input-group-text">Reward Amount</span>
                        <input name="reward amount"  type="text" className="form-control" onChange={(event)=>{setRewardAmount(event.target.value)}} value={rewardAmount}/>
                        <span className="input-group-text">$FOOD</span>
                    </div>
                    <div className="input-group mb-1">
                        <span className="input-group-text">Reward Amount for Lock</span>
                        <input name="reward amount for lock"  type="text" className="form-control" onChange={(event)=>{setRewardAmountForLock(event.target.value)}} value={rewardAmountForLock}/>
                        <span className="input-group-text">$FOOD</span>
                    </div>
                    <div className="input-group mb-1">
                        <span className="input-group-text">Lock Period</span>
                        <input name="lock duration"  type="text" className="form-control" onChange={(event)=>{setLockDuration(event.target.value)}} value={lockDuration}/>
                        <span className="input-group-text">sec</span>
                    </div>
                    <div className="input-group mb-1">
                        <span className="input-group-text">Unstake Fee Amount</span>
                        <input name="fee amount"  type="text" className="form-control" onChange={(event)=>{setFeeAmount(event.target.value)}} value={feeAmount}/>
                        <span className="input-group-text">SOL</span>
                    </div>
                    <div className="disclaimer-footer">
                        <Button className="btn-agree" color="success" variant="contained" onClick={async()=>{
                            try{
                                await updatePoolProperties(Number(rewardPeriod), Number(rewardAmount), Number(rewardAmountForLock), Number(lockDuration), Number(feeAmount))
                                openNotification('success', 'Update success')
                                await getStakingPoolData()
                            }catch(err){
                                openNotification('error', 'Update failed')
                            }
                        }}>Update</Button>
                    </div>
                    <p className='mt-3 mb-1'>Pool has {poolData!=null ? poolData.tokenAmount : 0} $FOOD</p>
                    <div className="input-group mb-3">
                        <input name="redeem amount"  type="text" className="form-control" style={{textAlign: 'left'}} onChange={(event)=>{setRedeemAmount(event.target.value)}} value={redeemAmount}/>
                        <button type="button" className='btn btn-success' onClick={async()=>{
                            try{
                                const amount = Number(redeemAmount)
                                await redeemToken(amount)
                                openNotification('success', 'redeemToken success')
                            }catch(err){
                                openNotification('error', 'redeemToken failed')
                            }
                        }}>Redeem Token</button>
                    </div>
                </div>
            </div>
        </div>
        <div className='footer'>
            <div>Saga Rats Alpha ©2024 All Rights Reserved </div>
            <div className="community-part">
                <a href="https://twitter.com/sagarats24" target="_blank"><img className="twitter-link" src={TWITTER_IMG_Light} width="32px" alt="Twitter"></img></a>
                <a href="https://discord.com/invite/6jXEEye3Y4" target="_blank"><img className="twitter-link" src={DISCORD_IMG} width="32px" alt="Twitter"></img></a>
                <a href="https://www.tensor.trade/trade/saga_rats_alpha" target="_blank"><img className="twitter-link" src={TENSOR_IMG} width="32px" alt="Twitter"></img></a>
            </div>
        </div>
    </div>
}