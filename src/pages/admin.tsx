
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

export default function AdminPage(){
    const {getPoolData, updatePoolProperties} = useProgram()
    const {publicKey} = useWallet()

    const [poolData, setPoolData] = useState<any>(null)
    const [rewardPeriod, setRewardPeriod] = useState('')
    const [rewardAmount, setRewardAmount] = useState('')
    const [rewardAmountForLock, setRewardAmountForLock] = useState('')
    const [lockDuration, setLockDuration] = useState('')

    useEffect(()=>{
        getStakingPoolData()
	},[])

    useEffect(()=>{
        if(poolData!=null){
            setRewardPeriod(poolData.rewardPeriod)
            setRewardAmount(""+poolData.rewardAmount / 10**InfoStaking.rewardDecimals)
            setRewardAmountForLock(""+poolData.rewardAmountForLock / 10**InfoStaking.rewardDecimals)
            setLockDuration(poolData.lockDuration)
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
                <div style={{height: "100px"}}/>
                <div className='wallet-position'><WalletMultiButton></WalletMultiButton></div>
            </div>
            <div className="disclaimer-panel">
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
                <div className="disclaimer-footer">
                    <Button className="btn-agree" color="success" variant="contained" onClick={async()=>{
                    try{
                        await updatePoolProperties(Number(rewardPeriod), Number(rewardAmount), Number(rewardAmountForLock), Number(lockDuration))
                        openNotification('success', 'Update success')
                        await getStakingPoolData()
                    }catch(err){
                        openNotification('error', 'Update failed')
                    }
                }}>Update</Button>
                </div>
            </div>
        </div>
        <div className='footer'>
            <div>Saga Rats Alpha @2024 All Rights Reserved </div>
            <div>
                <a href="https://twitter.com/sagarats24" target="_blank"><img className="twitter-link" src={TWITTER_IMG_Light} width="32px" alt="Twitter"></img></a>
                <a href="https://discord.com/invite/6jXEEye3Y4" target="_blank"><img className="twitter-link" src={DISCORD_IMG} width="32px" alt="Twitter"></img></a>
                <a href="https://www.tensor.trade/trade/saga_rats_alpha" target="_blank"><img className="twitter-link" src={TENSOR_IMG} width="32px" alt="Twitter"></img></a>
            </div>
        </div>
    </div>
}