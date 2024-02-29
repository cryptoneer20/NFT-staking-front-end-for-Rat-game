import axios from 'axios'
import { useEffect, useState } from 'react'

export default function StakedNftCard(props : any){
    const [nftDetailInfo, setNftDetailInfo] = useState<any>(null)

    useEffect(()=>{
        getNftDetailInfo()
    }, [])

    const getNftDetailInfo = async() => {
        let data = (await axios.get(props.data.metadata.uri)).data
        setNftDetailInfo(data)
    }

    return <div className='nft' onClick={()=>{
        if(!props.lockStatus)
            props.callbackFunc(props.data.stakingDataAddress)
    }}>
        {
            nftDetailInfo!=null &&
            <>
                <img className={props.lockStatus ? "lock-border" : props.data.selected ? "red-border" : "normal-border"} src={nftDetailInfo.image} alt="Penguin"  />
                <p style={{color : "#e9ffc5"}}>{nftDetailInfo.name + (props.lockStatus ? "   :   Locked" : props.data.stakingData.lockStatus > 0 ? " : Once locked before" : "")}</p>
            </>
        }
        <p style={{color : "#e9ffc5"}}>$RAT | {props.rewardAmount}</p>
    </div>
}