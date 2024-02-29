
import { useState, useEffect } from 'react';
import { useWallet } from "@solana/wallet-adapter-react"
import { useProgram } from "../utils/useProgram"

import BACKGROUND from '../assets/images/background.png'
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { InfoStaking, openNotification } from '../utils/constants';

import { Button} from '@mui/material';

export default function AdminPage(){
    const {getPoolData, updatePoolProperties} = useProgram()
    const {publicKey} = useWallet()

    const [poolData, setPoolData] = useState<any>(null)
    const [rewardAmount, setRewardAmount] = useState('')
    const [rewardAmountForLock, setRewardAmountForLock] = useState('')

    useEffect(()=>{
        getStakingPoolData()
	},[])

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
                <p id="parent-modal-description">Current reward amount is {poolData==null ? 0 : poolData.rewardAmount / (10**InfoStaking.rewardDecimals)} $RAT for normal NFT and {poolData==null ? 0 : poolData.rewardAmountForLock / (10**InfoStaking.rewardDecimals)} $RAT for locked NFT</p>
                <div className="input-group mb-3">
                    <span className="input-group-text">Reward Amount</span>
                    <input name="reward amount"  type="text" className="form-control" onChange={(event)=>{setRewardAmount(event.target.value)}} value={rewardAmount}/>
                </div>
                <div className="input-group">
                    <span className="input-group-text">Reward Amount for Lock</span>
                    <input name="reward amount for lock"  type="text" className="form-control" onChange={(event)=>{setRewardAmountForLock(event.target.value)}} value={rewardAmountForLock}/>
                </div>
                <div className="disclaimer-footer">
                    <Button className="btn-agree" color="success" variant="contained" onClick={async()=>{
                    try{
                        await updatePoolProperties(Number(rewardAmount), Number(rewardAmountForLock))
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
            <div>
                <p>@2024, Saga Rat</p>
                <p>All rights reserved</p>
            </div>
        </div>
    </div>
}